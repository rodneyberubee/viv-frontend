import React, { useState } from 'react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('https://api.vivaitable.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Check your email for a login link!');
      } else {
        setMessage(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('[ERROR][login]', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">VivAI</h2>
        <nav className="space-y-4">
          <a className="block text-gray-600 hover:text-orange-500" href="/account">
            Create Account
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Login</h1>
        </div>

        <section className="bg-white rounded shadow p-6 space-y-6 max-w-lg">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border rounded w-full"
              placeholder="you@example.com"
            />
          </div>
          {message && (
            <div className="text-sm text-gray-700 bg-gray-50 border p-2 rounded">
              {message}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 w-full"
          >
            {loading ? 'Sending Link...' : 'Send Login Link'}
          </button>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
