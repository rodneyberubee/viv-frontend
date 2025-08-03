import React, { useEffect, useState, useRef } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
};

type DashboardProps = { restaurantId: string };
type JWTPayload = { exp: number; restaurantId: string; email: string };

const parseJwt = (token: string): JWTPayload | null => {
  if (typeof window === 'undefined') return null;
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const headerLabels: Record<string, string> = {
  date: 'Date',
  timeSlot: 'Time Slot',
  name: 'Name',
  partySize: 'Party Size',
  contactInfo: 'Contact Info',
  status: 'Status',
  confirmationCode: 'Confirmation Code',
};

const editableFields = ['date', 'timeSlot', 'name', 'partySize', 'contactInfo', 'status', 'confirmationCode'];

const DashboardTemplate: React.FC<DashboardProps> = ({ restaurantId }) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({ maxReservations: 0, futureCutoff: 0, timeZone: 'America/Los_Angeles' });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.now().setZone('America/Los_Angeles').startOf('day'));
  const lastRefreshRef = useRef<number>(0);

  const isTokenExpired = (token: string) => {
    const decoded = parseJwt(token);
    return !decoded || Date.now() >= decoded.exp * 1000;
  };

  const scheduleTokenRefresh = (token: string) => {
    const decoded = parseJwt(token);
    if (!decoded) return;
    const expiresIn = decoded.exp * 1000 - Date.now();
    const refreshBefore = expiresIn - 5 * 60 * 1000;
    if (refreshBefore > 0) {
      setTimeout(async () => {
        try {
          const res = await fetch('https://api.vivaitable.com/api/auth/refresh', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('jwtToken', data.token);
            setJwtToken(data.token);
            scheduleTokenRefresh(data.token);
          } else {
            localStorage.removeItem('jwtToken');
            window.location.href = '/login';
          }
        } catch {
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
        }
      }, refreshBefore);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const storedJwt = localStorage.getItem('jwtToken');

    async function verifyToken(token: string) {
      try {
        const res = await fetch('https://api.vivaitable.com/api/auth/login/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('jwtToken', data.token);
          setJwtToken(data.token);
          scheduleTokenRefresh(data.token);
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
        }
      } catch {
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
      } finally { setLoading(false); }
    }

    if (urlToken) verifyToken(urlToken);
    else if (storedJwt && !isTokenExpired(storedJwt)) {
      setJwtToken(storedJwt);
      scheduleTokenRefresh(storedJwt);
      setLoading(false);
    } else {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }
  }, [restaurantId]);

  async function safeFetch(url: string, options: any) {
    const res = await fetch(url, options);
    if (res.status === 401) {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    return res;
  }

  async function fetchConfig() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/config`, { headers: { Authorization: `Bearer ${jwtToken}` } });
      const data = await res.json();
      setConfig(data.config || data);
    } catch (err) { console.error('[ERROR] Fetching config failed:', err); }
  }

  async function fetchReservations() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/reservations`, { headers: { Authorization: `Bearer ${jwtToken}` } });
      const data = await res.json();
      const reservationsFromServer = data.reservations || [];
      const blankRowTemplate = editableFields.reduce((acc, key) => { acc[key] = key === 'date' ? selectedDate.toFormat('yyyy-MM-dd') : ''; return acc; }, { restaurantId } as any);
      setReservations([...reservationsFromServer, blankRowTemplate]);
    } catch (err) { console.error('[ERROR] Fetching reservations failed:', err); }
  }

  useEffect(() => { if (jwtToken) { fetchConfig(); fetchReservations(); } }, [jwtToken, config.timeZone, selectedDate]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setConfig((prev) => ({ ...prev, [name]: value })); };
  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined, index: number) => { const { name, value } = e.target; setReservations((prev) => prev.map((res, i) => res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res)); };

  const updateConfig = async () => {
    if (!jwtToken) return;
    try {
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ ...config, restaurantId }),
      });
      alert('Config updated');
    } catch (err) { console.error('[ERROR] Updating config failed:', err); }
  };

  const updateReservations = async () => {
    if (!jwtToken) return;
    try {
      const payload = reservations.filter((res) => res.confirmationCode)
        .map(({ id, ...fields }) => ({ recordId: id, updatedFields: { ...fields, restaurantId } }));
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
    } catch (err) { console.error('[ERROR] Updating reservations failed:', err); }
  };

  const restaurantTz = config.timeZone || 'America/Los_Angeles';

  const filteredReservations = reservations.filter(r => {
    const dt = DateTime.fromISO(r.date, { zone: restaurantTz });
    return dt.isValid && dt.hasSame(selectedDate, 'day') && ((r.name && r.timeSlot) || r.status === 'blocked');
  }).sort((a, b) => DateTime.fromISO(`${a.date}T${a.timeSlot || '00:00'}`, { zone: restaurantTz }).toMillis() - DateTime.fromISO(`${b.date}T${b.timeSlot || '00:00'}`, { zone: restaurantTz }).toMillis());

  const today = DateTime.now().setZone(restaurantTz).startOf('day');
  const weekStart = today.startOf('week'); const weekEnd = today.endOf('week');
  const monthStart = today.startOf('month'); const monthEnd = today.endOf('month');
  const validForMetrics = reservations.filter(r => r.status?.toLowerCase() === 'confirmed');
  const todayCount = validForMetrics.filter(r => DateTime.fromISO(r.date, { zone: restaurantTz }).hasSame(today, 'day')).length;
  const weekCount = validForMetrics.filter(r => { const d = DateTime.fromISO(r.date, { zone: restaurantTz }); return d >= weekStart && d <= weekEnd; }).length;
  const monthCount = validForMetrics.filter(r => { const d = DateTime.fromISO(r.date, { zone: restaurantTz }); return d >= monthStart && d <= monthEnd; }).length;

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!jwtToken) return <div className="p-8 text-center text-red-600">Authentication failed. Please log in again.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard for {restaurantId}</h1>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Today: {todayCount}</div>
        <div className="bg-white p-4 rounded shadow">This Week: {weekCount}</div>
        <div className="bg-white p-4 rounded shadow">This Month: {monthCount}</div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white p-4 rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr>{Object.values(headerLabels).map((label) => <th key={label} className="p-2 border">{label}</th>)}</tr>
          </thead>
          <tbody>
            {filteredReservations.map((res, index) => (
              <tr key={res.id || index}>
                {editableFields.map((field) => (
                  <td key={field} className="p-2 border">
                    <input type="text" name={field} value={res[field] || ''} onChange={(e) => handleReservationEdit(e, res.id, index)} className="w-full border p-1" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={updateReservations} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Update Reservations</button>
      </div>

      {/* Config Editor */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Config</h2>
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="flex space-x-2 mb-2">
            <label className="w-1/3">{key}</label>
            <input type="text" name={key} value={value || ''} onChange={handleConfigChange} className="w-2/3 border p-1" />
          </div>
        ))}
        <button onClick={updateConfig} className="mt-2 px-4 py-2 bg-green-600 text-white rounded">Update Config</button>
      </div>
    </div>
  );
};

export default DashboardTemplate;
