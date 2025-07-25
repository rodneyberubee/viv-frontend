import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const VerifyPage = () => {
  const router = useRouter();
  const { token } = router.query;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your login...');

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const res = await fetch('https://api.vivaitable.com/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (res.ok) {
          // Save JWT/session to localStorage for protected routes
          localStorage.setItem('viv_session', JSON.stringify(data.session));

          setStatus('success');
          setMessage('Login successful! Redirecting...');
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push(`/dashboard/${data.session.restaurantId}`);
          }, 1500);
        } else {
          setStatus('error');
          setMessage(data.error || 'Invalid or expired login link.');
        }
      } catch (err) {
        console.error('[ERROR][verify]', err);
        setStatus('error');
        setMessage('An error occurred while verifying your login.');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Login Verification</h1>
        <p
          className={`mb-4 ${
            status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-500' : 'text-gray-700'
          }`}
        >
          {message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/login')}
            className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
          >
            Go Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
