import React from 'react';

export default function MollysCafeDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold mb-4">Molly’s Café Dashboard</h1>

      {/* 🔼 TOP HALF — RESTAURANT SETTINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* VIEW SETTINGS */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">📖 Current Settings</h2>
          <p><strong>Restaurant Name:</strong> Molly's Cafe</p>
          <p><strong>Time Zone:</strong> America/Los_Angeles</p>
          <p><strong>Current Time:</strong> 12:43 PM</p>
          <p><strong>Max Reservations per Slot:</strong> 2</p>
        </section>

        {/* UPDATE SETTINGS */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">✏️ Update Settings</h2>
          <form className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Max Reservations</label>
              <input type="number" placeholder="2" className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Time Zone</label>
              <input type="text" placeholder="America/Los_Angeles" className="w-full border rounded p-2" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Update Settings
            </button>
          </form>
        </section>
      </div>

      {/* STORE HOURS */}
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

      {/* 🔽 BOTTOM HALF — RESERVATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RESERVATION TABLE */}
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
              <tr>
                <td className="border px-3 py-2">ABC123</td>
                <td className="border px-3 py-2">John Smith</td>
                <td className="border px-3 py-2">2</td>
                <td className="border px-3 py-2">2025-07-21</td>
                <td className="border px-3 py-2">6:30 PM</td>
                <td className="border px-3 py-2">confirmed</td>
              </tr>
              <tr>
                <td className="border px-3 py-2">XYZ456</td>
                <td className="border px-3 py-2">Jane Doe</td>
                <td className="border px-3 py-2">4</td>
                <td className="border px-3 py-2">2025-07-21</td>
                <td className="border px-3 py-2">7:00 PM</td>
                <td className="border px-3 py-2">blocked</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ADD/UPDATE RESERVATION */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">✏️ Add or Update Reservation</h2>
          <form className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Guest Name</label>
              <input type="text" className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Party Size</label>
              <input type="number" className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <input type="date" className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Time</label>
              <input type="time" className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Contact Info</label>
              <input type="text" className="w-full border rounded p-2" />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Submit Reservation
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
