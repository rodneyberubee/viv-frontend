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

  useEffect(() => {
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
                ? DateTime.now().setZone(config.timeZone || 'America/Los_Angeles').toFormat('yyyy-MM-dd')
                : '';
              return acc;
            }, {} as any)
          : { 
              date: DateTime.now().setZone(config.timeZone || 'America/Los_Angeles').toFormat('yyyy-MM-dd'),
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

    fetchConfig();
    fetchReservations();
  }, [config.timeZone]);

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
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Time formatting with timezone awareness
  const format24hr = (time: string) => {
    if (!time) return '';
    const dt = DateTime.fromISO(`2000-01-01T${time}`, { zone: config.timeZone || 'America/Los_Angeles' });
    return dt.isValid ? dt.toFormat('HH:mm') : '';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      <h1 className="text-3xl font-bold">Molly’s Cafe Dashboard</h1>

      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Restaurant Config</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Max Reservations & Cutoff & Timezone */}
          <div>
            <label className="block font-medium">Max Reservations</label>
            <input
              name="maxReservations"
              type="number"
              value={String(config.maxReservations ?? '')}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded"
            />
            <label className="block font-medium mt-4">Future Cutoff (days)</label>
            <input
              name="futureCutoff"
              type="number"
              value={String(config.futureCutoff ?? '')}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded"
            />
            <label className="block font-medium mt-4">Timezone</label>
            <input
              name="timeZone"
              type="text"
              value={config.timeZone || ''}
              onChange={handleConfigChange}
              placeholder="e.g., America/Los_Angeles"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Weekly Hours Table with enforced time inputs */}
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  {days.map(day => (
                    <th key={day} className="border px-2 py-1 capitalize">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {days.map(day => (
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
                  {days.map(day => (
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
        </div>
        <button onClick={updateConfig} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Update Config
        </button>
      </section>

      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Upcoming Reservations</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                {reservations.length > 0 &&
                  Object.keys(reservations[0])
                    .filter((key) => !reservationHidden.includes(key))
                    .map((key) => (
                      <th key={key} className="border px-2 py-1 text-left capitalize">{key}</th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((res, i) => (
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
