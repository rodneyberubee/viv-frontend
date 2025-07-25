import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

// Event dispatcher utility
export const reservationUpdateEvent = {
  setFlag() {
    const timestamp = Date.now();
    console.log('[DEBUG] Dispatching reservationUpdate event:', timestamp);
    window.dispatchEvent(new CustomEvent('reservationUpdate', { detail: timestamp }));
  }
};

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
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

const MollysCafeDashboard = () => {
  const [config, setConfig] = useState<Config>({
    maxReservations: 0,
    futureCutoff: 0,
    timeZone: 'America/Los_Angeles',
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(
    DateTime.now().setZone('America/Los_Angeles').startOf('day')
  );

  async function fetchConfig() {
    try {
      const res = await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('[ERROR] Fetching config failed:', err);
    }
  }

  async function fetchReservations() {
    try {
      const res = await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/reservations');
      const data = await res.json();
      const reservationsFromServer = data.reservations || [];

      const blankRowTemplate = reservationsFromServer.length
        ? Object.keys(reservationsFromServer[0]).reduce((acc, key) => {
            acc[key] = key === 'date'
              ? selectedDate.toFormat('yyyy-MM-dd')
              : '';
            return acc;
          }, {} as any)
        : { 
            date: selectedDate.toFormat('yyyy-MM-dd'),
            timeSlot: '', 
            name: '', 
            partySize: '', 
            contactInfo: '', 
            status: '', 
            confirmationCode: '' 
          };
      setReservations([...reservationsFromServer, blankRowTemplate]); // force new array reference
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  useEffect(() => {
    fetchConfig();
    fetchReservations();
  }, [config.timeZone, selectedDate]);

  // Listen for reservation update events
  useEffect(() => {
    const handler = (e: any) => {
      console.log('[DEBUG] Dashboard caught reservationUpdate event:', e.detail);
      fetchReservations();
    };
    window.addEventListener('reservationUpdate', handler);
    return () => window.removeEventListener('reservationUpdate', handler);
  }, []);

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
      await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/updateConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
      alert('Config updated');
    } catch (err) {
      console.error('[ERROR] Updating config failed:', err);
    }
  };

  const updateReservations = async () => {
    try {
      const payload = reservations
        .filter((res) => Object.keys(res).length > 0 && res.confirmationCode)
        .map(({ id, rawConfirmationCode, dateFormatted, ...fields }) => ({
          recordId: id,
          updatedFields: fields
        }));

      await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/updateReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
    } catch (err) {
      console.error('[ERROR] Updating reservations failed:', err);
    }
  };

  const reservationHidden = ['id', 'rawConfirmationCode', 'dateFormatted', 'notes'];
  const restaurantTz = config.timeZone || 'America/Los_Angeles';
  const format24hr = (time: string) => {
    if (!time) return '';
    const dt = DateTime.fromISO(`2000-01-01T${time}`, { zone: restaurantTz });
    return dt.isValid ? dt.toFormat('HH:mm') : '';
  };

  const filteredReservations = reservations
    .filter(r => 
      DateTime.fromISO(r.date, { zone: restaurantTz }).hasSame(selectedDate, 'day') &&
      ((r.name && r.timeSlot) || r.status === 'blocked')
    )
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
      ((r.name && r.timeSlot) || r.status === 'blocked') &&
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
            onC
