import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

type Config = { maxReservations: number; futureCutoff: number; [key: string]: any; };
type DashboardProps = { restaurantId: string };

const headerLabels: Record<string, string> = {
  date: 'Date', timeSlot: 'Time Slot', name: 'Name', partySize: 'Party Size',
  contactInfo: 'Contact Info', status: 'Status', confirmationCode: 'Confirmation Code',
};
const editableFields = ['date', 'timeSlot', 'name', 'partySize', 'contactInfo', 'status', 'confirmationCode'];
const statusTooltip = `Status options:
- Confirmed: Guest reservation
- Canceled: Reservation was canceled
- Blocked: Host blocks this time slot (no reservations allowed)`;

const DashboardTemplate = ({ restaurantId }: DashboardProps) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({ maxReservations: 0, futureCutoff: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.now().startOf('day'));
  const [selectedRows, setSelectedRows] = useState<string[]>([]); // use IDs for selection

  const aiLink = `https://vivaitable.com/${restaurantId}`;
  const copyToClipboard = async () => { try { await navigator.clipboard.writeText(aiLink); alert('Link copied to clipboard!'); } catch (err) { console.error('Failed to copy text: ', err); } };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const storedJwt = localStorage.getItem('jwtToken');
    async function exchangeForJwt(tempToken: string) {
      try {
        const res = await fetch('https://api.vivaitable.com/api/auth/login/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tempToken }),
        });
        const data = await res.json();
        if (data.token) { localStorage.setItem('jwtToken', data.token); setJwtToken(data.token); window.history.replaceState({}, '', window.location.pathname); }
        else throw new Error('Invalid login token');
      } catch (err) {
        console.error('[ERROR] Token exchange failed:', err);
        localStorage.removeItem('jwtToken'); window.location.href = '/login';
      } finally { setLoading(false); }
    }
    if (urlToken) exchangeForJwt(urlToken);
    else if (storedJwt) { setJwtToken(storedJwt); setLoading(false); }
    else window.location.href = '/login';
  }, []);

  async function safeFetch(url: string, options: any) {
    const res = await fetch(url, options);
    if (res.status === 401) { localStorage.removeItem('jwtToken'); window.location.href = '/login'; throw new Error('Unauthorized'); }
    return res;
  }

  async function fetchConfig() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/config`, { headers: { Authorization: `Bearer ${jwtToken}` } });
      const data = await res.json(); setConfig(data.config || data);
    } catch (err) { console.error('[ERROR] Fetching config failed:', err); }
  }

  async function fetchReservations() {
    if (!jwtToken) return;
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/reservations`, { headers: { Authorization: `Bearer ${jwtToken}` } });
      const data = await res.json();
      const reservationsFromServer = (data.reservations || data || []).map((r: any) => ({ ...r, hidden: r.hidden || false }));
      setReservations(reservationsFromServer);
    } catch (err) { console.error('[ERROR] Fetching reservations failed:', err); }
  }

  useEffect(() => { if (jwtToken) { fetchConfig(); fetchReservations(); } }, [jwtToken, selectedDate]);

  useEffect(() => {
    const bc = new BroadcastChannel('reservations');
    bc.onmessage = (e) => { if (e.data.type === 'reservationUpdate') fetchReservations(); };
    return () => bc.close();
  }, [jwtToken]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setConfig((prev) => ({ ...prev, [name]: value })); };
  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined) => {
    const { name, value } = e.target;
    setReservations((prev) => prev.map((res) => (res.id === id ? { ...res, [name]: value } : res)));
  };

  // Create new record immediately in Airtable
  const addNewRow = async () => {
    if (!jwtToken) return;
    const newRow = { date: selectedDate.toFormat('yyyy-MM-dd'), status: 'blocked', hidden: false, restaurantId };
    try {
      const res = await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify([{ recordId: null, updatedFields: newRow }]),
      });
      const created = await res.json();
      await fetchReservations();
    } catch (err) { console.error('[ERROR] Creating new reservation failed:', err); }
  };

  // Mark selected rows as hidden in Airtable
  const deleteSelectedRows = async () => {
    if (!jwtToken) return;
    try {
      const payload = selectedRows.map((id) => ({ recordId: id, updatedFields: { hidden: true, restaurantId } }));
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload),
      });
      await fetchReservations();
      setSelectedRows([]);
    } catch (err) { console.error('[ERROR] Hiding reservations failed:', err); }
  };

  const updateConfig = async () => {
    if (!jwtToken) return;
    const numericFields = ['maxReservations', 'futureCutoff'];
    const excluded = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'calibratedTime', 'tableName'];
    const cleaned = Object.fromEntries(Object.entries(config).filter(([key]) => !excluded.includes(key)).map(([key, val]) => [key, numericFields.includes(key) ? parseInt(String(val), 10) || 0 : val]));
    try {
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ ...cleaned, restaurantId }),
      }); alert('Config updated');
    } catch (err) { console.error('[ERROR] Updating config failed:', err); }
  };

  const updateReservations = async () => {
    if (!jwtToken) return;
    try {
      const payload = reservations.filter((res) => !res.hidden && res.confirmationCode).map(({ id, ...fields }) => ({ recordId: id, updatedFields: { ...fields, restaurantId } }));
      await safeFetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
    } catch (err) { console.error('[ERROR] Updating reservations failed:', err); }
  };

  const filteredReservations = reservations.filter((r) => !r.hidden).filter((r) => {
    const dt = DateTime.fromISO(r.date);
    return dt.isValid && dt.hasSame(selectedDate, 'day') && ((r.name && r.timeSlot) || r.status === 'blocked');
  }).sort((a, b) => DateTime.fromISO(`${a.date}T${a.timeSlot || '00:00'}`).toMillis() - DateTime.fromISO(`${b.date}T${b.timeSlot || '00:00'}`).toMillis());

  const today = DateTime.now().startOf('day');
  const weekStart = today.startOf('week'); const weekEnd = today.endOf('week');
  const monthStart = today.startOf('month'); const monthEnd = today.endOf('month');
  const validForMetrics = reservations.filter((r) => r.status?.toLowerCase() === 'confirmed' && DateTime.fromISO(r.date).isValid);
  const todayCount = validForMetrics.filter((r) => DateTime.fromISO(r.date).hasSame(today, 'day')).length;
  const weekCount = validForMetrics.filter((r) => { const d = DateTime.fromISO(r.date); return d >= weekStart && d <= weekEnd; }).length;
  const monthCount = validForMetrics.filter((r) => { const d = DateTime.fromISO(r.date); return d >= monthStart && d <= monthEnd; }).length;

  const goToPrevDay = () => setSelectedDate((prev) => prev.minus({ days: 1 }));
  const goToNextDay = () => setSelectedDate((prev) => prev.plus({ days: 1 }));
  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(DateTime.fromISO(e.target.value));

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div>
          <p className="text-sm text-gray-600 mb-2">Your Viv AI Link</p>
          <div className="flex space-x-2">
            <input type="text" value={aiLink} readOnly className="w-full p-2 border rounded bg-gray-100 text-sm" />
            <button onClick={copyToClipboard} className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600">Copy</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Share this link for direct AI reservations.</p>
        </div>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reservations</h1>
          <div className="flex space-x-2">
            {selectedRows.length > 0 && <button onClick={deleteSelectedRows} className="bg-red-500 text-white px-3 py-2 rounded shadow hover:bg-red-600">Delete Selected</button>}
            <button onClick={addNewRow} className="bg-gray-200 px-3 py-2 rounded shadow hover:bg-gray-300">Add New Row</button>
            <button onClick={updateReservations} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">Update Reservations</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-4 text-center"><p className="text-2xl font-bold">{todayCount}</p><p className="text-gray-600">Today</p></div>
          <div className="bg-white rounded shadow p-4 text-center"><p className="text-2xl font-bold">{weekCount}</p><p className="text-gray-600">This Week</p></div>
          <div className="bg-white rounded shadow p-4 text-center"><p className="text-2xl font-bold">{monthCount}</p><p className="text-gray-600">This Month</p></div>
        </div>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Reservations for {selectedDate.toFormat('MMMM dd, yyyy')}</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" onChange={(e) => setSelectedRows(e.target.checked ? filteredReservations.map((r) => r.id) : [])} checked={selectedRows.length === filteredReservations.length && filteredReservations.length > 0} /></th>
                {editableFields.map((key) => (
                  <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                    {headerLabels[key]} {key === 'status' && <span className="ml-1 text-gray-400 cursor-help" title={statusTooltip}>?</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res) => (
                <tr key={res.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2"><input type="checkbox" checked={selectedRows.includes(res.id)} onChange={() => setSelectedRows((prev) => prev.includes(res.id) ? prev.filter((i) => i !== res.id) : [...prev, res.id])} /></td>
                  {editableFields.map((key) => (
                    <td key={key} className="px-3 py-2">
                      <input type={key === 'timeSlot' ? 'text' : key === 'date' ? 'date' : 'text'} name={key} value={String(res[key] ?? '')} onChange={(e) => handleReservationEdit(e, res.id)} className="w-full p-1 rounded border" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default DashboardTemplate;
