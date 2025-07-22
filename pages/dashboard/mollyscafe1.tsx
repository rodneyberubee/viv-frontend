import React, { useEffect, useState } from 'react';

export const MollysCafeDashboard = () => {
  const [config, setConfig] = useState({});
  const [reservations, setReservations] = useState([]);

  // Fetch config
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('https://vivaitable.com/api/dashboard/mollyscafe1/config');
        const data = await res.json();
        console.log('[DEBUG] Loaded config:', data);
        setConfig(data);
      } catch (err) {
        console.error('[ERROR] Fetching config failed:', err);
      }
    }

    async function fetchReservations() {
      try {
        const res = await fetch('https://vivaitable.com/api/dashboard/mollyscafe1/reservations');
        const data = await res.json();
        console.log('[DEBUG] Loaded reservations:', data);
        setReservations(data.reservations || []);
      } catch (err) {
        console.error('[ERROR] Fetching reservations failed:', err);
      }
    }

    fetchConfig();
    fetchReservations();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const updateConfig = async () => {
    try {
      const res = await fetch('https://vivaitable.com/api/dashboard/mollyscafe1/updateConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const result = await res.json();
      alert('Config updated');
      console.log(result);
    } catch (err) {
      console.error('[ERROR] Updating config failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      <h1 className="text-3xl font-bold">Molly’s Cafe Dashboard</h1>

      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Restaurant Config</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config).map(([key, val]) => (
            <div key={key}>
              <label className="block font-medium capitalize">{key}</label>
              <input
                name={key}
                value={val || ''}
                onChange={handleConfigChange}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
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
                {reservations.length > 0 && Object.keys(reservations[0]).map((key) => (
                  <th key={key} className="border px-2 py-1 text-left capitalize">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((r, i) => (
                <tr key={i} className="border-t">
                  {Object.values(r).map((val, j) => (
                    <td key={j} className="border px-2 py-1">{val}</td>
                  ))}
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr><td colSpan={10} className="text-center py-4">No reservations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
