import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DateTime } from 'luxon';

type DashboardProps = {
  restaurantId: string;
};

// Visible column labels
const headerLabels: Record<string, string> = {
  name: 'Name',
  date: 'Date',
  timeSlot: 'Time',
  partySize: 'Party Size',
  phone: 'Phone',
  checkInAt: 'Check-In (txt)',
  tableSat: 'Table Sat (txt)',
  status: 'Status',
  hostNotes: 'Host Notes',
  _info: 'Info'
};

// Keep the working surface minimal
const visibleEditableFields = [
  'name',
  'date',
  'timeSlot',
  'partySize',
  'phone',
  'checkInAt', // text by design
  'tableSat',  // text by design
  'status',
  'hostNotes'
] as const;

// Stuff we tuck into the hover card
const extraInfoFieldsOrder = [
  'contactInfo',
  'conatactInfo', // tolerate typo
  'confirmationCode',
  'rawConfirmationCode',
  'dateFormatted',
  'restaurantId',
  'notes'
];

// Try to make sense of loose textual times for sorting only
function combineDateAndTime(dateStr?: string, timeText?: string) {
  const base = DateTime.fromISO(String(dateStr || ''));
  if (!base.isValid) return DateTime.invalid('bad date');

  if (!timeText || !String(timeText).trim()) return base;

  const tt = String(timeText).trim();
  const formats = ['H:mm', 'HH:mm', 'h:mm a', 'h:mma', 'hha', 'hh:mma', 'h:mmA'];
  for (const fmt of formats) {
    const parsed = DateTime.fromFormat(tt, fmt);
    if (parsed.isValid) {
      return base.set({ hour: parsed.hour, minute: parsed.minute });
    }
  }
  // Fallback: leave time at 00:00
  return base;
}

const DashboardTemplate = ({ restaurantId }: DashboardProps) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
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

  async function fetchReservations() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/reservations`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      const reservationsFromServer = data.reservations || data || [];
      setReservations(reservationsFromServer);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  useEffect(() => {
    if (jwtToken) {
      fetchReservations();
    }
  }, [jwtToken, selectedDate]);

  // 🔁 Refresh-flag polling
  useEffect(() => {
    if (!jwtToken) return;
    let id: number | null = null;

    const poll = async () => {
      try {
        const r = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/refreshFlag`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!r.ok) return;
        const { refresh } = await r.json();
        if (refresh === 1) {
          await fetchReservations();
        }
      } catch (err) {
        console.error('[ERROR] refreshFlag poll failed:', err);
      }
    };

    const tick = () => {
      if (document.visibilityState === 'visible') poll();
    };
    tick();
    id = window.setInterval(tick, 5000);

    const onVis = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (id) window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [jwtToken, restaurantId]);

  useEffect(() => {
    const bc = new BroadcastChannel('reservations');
    bc.onmessage = (e) => {
      if (e.data.type === 'reservationUpdate') {
        fetchReservations();
      }
    };
    return () => bc.close();
  }, [jwtToken]);

  const handleReservationEdit = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string | undefined,
    index: number
  ) => {
    const { name, value } = e.target;
    setReservations((prev) =>
      prev.map((res, i) => (res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res))
    );
  };

  const addNewRow = async () => {
    if (!jwtToken) return;
    try {
      const baseRow: Record<string, any> = { restaurantId };
      // Pre-fill date; keep everything else manual
      visibleEditableFields.forEach((key) => {
        if (key === 'date') baseRow[key] = selectedDate.toFormat('yyyy-MM-dd');
        else baseRow[key] = '';
      });

      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify([{ recordId: null, updatedFields: baseRow }]),
      });

      fetchReservations();
    } catch (err) {
      console.error('[ERROR] Adding new row failed:', err);
    }
  };

  const updateReservationsReq = async () => {
    if (!jwtToken) return;
    try {
      // Also strip confirmationCode on the client (backend ignores it anyway)
      const payload = reservations
        .filter((res) => Object.keys(res).length > 0)
        .map(({ id, rawConfirmationCode, dateFormatted, confirmationCode, ...fields }) => ({
          recordId: id,
          updatedFields: {
            ...fields,
            restaurantId,
          },
        }));

      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
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
      const dt = DateTime.fromISO(String(r.date || ''));
      return dt.isValid && dt.hasSame(selectedDate, 'day');
    })
    .sort((a, b) => {
      const t1 = combineDateAndTime(a.date, a.timeSlot);
      const t2 = combineDateAndTime(b.date, b.timeSlot);
      return t1.toMillis() - t2.toMillis();
    });

  const today = DateTime.now().startOf('day');
  const weekStart = today.startOf('week');
  const weekEnd = today.endOf('week');
  const monthStart = today.startOf('month');
  const monthEnd = today.endOf('month');
  const validForMetrics = reservations.filter(
    (r) => r.status?.toLowerCase() === 'confirmed' && DateTime.fromISO(String(r.date || '')).isValid
  );
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

  const renderExtraInfo = (res: any) => {
    const items = extraInfoFieldsOrder
      .filter((k) => res[k] !== undefined && res[k] !== null && String(res[k]).trim() !== '')
      .map((k) => {
        const label = k === 'conatactInfo' ? 'contactInfo (typo)' : k;
        const val = k === 'conatactInfo' ? res.conatactInfo : res[k];
        return (
          <div key={k} className="flex justify-between gap-3 text-xs py-0.5">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium break-all">{String(val)}</span>
          </div>
        );
      });

    if (items.length === 0) {
      return <div className="text-xs text-gray-500">No extra info</div>;
    }
    return <div className="space-y-1">{items}</div>;
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
        <Link href={`/settings/${restaurantId}`} className="block text-orange-600 hover:underline text-sm mt-4">
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
            <button onClick={updateReservationsReq} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">
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

        <section className="bg-white rounded shadow p-6 relative">
          <h2 className="text-xl font-semibold mb-4">
            Reservations for {selectedDate.toFormat('MMMM dd, yyyy')}
          </h2>

          {/* overflow-x for table scrolling, but allow popovers to escape */}
          <div className="w-full overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {visibleEditableFields.map((key) => (
                    <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                      {headerLabels[key] || key}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-gray-700 font-medium">{headerLabels._info}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res, i) => (
                  <tr key={res.id || i} className="border-t hover:bg-gray-50">
                    {visibleEditableFields.map((key) => (
                      <td key={key} className="px-3 py-2 align-top">
                        {key === 'hostNotes' ? (
                          <textarea
                            name={key}
                            value={String(res[key] ?? '')}
                            onChange={(e) => handleReservationEdit(e, res.id, i)}
                            className="w-full p-1 rounded border border-transparent focus:border-orange-500 focus:ring focus:ring-orange-200 min-h-[36px]"
                            placeholder="Allergies, booster, anniversary…"
                          />
                        ) : (
                          <input
                            type={key === 'date' ? 'date' : 'text'}
                            placeholder={
                              key === 'timeSlot'
                                ? 'e.g., 7:15 pm'
                                : key === 'checkInAt'
                                ? 'e.g., 7:20 pm'
                                : key === 'tableSat'
                                ? 'e.g., 7:25 pm'
                                : ''
                            }
                            name={key}
                            value={String(res[key] ?? '')}
                            onChange={(e) => handleReservationEdit(e, res.id, i)}
                            className="w-full p-1 rounded border border-transparent focus:border-orange-500 focus:ring focus:ring-orange-200"
                          />
                        )}
                      </td>
                    ))}

                    {/* Info hover card – anchored to the right to avoid clipping */}
                    <td className="px-3 py-2 align-top relative">
                      <div className="group inline-block">
                        <button
                          className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-100"
                          title="More details"
                        >
                          Info
                        </button>
                        <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block w-80 max-w-[80vw] bg-white border rounded-lg shadow-xl p-3">
                          {renderExtraInfo(res)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center space-x-4 mt-4">
            <button onClick={goToPrevDay} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Prev
            </button>
            <input
              type="date"
              value={selectedDate.toFormat('yyyy-MM-dd')}
              onChange={onDateChange}
              className="p-2 border rounded"
            />
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
