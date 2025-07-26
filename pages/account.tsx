import React, { useState } from 'react';

const AccountCreation = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    slug: '',
    restaurantId: '',
    baseId: '',
    tableName: '',
    maxReservations: 10,
    futureCutoff: 30,
    timeZone: 'America/Los_Angeles',
    mondayOpen: '',
    mondayClose: '',
    tuesdayOpen: '',
    tuesdayClose: '',
    wednesdayOpen: '',
    wednesdayClose: '',
    thursdayOpen: '',
    thursdayClose: '',
    fridayOpen: '',
    fridayClose: '',
    saturdayOpen: '',
    saturdayClose: '',
    sundayOpen: '',
    sundayClose: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const createAccount = async () => {
    try {
      const res = await fetch('https://api.vivaitable.com/api/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert('Account successfully created!');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to create account'}`);
      }
    } catch (err) {
      console.error('[ERROR] Account creation failed:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <nav className="space-y-4">
          <a className="block text-gray-600 hover:text-orange-500">Reservations</a>
          <a className="block text-gray-600 hover:text-orange-500">Settings</a>
          <a className="block font-medium text-orange-500">Account Creation</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Create New Restaurant Account</h1>
          <button
            onClick={createAccount}
            className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
          >
            Create Account
          </button>
        </div>

        <section className="bg-white rounded shadow p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Restaurant Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Contact Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Restaurant Slug</label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g., mollyscafe1"
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Restaurant ID</label>
              <input
                name="restaurantId"
                value={form.restaurantId}
                onChange={handleChange}
                placeholder="Unique identifier"
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Base ID</label>
              <input
                name="baseId"
                value={form.baseId}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Table Name</label>
              <input
                name="tableName"
                value={form.tableName}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Max Reservations</label>
              <input
                name="maxReservations"
                type="number"
                value={form.maxReservations}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Future Cutoff (days)</label>
              <input
                name="futureCutoff"
                type="number"
                value={form.futureCutoff}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Timezone</label>
              <input
                name="timeZone"
                value={form.timeZone}
                onChange={handleChange}
                placeholder="e.g., America/Los_Angeles"
                className="p-2 border rounded w-full"
              />
            </div>
          </div>

          <div className="mt-4 overflow-auto">
            <h3 className="text-lg font-semibold mb-2">Operating Hours</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <th key={day} className="border px-2 py-1 capitalize">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <td key={day + 'Open'} className="border px-1 py-1">
                      <input
                        type="time"
                        name={`${day}Open`}
                        value={form[`${day}Open`] || ''}
                        onChange={handleChange}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <td key={day + 'Close'} className="border px-1 py-1">
                      <input
                        type="time"
                        name={`${day}Close`}
                        value={form[`${day}Close`] || ''}
                        onChange={handleChange}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AccountCreation;
