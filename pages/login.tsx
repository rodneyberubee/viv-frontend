import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Clear old session
  useEffect(() => {
    localStorage.removeItem('jwtToken');
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.restaurantId && Date.now() < payload.exp * 1000) {
          window.location.href = `/dashboard/${payload.restaurantId}`;
        }
      } catch {
        localStorage.removeItem('jwtToken');
      }
    }
  }, []);

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
        setMessage('Check your email for a login link! (Check spam if not received)');
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">VivAI Table</h1>
          <nav className="space-x-6">
            <Link href="/" className="text-gray-700 hover:text-orange-500">Home</Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-500">Contact</Link>
            <Link href="/account" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      {/* Login Section */}
      <main className="flex-1 bg-white">
        <div className="max-w-md mx-auto px-6 py-20">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6">Login</h2>

          <section className="bg-gray-50 p-6 rounded shadow space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
              />
            </div>
            {message && (
              <div className="text-sm text-gray-700 bg-gray-100 border p-2 rounded">
                {message}
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded shadow hover:bg-orange-600"
            >
              {loading ? 'Sending Link...' : 'Send Login Link'}
            </button>
            <div className="text-center text-sm">
              <Link href="/account" className="text-orange-500 hover:underline">
                Don’t have an account? Create one
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
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

export default LoginPage;
