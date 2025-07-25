import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
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

  // Fetch config
  async function fetchConfig() {
    try {
      const res = await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('[ERROR] Fetching config failed:', err);
    }
  }

  // Fetch reservations
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
      const padded = [...reservationsFromServer, blankRowTemplate];
      setReservations(padded);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchConfig();
    fetchReservations();
  }, [config.timeZone, selectedDate]);

  // Auto-refresh every 15 minutes during store hours
  useEffect(() => {
    const restaurantTz = config.timeZone || 'America/Los_Angeles';
    const dayName = selectedDate.toFormat('cccc').toLowerCase(); // e.g., "monday"
    const open = config[`${dayName}Open`];
    const close = config[`${dayName}Close`];
    const now = DateTime.now().setZone(restaurantTz);

    let intervalId: NodeJS.Timeout | null = null;
    if (open && close) {
      const openTime = DateTime.fromFormat(open, 'HH:mm', { zone: restaurantTz }).set({
        year: now.year, month: now.month, day: now.day,
      });
      const closeTime = DateTime.fromFormat(close, 'HH:mm', { zone: restaurantTz }).set({
        year: now.year, month: now.month, day: now.day,
      });
      if (now >= openTime && now <= closeTime) {
        intervalId = setInterval(fetchReservations, 15 * 60 * 1000);
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [config, selectedDate]);

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
      const res = await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/updateConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
      await res.json();
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

      const res = await fetch('https://api.vivaitable.com/api/dashboard/mollyscafe1/updateReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await res.json();
      alert('Reservations updated');
    } catch (err) {
      console.error('[ERROR] Updating reservations failed:', err);
    }
  };

  const reservationHidden = ['id', 'rawConfirmationCode', 'dateFormatted', 'notes'];

  const format24hr = (time: string) => {
    if (!time) return '';
    const dt = DateTime.fromISO(`2000-01-01T${time}`, { zone: config.timeZone || 'America/Los_Angeles' });
    return dt.isValid ? dt.toFormat('HH:mm') : '';
  };

  // Filter and sort reservations for the selected date
  const restaurantTz = config.timeZone || 'America/Los_Angeles';
  const filteredReservations = reservations
    .filter(r => DateTime.fromISO(r.date, { zone: restaurantTz }).hasSame(selectedDate, 'day'))
    .sort((a, b) => {
      const t1 = DateTime.fromISO(`${a.date}T${a.timeSlot}`, { zone: restaurantTz });
      const t2 = DateTime.fromISO(`${b.date}T${b.timeSlot}`, { zone: restaurantTz });
      return t1.toMillis() - t2.toMillis();
    });

  // Navigation
  const goToPrevDay = () => setSelectedDate(prev => prev.minus({ days: 1 }));
  const goToNextDay = () => setSelectedDate(prev => prev.plus({ days: 1 }));
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(DateTime.fromISO(e.target.value, { zone: restaurantTz }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      <h1 className="text-3xl font-bold">Molly’s Cafe Dashboard</h1>

      {/* Date navigation */}
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={goToPrevDay} className="px-4 py-2 bg-gray-200 rounded">Prev</button>
        <input
          type="date"
          value={selectedDate.toFormat('yyyy-MM-dd')}
          onChange={onDateChange}
          className="p-2 border rounded"
        />
        <button onClick={goToNextDay} className="px-4 py-2 bg-gray-200 rounded">Next</button>
      </div>

      {/* Config Section */}
      {/* (unchanged from your code) */}

      {/* Reservations */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          Reservations for {selectedDate.toFormat('MMMM dd, yyyy')}
        </h2>
        <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                {filteredReservations.length > 0 &&
                  Object.keys(filteredReservations[0])
                    .filter((key) => !reservationHidden.includes(key))
                    .map((key) => (
                      <th key={key} className="border px-2 py-1 text-left capitalize">{key}</th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res, i) => (
                <tr key={res.id || i} className="border-t">
                  {Object.entries(res)
                    .filter(([key]) => !reservationHidden.includes(key))
                    .map(([key, val]) => (
                      <td key={key} className="border px-2 py-1">
                        <input
                          type={key === 'timeSlot' ? 'time' : key === 'date' ? 'date' : 'text'}
                          name={key}
                          value={key === 'timeSlot' ? format24hr(String(val)) : String(val ?? '')}
                          onChange={(e) => handleReservationEdit(e, res.id, i)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={updateReservations} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
          Update Reservations
        </button>
      </section>
    </div>
  );
};

export default MollysCafeDashboard;
