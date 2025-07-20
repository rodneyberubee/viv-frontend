import React from 'react';

export default function MollysCafeDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Restaurant Dashboard</h1>

      {/* READ ZONE – Restaurant Settings */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">📖 View Restaurant Settings</h2>
        <div className="bg-white shadow-md rounded-xl p-4 space-y-2">
          <div><strong>Restaurant Name:</strong> Molly's Cafe</div>
          <div><strong>Time Zone:</strong> America/Los_Angeles</div>
          <div><strong>Current Time (calibrated):</strong> 12:43 PM</div>
          <div><strong>Max Reservations:</strong> 2</div>
        </div>
      </section>

      {/* READ ZONE – Operating Hours */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">📖 Weekly Hours</h2>
        <div className="bg-white shadow-md rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
            <div key={day} className="">
              <strong>{day}:</strong> <br />
              Open: --:-- <br />
              Close: --:--
            </div>
          ))}
        </div>
      </section>

      {/* WRITE ZONE – Update Restaurant Settings */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">✏️ Update Restaurant Settings</h2>
        <form className="bg-white shadow-md rounded-xl p-4 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Max Reservations</label>
            <input type="number" placeholder="2" className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Time Zone</label>
            <input type="text" placeholder="America/Los_Angeles" className="w-full border rounded p-2" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save Settings
          </button>
        </form>
      </section>

      {/* WRITE ZONE – Set Weekly Hours */}
      <section>
        <h2 className="text-xl font-semibold mb-2">✏️ Update Weekly Hours</h2>
        <form className="bg-white shadow-md rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
            <div key={day} className="">
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
    </div>
  );
}
