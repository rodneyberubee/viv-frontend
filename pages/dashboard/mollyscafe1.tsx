import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

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
      setReservations([...reservationsFromServer, blankRowTemplate]); // new array reference
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  useEffect(() => {
    fetchConfig();
    fetchReservations();
  }, [config.timeZone, selectedDate]);

  // Listen for BroadcastChannel events
  useEffect(() => {
    const bc = new BroadcastChannel('reservations');
    bc.onmessage = (e) => {
      if (e.data.type === 'reservationUpdate') {
        console.log('[DEBUG] Dashboard received reservationUpdate broadcast:', e.data.timestamp);
        fetchReservations();
      }
    };
    return () => bc.close();
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
                {filteredReservations.length > 0 &&
                  Object.keys(filteredReservations[0])
                    .filter((key) => !reservationHidden.includes(key))
                    .map((key) => (
                      <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                        {headerLabels[key] || key}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res, i) => (
                <tr key={res.id || i} className="border-t hover:bg-gray-50">
                  {Object.entries(res)
                    .filter(([key]) => !reservationHidden.includes(key))
                    .map(([key, val]) => (
                      <td key={key} className="px-3 py-2">
                        <input
                          type={key === 'timeSlot' ? 'time' : key === 'date' ? 'date' : 'text'}
                          name={key}
                          value={key === 'timeSlot' ? format24hr(String(val)) : String(val ?? '')}
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
            <div>
              <label className="block text-gray-700 font-medium mb-1">Timezone</label>
              <input
                name="timeZone"
                type="text"
                value={config.timeZone || ''}
                onChange={handleConfigChange}
                placeholder="e.g., America/Los_Angeles"
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
                        type="time"
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
                        type="time"
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

export default MollysCafeDashboard;
