import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DateTime } from 'luxon';

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

const DashboardTemplate = () => {
  // 🔒 Hardcoded for public demo
  const restaurantId = 'mollyscafe1';
  const demoBase = `https://api.vivaitable.com/api/demo-dashboard/${restaurantId}`;

  // 🔓 Removed all JWT state/logic
  const [loading, setLoading] = useState(true);
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

  // 🔓 Removed token exchange + redirects entirely
  useEffect(() => {
    setLoading(false);
  }, []);

  // 🔓 No safeFetch; use plain fetch with no Authorization header
  async function fetchReservations() {
    try {
      const res = await fetch(`${demoBase}/reservations`, { cache: 'no-store' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      const data = await res.json();
      const reservationsFromServer = data.reservations || data || [];
      setReservations(reservationsFromServer);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, [selectedDate]); // restaurantId is static

  // 🔁 Server-driven refreshFlag poll (mirrors prod behavior)
  useEffect(() => {
    let intervalId: number | null = null;

    const poll = async () => {
      try {
        const r = await fetch(`${demoBase}/refreshFlag`, { cache: 'no-store' });
        if (!r.ok) return;
        const { refresh } = await r.json();
        if (refresh === 1) {
          await fetchReservations();
        }
      } catch (err) {
        console.error('[ERROR] refreshFlag poll failed:', err);
      }
    };

    // Start immediately, then poll every 3s
    poll();
    intervalId = window.setInterval(poll, 3000);

    // Refresh on tab focus to feel snappier
    const onVis = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []); // restaurantId is static

  // Keep broadcast updates, no token required
  useEffect(() => {
    const bc = new BroadcastChannel('reservations');
    bc.onmessage = (e) => {
      if (e.data.type === 'reservationUpdate') {
        fetchReservations();
      }
    };
    return () => bc.close();
  }, []); // restaurantId is static

  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined, index: number) => {
    const { name, value } = e.target;
    setReservations((prev) =>
      prev.map((res, i) => (res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res))
    );
  };

  // 🔓 Public calls (no Authorization header). Demo backend reads restaurantId from URL; don't send it in body.
  const addNewRow = async () => {
    try {
      const newRow = editableFields.reduce((acc, key) => {
        acc[key] = key === 'date' ? selectedDate.toFormat('yyyy-MM-dd') : '';
        return acc;
      }, {} as any);

      await fetch(`${demoBase}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ recordId: null, updatedFields: newRow }]),
      });

      fetchReservations();
    } catch (err) {
      console.error('[ERROR] Adding new row failed:', err);
    }
  };

  const updateReservations = async () => {
    try {
      const payload = reservations
        .filter((res) => Object.keys(res).length > 0)
        .map(({ id, rawConfirmationCode, dateFormatted, ...fields }) => ({
          recordId: id,
          updatedFields: {
            ...fields, // ⚠️ no restaurantId here — demo router uses URL param
          },
        }));

      await fetch(`${demoBase}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
      fetchReservations();
    } catch (err) {
      console.error('[ERROR] Updating reservations failed:', err);
    }
  };

  const filteredReservations = reservations
    .filter((r) => {
      const dt = DateTime.fromISO(r.date);
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
        <Link
          href={`/settings/${restaurantId}`}
          className="block text-orange-600 hover:underline text-sm mt-4"
        >
          Settings
        </Link>
        <Link href={`/how-to-dashboard/${restaurantId}`} className="block text-orange-600 hover:underline text-sm">
          How the Dashboard Works
        </Link>
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
                {editableFields.map((key) => (
                  <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                    {headerLabels[key] || key}
                  </th>
                ))}
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
      </main>
    </div>
  );
};

export default DashboardTemplate;
