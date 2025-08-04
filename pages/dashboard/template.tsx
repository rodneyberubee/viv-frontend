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
const daysOfWeek = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// List of selectable time zones
const usTimeZones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
];

// Helper: Validate time format
function isValidTimeFormat(value: string) {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i.test(value);
}

export default function DashboardTemplate({ restaurantId }: DashboardProps) {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({
    maxReservations: 0,
    futureCutoff: 0,
    timeZone: 'America/Los_Angeles',
  });
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
      } catch {
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
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
      setConfig(prev => ({
        ...prev,
        ...(data.config || data),
        maxReservations: data.config?.maxReservations ?? data.maxReservations ?? prev.maxReservations ?? 0,
        futureCutoff: data.config?.futureCutoff ?? data.futureCutoff ?? prev.futureCutoff ?? 0,
        timeZone: data.config?.timeZone ?? data.timeZone ?? prev.timeZone ?? 'America/Los_Angeles',
      }));
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

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setConfig((prev) => ({ ...prev, [name]: value })); };

  const updateConfig = async () => {
    // Validate times before sending
    for (const day of daysOfWeek) {
      const open = config[`${day}Open`];
      const close = config[`${day}Close`];
      if ((open && !isValidTimeFormat(open)) || (close && !isValidTimeFormat(close))) {
        alert(`Invalid time format for ${day}. Use HH:mm or h:mm AM/PM.`);
        return;
      }
    }

    if (!jwtToken) return;
    try {
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ ...config, restaurantId }),
      });
      alert('Config updated');
    } catch (err) { console.error('[ERROR] Updating config failed:', err); }
  };

  // Ensure timeZone is always valid for the dropdown
  const validTimeZone = usTimeZones.includes(config.timeZone || '') ? config.timeZone : 'America/Los_Angeles';

  const restaurantTz = validTimeZone;

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!jwtToken) return <div className="p-8 text-center text-red-600">Authentication failed. Please log in again.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-8 space-y-8">
        {/* Config Section */}
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
              <select name="timeZone" value={validTimeZone} onChange={handleConfigChange} className="p-2 border rounded w-full">
                {usTimeZones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={updateConfig} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">
              Update Config
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
