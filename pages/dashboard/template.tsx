import React, { useEffect, useState, useRef } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
};

type DashboardProps = { restaurantId: string };

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

// Parse JWT to get expiration
const parseJwt = (token: string): { exp: number } | null => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const DashboardTemplate = ({ restaurantId }: DashboardProps) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({ maxReservations: 0, futureCutoff: 0, timeZone: 'America/Los_Angeles' });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.now().setZone('America/Los_Angeles').startOf('day'));
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

  // Refresh token
  const refreshToken = async (token: string) => {
    try {
      const res = await fetch('https://api.vivaitable.com/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('jwtToken', data.token);
        setJwtToken(data.token);
        scheduleTokenRefresh(data.token);
        return data.token;
      } else {
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
      }
    } catch {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }
    return null;
  };

  // Schedule refresh 5 mins before expiration
  const scheduleTokenRefresh = (token: string) => {
    const decoded = parseJwt(token);
    if (!decoded) return;
    const expiresIn = decoded.exp * 1000 - Date.now();
    const refreshBefore = expiresIn - 5 * 60 * 1000;
    if (refreshBefore > 0) {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => refreshToken(token), refreshBefore);
    }
  };

  // Verify token & refresh if needed
  async function verifyToken(token: string, skipExpirationCheck = false) {
    if (!skipExpirationCheck) {
      const decoded = parseJwt(token);
      if (!decoded || Date.now() >= decoded.exp * 1000) {
        token = await refreshToken(token) || '';
        if (!token) return;
      }
    }

    try {
      const res = await fetch('https://api.vivaitable.com/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
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
    } catch (err) {
      console.error('[ERROR] Verifying token failed:', err);
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }

  // Init token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const storedJwt = localStorage.getItem('jwtToken');

    if (urlToken) {
      // Always trust new URL tokens first
      verifyToken(urlToken, true);
    } else if (storedJwt) {
      verifyToken(storedJwt);
    } else {
      window.location.href = '/login';
    }

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, []);

  // API helpers
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
      setConfig(data);
    } catch (err) {
      console.error('[ERROR] Fetching config failed:', err);
    }
  }

  async function fetchReservations() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/reservations`, { headers: { Authorization: `Bearer ${jwtToken}` } });
      const data = await res.json();
      const reservationsFromServer = data.reservations || [];
      const blankRowTemplate = editableFields.reduce((acc, key) => {
        acc[key] = key === 'date' ? selectedDate.toFormat('yyyy-MM-dd') : '';
        return acc;
      }, { restaurantId } as any);
      setReservations([...reservationsFromServer, blankRowTemplate]);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  useEffect(() => { if (jwtToken) { fetchConfig(); fetchReservations(); } }, [jwtToken, config.timeZone, selectedDate]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined, index: number) => {
    const { name, value } = e.target;
    setReservations((prev) => prev.map((res, i) => (res.id === id || (!res.id && i === index)) ? { ...res, [name]: value } : res));
  };

  const updateConfig = async () => {
    if (!jwtToken) return;
    try {
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ ...config, restaurantId }),
      });
      alert('Config updated');
    } catch (err) {
      console.error('[ERROR] Updating config failed:', err);
    }
  };

  const updateReservations = async () => {
    if (!jwtToken) return;
    try {
      const payload = reservations.filter((res) => res.confirmationCode).map(({ id, ...fields }) => ({ recordId: id, updatedFields: { ...fields, restaurantId } }));
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
    } catch (err) {
      console.error('[ERROR] Updating reservations failed:', err);
    }
  };

  const restaurantTz = config.timeZone || 'America/Los_Angeles';
  const filteredReservations = reservations.filter((r) => {
    const dt = DateTime.fromISO(r.date, { zone: restaurantTz });
    return dt.isValid && dt.hasSame(selectedDate, 'day') && ((r.name && r.timeSlot) || r.status === 'blocked');
  }).sort((a, b) =>
    DateTime.fromISO(`${a.date}T${a.timeSlot || '00:00'}`, { zone: restaurantTz }).toMillis() -
    DateTime.fromISO(`${b.date}T${b.timeSlot || '00:00'}`, { zone: restaurantTz }).toMillis()
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <nav className="space-y-4">
          <a className="block font-medium text-orange-500">Reservations</a>
          <a className="block text-gray-600 hover:text-orange-500">Availability</a>
          <a className="block text-gray-600 hover:text-orange-500">Settings</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reservations</h1>
          <button onClick={updateReservations} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">
            Update Reservations
          </button>
        </div>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Reservations for {selectedDate.toFormat('MMMM dd, yyyy')}</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {editableFields.map((key) => (
                  <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">{headerLabels[key] || key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res, i) => (
                <tr key={res.id || i} className="border-t hover:bg-gray-50">
                  {editableFields.map((key) => (
                    <td key={key} className="px-3 py-2">
                      <input type={key === 'timeSlot' ? 'time' : key === 'date' ? 'date' : 'text'} name={key} value={String(res[key] ?? '')} onChange={(e) => handleReservationEdit(e, res.id, i)} className="w-full p-1 rounded border border-transparent focus:border-orange-500 focus:ring focus:ring-orange-200" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Date Switcher Below the Table */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <button onClick={() => setSelectedDate(prev => prev.minus({ days: 1 }))} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Prev</button>
            <input type="date" value={selectedDate.toFormat('yyyy-MM-dd')} onChange={(e) => setSelectedDate(DateTime.fromISO(e.target.value, { zone: restaurantTz }))} className="p-2 border rounded" />
            <button onClick={() => setSelectedDate(prev => prev.plus({ days: 1 }))} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Next</button>
          </div>
        </section>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Restaurant Config</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Max Reservations</label>
              <input name="maxReservations" type="number" value={String(config.maxReservations ?? '')} onChange={handleConfigChange} className="p-2 border rounded w-full" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Future Cutoff (days)</label>
              <input name="futureCutoff" type="number" value={String(config.futureCutoff ?? '')} onChange={handleConfigChange} className="p-2 border rounded w-full" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Timezone</label>
              <input name="timeZone" type="text" value={config.timeZone || ''} onChange={handleConfigChange} placeholder="e.g., America/Los_Angeles" className="p-2 border rounded w-full" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardTemplate;
