import React, { useEffect, useState } from 'react';

export default function MollysCafeDashboard() {
  const [reservations, setReservations] = useState([]);
  const [config, setConfig] = useState({ maxReservations: '', timeZone: '' });
  const [reservationForm, setReservationForm] = useState({
    guestName: '',
    partySize: '',
    date: '',
    timeSlot: '',
    contactInfo: ''
  });

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await fetch('https://vivaitable.com/api/dashboard/mollyscafe1/reservations');
        const data = await res.json();
        console.log('[DEBUG] Dashboard fetched reservations:', data);
        setReservations(data.reservations || []);
      } catch (error) {
        console.error('[ERROR] Failed to fetch reservations:', error);
      }
    }

    fetchReservations();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const submitConfigUpdate = async (e) => {
    e.preventDefault();
    try {
      await fetch('https://vivaitable.com/api/dashboard/mollyscafe1/updateConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          maxReservations: parseInt(config.maxReservations, 10)
        })
      });
      alert('Settings updated!');
    } catch (err) {
      console.error('[ERROR] Failed to update config:', err);
    }
  };

  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    setReservationForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitReservation = async (e) => {
    e.preventDefault();
    try {
      await fetch('https://vivaitable.com/api/dashboard/mollyscafe1/updateReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reservationForm,
          partySize: parseInt(reservationForm.partySize, 10)
        })
      });
      alert('Reservation submitted!');
    } catch (err) {
      console.error('[ERROR] Failed to update reservation:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold mb-4">Molly’s Café Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">📖 Current Settings</h2>
          <p><strong>Restaurant Name:</strong> Molly's Cafe</p>
          <p><strong>Time Zone:</strong> America/Los_Angeles</p>
          <p><strong>Current Time:</strong> 12:43 PM</p>
          <p><strong>Max Reservations per Slot:</strong> 2</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">✏️ Update Settings</h2>
          <form className="space-y-4" onSubmit={submitConfigUpdate}>
            <div>
              <label className="block mb-1 font-medium">Max Reservations</label>
              <input name="maxReservations" type="number" value={config.maxReservations} onChange={handleConfigChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Time Zone</label>
              <input name="timeZone" type="text" value={config.timeZone} onChange={handleConfigChange} className="w-full border rounded p-2" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Update Config
            </button>
          </form>
        </section>
      </div>

      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">📅 Weekly Operating Hours</h2>
        <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
            <div key={day}>
              <label className="block font-medium mb-1">{day} Open</label>
              <input type="time" className="w-full border rounded p-2 mb-2" />
              <label className="block font-medium mb-1">{day} Close</label>
              <input type="time" className="w-full border rounded p-2" />
            </div>
          ))}
          <div className="col-span-full mt-4">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Save Weekly Hours
            </button>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">📖 Upcoming Reservations</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Code</th>
                <th className="border px-3 py-2 text-left">Guest</th>
                <th className="border px-3 py-2 text-left">Party</th>
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-left">Time</th>
                <th className="border px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length > 0 ? (
                reservations
