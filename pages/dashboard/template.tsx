import React, { useEffect, useState, useRef } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
};

type DashboardProps = {
  restaurantId: string;
};

type JWTPayload = { exp: number; restaurantId: string; email: string };

const parseJwt = (token: string): JWTPayload | null => {
  if (typeof window === 'undefined') return null; // SSR safety
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
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DashboardTemplate: React.FC<DashboardProps> = ({ restaurantId }) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({ maxReservations: 0, futureCutoff: 0, timeZone: 'America/Los_Angeles' });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(
    DateTime.now().setZone('America/Los_Angeles').startOf('day')
  );
  const broadcastRef = useRef<BroadcastChannel | null>(null);
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
          const res = await fetch('https://api.vivaitable.com/api/auth/refresh', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
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
  }, []);

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
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/config`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      setConfig(data.config || data);
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

  useEffect(() => { if (jwtToken) { fetchConfig(); fetchReservations(); } }, [jwtToken, config.timeZone, selectedDate]);

  // Persistent BroadcastChannel listener
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard
    const bc = new BroadcastChannel('reservations');
    broadcastRef.current = bc;
    bc.onmessage = (e) => {
      console.log('[DEBUG] Broadcast received:', e.data);
      const validTypes = ['reservation.complete', 'reservation.change', 'reservation.cancel'];
      if (validTypes.includes(e.data.type) && e.data.restaurantId === restaurantId) {
        fetchReservations();
      }
    };
    return () => bc.close();
  }, [restaurantId]);

  // NEW: Poll refreshFlag endpoint with debounce
  useEffect(() => {
    if (!jwtToken) return;
    const interval = setInterval(async () => {
      try {
        const now = Date.now();
        if (now - lastRefreshRef.current < 2000) return; // debounce: 2s
        const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/refreshFlag`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        const data = await res.json();
        if (data.refresh === 1) {
          console.log('[DEBUG] Refresh flag received, refreshing reservations.');
          lastRefreshRef.current = now;
          await fetchReservations();

          // Optional: reset refresh flag in backend
          await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/resetRefreshFlag`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
        }
      } catch (err) {
        console.error('[ERROR] Polling refresh flag failed:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [jwtToken, restaurantId]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined, index: number) => {
    const { name, value } = e.target;
    setReservations((prev) => prev.map((res, i) => res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res));
  };

  const updateConfig = async () => {
    if (!jwtToken) return;
    const numericFields = ['maxReservations', 'futureCutoff'];
    const excluded = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'calibratedTime', 'tableName'];
    const cleaned = Object.fromEntries(Object.entries(config).filter(([key]) => !excluded.includes(key)).map(([key, val]) => [key, numericFields.includes(key) ? parseInt(String(val), 10) || 0 : val]));
    try {
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ ...cleaned, restaurantId }),
      });
      alert('Config updated');
    } catch (err) { console.error('[ERROR] Updating config failed:', err); }
  };

  const updateReservations = async () => {
    if (!jwtToken) return;
    try {
      const payload = reservations.filter((res) => Object.keys(res).length > 0 && res.confirmationCode)
        .map(({ id, rawConfirmationCode, dateFormatted, ...fields }) => ({ recordId: id, updatedFields: { ...fields, restaurantId } }));
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
    } catch (err) { console.error('[ERROR] Updating reservations failed:', err); }
  };

  const restaurantTz = config.timeZone || 'America/Los_Angeles';
  const format24hr = (time: string) => { if (!time) return ''; const dt = DateTime.fromISO(`2000-01-01T${time}`, { zone: restaurantTz }); return dt.isValid ? dt.toFormat('HH:mm') : ''; };

  const filteredReservations = reservations.filter(r => {
    const dt = DateTime.fromISO(r.date, { zone: restaurantTz });
    return dt.isValid && dt.hasSame(selectedDate, 'day') && ((r.name && r.timeSlot) || r.status === 'blocked');
  }).sort((a, b) => {
    const t1 = DateTime.fromISO(`${a.date}T${a.timeSlot || '00:00'}`, { zone: restaurantTz });
    const t2 = DateTime.fromISO(`${b.date}T${b.timeSlot || '00:00'}`, { zone: restaurantTz });
    return t1.toMillis() - t2.toMillis();
  });

  const today = DateTime.now().setZone(restaurantTz).startOf('day');
  const weekStart = today.startOf('week');
  const weekEnd = today.endOf('week');
  const monthStart = today.startOf('month');
  const monthEnd = today.endOf('month');
  const validForMetrics = reservations.filter(r => r.status?.toLowerCase() === 'confirmed' && DateTime.fromISO(r.date, { zone: restaurantTz }).isValid);
  const todayCount = validForMetrics.filter(r => DateTime.fromISO(r.date, { zone: restaurantTz }).hasSame(today, 'day')).length;
  const weekCount = validForMetrics.filter(r => { const d = DateTime.fromISO(r.date, { zone: restaurantTz }); return d >= weekStart && d <= weekEnd; }).length;
  const monthCount = validForMetrics.filter(r => { const d = DateTime.fromISO(r.date, { zone: restaurantTz }); return d >= monthStart && d <= monthEnd; }).length;

  const goToPrevDay = () => setSelectedDate(prev => prev.minus({ days: 1 }));
  const goToNextDay = () => setSelectedDate(prev => prev.plus({ days: 1 }));
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(DateTime.fromISO(e.target.value, { zone: restaurantTz }));

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!jwtToken) return <div className="p-8 text-center text-red-600">Authentication failed. Please log in again.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center">
      <h1 className="text-xl font-bold">Viv Dashboard Loaded</h1>
    </div>
  );
};

export default DashboardTemplate;
