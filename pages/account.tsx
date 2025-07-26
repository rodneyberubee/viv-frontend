import React, { useState } from 'react';
import { DateTime } from 'luxon';

const usTimeZones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
];

// Helper: Parse flexible time input to HH:mm or return null
const parseTimeInput = (input: string): string | null => {
  if (!input) return '';
  const cleaned = input.trim().toUpperCase().replace(/\./g, '').replace(/\s+/g, '');
  const withSpace = cleaned.replace(/(AM|PM)$/, ' $1'); // add space before AM/PM
  const formats = ['h:mm a', 'h a', 'H:mm', 'H']; // supported formats
  for (const fmt of formats) {
    const dt = DateTime.fromFormat(withSpace, fmt);
    if (dt.isValid) return dt.toFormat('HH:mm');
  }
  return null; // invalid
};

const AccountCreation = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const createAccount = async () => {
    // Parse and validate time fields
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const parsedForm = { ...form };
    for (const day of days) {
      const openKey = `${day}Open`;
      const closeKey = `${day}Close`;
      if (parsedForm[openKey]) {
        const parsed = parseTimeInput(parsedForm[openKey]);
        if (!parsed) {
          alert(`Invalid time format for ${day} open: ${parsedForm[openKey]}`);
          return;
        }
        parsedForm[openKey] = parsed;
      }
      if (parsedForm[closeKey]) {
        const parsed = parseTimeInput(parsedForm[closeKey]);
        if (!parsed) {
          alert(`Invalid time format for ${day} close: ${parsedForm[closeKey]}`);
          return;
        }
        parsedForm[closeKey] = parsed;
      }
    }

    try {
      const res = await fetch('https://api.vivaitable.com/api/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedForm),
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
              <select
                name="timeZone"
                value={form.timeZone}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              >
                {usTimeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
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
                        type="text"
                        name={`${day}Open`}
                        value={form[`${day}Open`] || ''}
                        onChange={handleChange}
                        placeholder="e.g., 10am"
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <td key={day + 'Close'} className="border px-1 py-1">
                      <input
                        type="text"
                        name={`${day}Close`}
                        value={form[`${day}Close`] || ''}
                        onChange={handleChange}
                        placeholder="e.g., 10pm"
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
