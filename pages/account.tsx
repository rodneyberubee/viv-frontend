import React, { useState } from 'react';
import Link from 'next/link';
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

const parseTimeInput = (input: string): string | null => {
  if (!input) return '';
  const cleaned = input.trim().toUpperCase().replace(/\./g, '').replace(/\s+/g, '');
  const withSpace = cleaned.replace(/(AM|PM)$/, ' $1');
  const formats = ['h:mm a', 'h a', 'H:mm', 'H'];
  for (const fmt of formats) {
    const dt = DateTime.fromFormat(withSpace, fmt);
    if (dt.isValid) return dt.toFormat('HH:mm');
  }
  return null;
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const createAccount = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.timeZone.trim()) {
      alert('Please fill in all required fields: Restaurant Name, Contact Email, and Timezone.');
      return;
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
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
      setLoading(true);
      const res = await fetch('https://api.vivaitable.com/api/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedForm),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to create account'}`);
        return;
      }

      const { restaurantId, email } = await res.json();
      if (!restaurantId || !email) {
        alert('Account created but missing required data for checkout.');
        return;
      }

      const stripeRes = await fetch('https://api.vivaitable.com/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, email }),
      });

      const { url } = await stripeRes.json();
      if (url) {
        window.location.href = url;
      } else {
        alert('Failed to start payment process.');
      }
    } catch (err) {
      console.error('[ERROR] Account creation/checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">VivAI Table</h1>
          <nav className="space-x-6">
            <Link href="/contact" className="text-gray-700 hover:text-orange-500">Contact</Link>
            <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 flex justify-center items-start">
        <section className="bg-white rounded shadow p-6 space-y-6 w-full max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Create Your Restaurant Account</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Restaurant Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
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
              <label className="block text-gray-700 font-medium mb-1">
                Timezone <span className="text-red-500">*</span>
              </label>
              <select
                name="timeZone"
                value={form.timeZone}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              >
                {usTimeZones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-auto">
            <div className="flex items-center gap-2 mb-2 relative">
              <h3 className="text-lg font-semibold">Operating Hours</h3>
              <div className="relative group">
                <span className="text-sm text-gray-400 cursor-help border border-gray-300 rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-100">?</span>
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 w-64 text-xs bg-gray-700 text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  If your restaurant closes at midnight, enter <strong>23:59</strong> or <strong>11:59PM</strong> to avoid overlap.
                </div>
              </div>
            </div>

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

          <div className="pt-4 text-right">
            <button
              onClick={createAccount}
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-white shadow mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} VivAI Table. All rights reserved.</p>
          <div className="space-x-4">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AccountCreation;
