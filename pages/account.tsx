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
            <Link href="/" className="text-gray-700 hover:text-orange-500">Home</Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-500">Contact</Link>
            <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* ...rest of the file remains unchanged... */}
    </div>
  );
};

export default AccountCreation;
