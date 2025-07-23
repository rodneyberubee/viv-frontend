import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  [key: string]: any;
};

const MollysCafeDashboard = () => {
  const [config, setConfig] = useState<Config>({
    maxReservations: 0,
    futureCutoff: 0
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
        const padded = [...(data.reservations || []), { confirmationCode: '', guestName: '', partySize: '', date: '', timeSlot: '', status: '' }];
        setReservations(padded);
      } catch (err) {
        console.error('[ERROR] Fetching reservations failed:', err);
      }
    }

    fetchConfig();
    fetchReservations();
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
    const excluded = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'timeZone', 'calibratedTime', 'tableName'];
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

  const configHidden = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'timeZone', 'calibratedTime', 'tableName'];
  const reservationHidden = ['id', 'rawConfirmationCode', 'dateFormatted'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const formatAMPM = (time: string) => {
    return dayjs(`2000-01-01T${time}`).format('h:mm A'); // Human readable
  };

  const format24hr = (time: string) => {
    return dayjs(`2000-01-01T${time}`).format('HH:mm');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      <h1 className="text-3xl font-bold">Molly’s Cafe Dashboard</h1>

      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Restaurant Config</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Max Reservations & Cutoff */}
          <div>
            <label className="block font-medium">Max Reservations</label>
            <input
              name="maxReservations"
              value={String(config.maxReservations ?? '')}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded"
            />
            <label className="block font-medium mt-4">Future Cutoff (minutes)</label>
            <input
              name="futureCutoff"
              value={String(config.futureCutoff ?? '')}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Weekly Hours Table */}
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
                        name={`${day}Open`}
                        value={formatAMPM(config[`${day}Open`] || '')}
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
                        name={`${day}Close`}
                        value={formatAMPM(config[`${day}Close`] || '')}
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
                          type="text"
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
