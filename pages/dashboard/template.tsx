import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  [key: string]: any;
};

type DashboardProps = {
  restaurantId: string;
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

const statusTooltip = `Status options:
- Confirmed: Guest reservation
- Canceled: Reservation was canceled
- Blocked: Host blocks this time slot (no reservations allowed)`;

const DashboardTemplate = ({ restaurantId }: DashboardProps) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({
    maxReservations: 0,
    futureCutoff: 0,
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.now().startOf('day'));

  const aiLink = `https://vivaitable.com/${restaurantId}`;
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(aiLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle token exchange -> JWT
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

  // Auto-logout if token is invalid
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
      const reservationsFromServer = data.reservations || data || []; // <-- plain array, no mapping for hidden
      setReservations(reservationsFromServer);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }



  useEffect(() => {
    if (jwtToken) {
      fetchConfig();
      fetchReservations();
    }
  }, [jwtToken, selectedDate]);

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
      prev.map((res, i) => (res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res))
    );
  };

    // [UPDATED] Create new row directly in Airtable and refresh
  const addNewRow = async () => {
  if (!jwtToken) return;
  try {
    const newRow = editableFields.reduce((acc, key) => {
      acc[key] = key === 'date' ? selectedDate.toFormat('yyyy-MM-dd') : '';
      return acc;
    }, { restaurantId } as any);
    
    await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
      body: JSON.stringify([{ recordId: null, updatedFields: newRow }]),
    });

    fetchReservations(); // refresh to show new row
  } catch (err) {
    console.error('[ERROR] Adding new row failed:', err);
  }
};

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

   // [UPDATED] Mark selected rows as hidden in Airtable and refresh
const deleteSelectedRows = async () => {
  if (!jwtToken) return;
  try {
    const payload = selectedRows.map((index) => ({
      recordId: reservations[index].id,
      updatedFields: { restaurantId }, // store as "1" instead of boolean
    }));

    await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
      body: JSON.stringify(payload),
    });

    setSelectedRows([]);
    fetchReservations(); // refresh to remove from list
  } catch (err) {
    console.error('[ERROR] Deleting rows failed:', err);
  }
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

    // [UPDATED] Include hidden records in updates
const updateReservations = async () => {
  if (!jwtToken) return;
  try {
    const payload = reservations
      .filter((res) => Object.keys(res).length > 0)
      .map(({ id, rawConfirmationCode, dateFormatted, hidden, ...fields }) => ({
        recordId: id,
        updatedFields: { 
          ...fields,
          restaurantId 
        },
      }));

    await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
      body: JSON.stringify(payload),
    });
    alert('Reservations updated');
    fetchReservations(); // refresh to see changes
  } catch (err) {
    console.error('[ERROR] Updating reservations failed:', err);
  }
};

    const filteredReservations = reservations.filter((r) => {
      const dt = DateTime.fromISO(r.date);
      // Show all reservations for the selected day, even if blank or pending
      return dt.isValid && dt.hasSame(selectedDate, 'day');
    })
    .sort((a, b) => {
      const t1 = DateTime.fromISO(`${a.date}T${a.timeSlot || '00:00'}`);
      const t2 = DateTime.fromISO(`${b.date}T${b.timeSlot || '00:00'}`);
      return t1.toMillis() - t2.toMillis();
    });

  const today = DateTime.now().startOf('day');
  const weekStart = today.startOf('week');
  const weekEnd = today.endOf('week');
  const monthStart = today.startOf('month');
  const monthEnd = today.endOf('month');
  const validForMetrics = reservations.filter((r) => r.status?.toLowerCase() === 'confirmed' && DateTime.fromISO(r.date).isValid);
  const todayCount = validForMetrics.filter((r) => DateTime.fromISO(r.date).hasSame(today, 'day')).length;
  const weekCount = validForMetrics.filter((r) => {
    const d = DateTime.fromISO(r.date);
    return d >= weekStart && d <= weekEnd;
  }).length;
  const monthCount = validForMetrics.filter((r) => {
    const d = DateTime.fromISO(r.date);
    return d >= monthStart && d <= monthEnd;
  }).length;

  const goToPrevDay = () => setSelectedDate((prev) => prev.minus({ days: 1 }));
  const goToNextDay = () => setSelectedDate((prev) => prev.plus({ days: 1 }));
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(DateTime.fromISO(e.target.value));
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div>
          <p className="text-sm text-gray-600 mb-2">Your Viv AI Link</p>
          <div className="flex space-x-2">
            <input type="text" value={aiLink} readOnly className="w-full p-2 border rounded bg-gray-100 text-sm" />
            <button onClick={copyToClipboard} className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600">
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Share this link for direct AI reservations.</p>
        </div>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reservations</h1>
          <div className="flex space-x-2">
            <button onClick={addNewRow} className="bg-gray-200 px-3 py-2 rounded shadow hover:bg-gray-300">
              Add New Row
            </button>
            <button onClick={updateReservations} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">
              Update Reservations
            </button>
          </div>
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
          <h2 className="text-xl font-semibold mb-4">Reservations for {selectedDate.toFormat('MMMM dd, yyyy')}</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {editableFields.map((key) =>
                  key === 'status' ? (
                    <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium relative group">
                      {headerLabels[key]}
                      <span className="ml-1 text-gray-400 cursor-help">?</span>
                      <div className="absolute left-0 mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {statusTooltip}
                      </div>
                    </th>
                  ) : (
                    <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                      {headerLabels[key] || key}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res, i) => (
                <tr key={res.id || i} className="border-t hover:bg-gray-50">
                  {editableFields.map((key) => (
                    <td key={key} className="px-3 py-2">
                      <input
                        type={key === 'timeSlot' ? 'text' : key === 'date' ? 'date' : 'text'}
                        placeholder={key === 'timeSlot' ? 'HH:mm or HH:mm AM/PM' : ''}
                        name={key}
                        value={String(res[key] ?? '')}
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
            <button onClick={goToPrevDay} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Prev
            </button>
            <input type="date" value={selectedDate.toFormat('yyyy-MM-dd')} onChange={onDateChange} className="p-2 border rounded" />
            <button onClick={goToNextDay} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Next
            </button>
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
            <button onClick={updateConfig} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">
              Update Config
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardTemplate;
