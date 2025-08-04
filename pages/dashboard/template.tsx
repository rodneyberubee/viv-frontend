import React, { useEffect, useState, useRef } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
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

// Parse JWT for expiration
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
  const [config, setConfig] = useState<Config>({ maxReservations: 0, futureCutoff: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(
    DateTime.now().setZone('America/Los_Angeles').startOf('day')
  );
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

  const restaurantTz = 'America/Los_Angeles';

  // Centralized logout
  const logout = () => {
    localStorage.removeItem('jwtToken');
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    window.location.href = '/login';
  };

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
        window.history.replaceState({}, '', window.location.pathname);
        return data.token;
      } else {
        logout();
      }
    } catch {
      logout();
    }
    return null;
  };

  // Schedule token refresh 5 minutes before expiration
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
        logout();
      }
    } catch (err) {
      console.error('[ERROR] Verifying token failed:', err);
      logout();
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
      verifyToken(urlToken, true);
    } else if (storedJwt) {
      verifyToken(storedJwt);
    } else {
      logout();
    }

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, []);

  // API helpers
  async function safeFetch(url: string, options: any) {
    const res = await fetch(url, options);
    if (res.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return res;
  }

  async function fetchConfig() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/config`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('[ERROR] Fetching config failed:', err);
    }
  }

  async function fetchReservations() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/reservations`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
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

  useEffect(() => { if (jwtToken) { fetchConfig(); fetchReservations(); } }, [jwtToken, selectedDate]);

  useEffect(() => {
    const bc = new BroadcastChannel('reservations');
    bc.onmessage = (e) => {
      if (e.data.type === 'reservationUpdate') {
        fetchReservations();
      }
    };
    return () => bc.close();
  }, [jwtToken]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined, index: number) => {
    const { name, value } = e.target;
    setReservations((prev) =>
      prev.map((res, i) =>
        res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res
      )
    );
  };

  const updateConfig = async () => {
    if (!jwtToken) return;
    const numericFields = ['maxReservations', 'futureCutoff'];
    const excluded = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'calibratedTime', 'tableName'];
    const cleaned = Object.fromEntries(
      Object.entries(config)
        .filter(([key]) => !excluded.includes(key))
        .map(([key, val]) => [
          key,
          numericFields.includes(key) ? parseInt(String(val), 10) || 0 : val
        ])
    );

    try {
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ ...cleaned, restaurantId }),
      });
      alert('Config updated');
    } catch (err) {
      console.error('[ERROR] Updating config failed:', err);
    }
  };

  const updateReservations = async () => {
    if (!jwtToken) return;
    try {
      const payload = reservations
        .filter((res) => Object.keys(res).length > 0 && res.confirmationCode)
        .map(({ id, rawConfirmationCode, dateFormatted, ...fields }) => ({
          recordId: id,
          updatedFields: { ...fields, restaurantId }
        }));

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

  const format24hr = (time: string) => {
    if (!time) return '';
    const dt = DateTime.fromISO(`2000-01-01T${time}`, { zone: restaurantTz });
    return dt.isValid ? dt.toFormat('HH:mm') : '';
  };

  const filteredReservations = reservations
    .filter(r => {
      const dt = DateTime.fromISO(r.date, { zone: restaurantTz });
      return dt.isValid && dt.hasSame(selectedDate, 'day') && ((r.name && r.timeSlot) || r.status === 'blocked');
    })
    .sort((a, b) => {
      const t1 = DateTime.fromISO(`${a.date}T${a.timeSlot || '00:00'}`, { zone: restaurantTz });
      const t2 = DateTime.fromISO(`${b.date}T${b.timeSlot || '00:00'}`, { zone: restaurantTz });
      return t1.toMillis() - t2.toMillis();
    });

  const today = DateTime.now().setZone(restaurantTz).startOf('day');
  const weekStart = today.startOf('week');
  const weekEnd = today.endOf('week');
  const monthStart = today.startOf('month');
  const monthEnd = today.endOf('month');
  const validForMetrics = reservations.filter(
    r =>
      r.status?.toLowerCase() === 'confirmed' &&
      DateTime.fromISO(r.date, { zone: restaurantTz }).isValid
  );
  const todayCount = validForMetrics.filter(r =>
    DateTime.fromISO(r.date, { zone: restaurantTz }).hasSame(today, 'day')
  ).length;
  const weekCount = validForMetrics.filter(r => {
    const d = DateTime.fromISO(r.date, { zone: restaurantTz });
    return d >= weekStart && d <= weekEnd;
  }).length;
  const monthCount = validForMetrics.filter(r => {
    const d = DateTime.fromISO(r.date, { zone: restaurantTz });
    return d >= monthStart && d <= monthEnd;
  }).length;

  const goToPrevDay = () => setSelectedDate(prev => prev.minus({ days: 1 }));
  const goToNextDay = () => setSelectedDate(prev => prev.plus({ days: 1 }));
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(DateTime.fromISO(e.target.value, { zone: restaurantTz }));
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

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
          <button
            onClick={updateReservations}
            className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
          >
            Update Reservations
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-gray-600">Today</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold">{weekCount}</p>
            <p className="text-gray-600">This Week</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold">{monthCount}</p>
            <p className="text-gray-600">This Month</p>
          </div>
        </div>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Reservations for {selectedDate.toFormat('MMMM dd, yyyy')}
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {editableFields.map((key) => (
                  <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                    {headerLabels[key] || key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res, i) => (
                <tr key={res.id || i} className="border-t hover:bg-gray-50">
                  {editableFields.map((key) => (
                    <td key={key} className="px-3 py-2">
                      <input
                        type={key === 'timeSlot' ? 'text' : key === 'date' ? 'date' : 'text'}
                        name={key}
                        value={key === 'timeSlot' ? format24hr(String(res[key])) : String(res[key] ?? '')}
                        onChange={(e) => handleReservationEdit(e, res.id, i)}
                        className="w-full p-1 rounded border border-transparent focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-center space-x-4 mt-4">
            <button onClick={goToPrevDay} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Prev</button>
            <input
              type="date"
              value={selectedDate.toFormat('yyyy-MM-dd')}
              onChange={onDateChange}
              className="p-2 border rounded"
            />
            <button onClick={goToNextDay} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Next</button>
          </div>
        </section>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Restaurant Config</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Max Reservations</label>
              <input
                name="maxReservations"
                type="number"
                value={String(config.maxReservations ?? '')}
                onChange={handleConfigChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Future Cutoff (days)</label>
              <input
                name="futureCutoff"
                type="number"
                value={String(config.futureCutoff ?? '')}
                onChange={handleConfigChange}
                className="p-2 border rounded w-full"
              />
            </div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <th key={day} className="border px-2 py-1 capitalize">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <td key={day + 'Open'} className="border px-1 py-1">
                      <input
                        type="text"
                        name={`${day}Open`}
                        value={config[`${day}Open`] || ''}
                        onChange={handleConfigChange}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <td key={day + 'Close'} className="border px-1 py-1">
                      <input
                        type="text"
                        name={`${day}Close`}
                        value={config[`${day}Close`] || ''}
                        onChange={handleConfigChange}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button
              onClick={updateConfig}
              className="mt-4 bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
            >
              Update Config
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardTemplate;
