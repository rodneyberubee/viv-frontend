import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  [key: string]: any;
};

type SettingsProps = {
  restaurantId: string;
};

const SettingsPage = ({ restaurantId }: SettingsProps) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({ maxReservations: 0, futureCutoff: 0 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const storedJwt = localStorage.getItem('jwtToken');

    async function exchangeForJwt(tempToken: string) {
      try {
        const res = await fetch('https://api.vivaitable.com/api/auth/login/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tempToken }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('jwtToken', data.token);
          setJwtToken(data.token);
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          throw new Error('Invalid login token');
        }
      } catch (err) {
        console.error('[ERROR] Token exchange failed:', err);
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }

    if (urlToken) {
      exchangeForJwt(urlToken);
    } else if (storedJwt) {
      setJwtToken(storedJwt);
      setLoading(false);
    } else {
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

  useEffect(() => {
    if (jwtToken) fetchConfig();
  }, [jwtToken]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const updateConfig = async () => {
    if (!jwtToken) return;
    const numericFields = ['maxReservations', 'futureCutoff'];
    const excluded = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'calibratedTime', 'tableName'];
    const cleaned = Object.fromEntries(
      Object.entries(config)
        .filter(([key]) => !excluded.includes(key))
        .map(([key, val]) => [key, numericFields.includes(key) ? parseInt(String(val), 10) || 0 : val])
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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div>
          <p className="text-sm text-gray-600 mb-2">Your Viv AI Link</p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={`https://vivaitable.com/${restaurantId}`}
              readOnly
              className="w-full p-2 border rounded bg-gray-100 text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(`https://vivaitable.com/${restaurantId}`)}
              className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Share this link for direct AI reservations.</p>
        </div>
        <a
          href={`/dashboard/${restaurantId}`}
          className="block text-orange-600 hover:underline text-sm mt-4"
        >
          Reservations
        </a>
        <a
          href="/dashboard/how-to-dashboard"
          className="block text-orange-600 hover:underline text-sm"
        >
          How the Dashboard Works
        </a>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        <h1 className="text-3xl font-bold">Restaurant Settings</h1>
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
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <th key={day} className="px-3 py-2 text-left text-gray-700 font-medium capitalize">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <td key={day + 'Open'} className="px-3 py-2 border-t">
                    <input
                      type="text"
                      placeholder="HH:mm or HH:mm AM/PM"
                      name={`${day}Open`}
                      value={config[`${day}Open`] || ''}
                      onChange={handleConfigChange}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <td key={day + 'Close'} className="px-3 py-2 border-t">
                    <input
                      type="text"
                      placeholder="HH:mm or HH:mm AM/PM"
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
      </main>
    </div>
  );
};

export default SettingsPage;
