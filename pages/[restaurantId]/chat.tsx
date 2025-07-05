'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Mollyscafe1Page() {
  const restaurantId = 'mollyscafe1';

  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!router.isReady || typeof restaurantId !== 'string') {
    return <div>Loading...</div>; // SSR-safe fallback
  }

  const handleSubmit = async () => {
    if (!input) return;
    setIsLoading(true);

    try {
      const res = await fetch(`https://api.vivaitable.com/api/askViv/${restaurantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'reservation',
          userMessage: { text: input },
        }),
      });

      const data = await res.json();
      setResponse(data.message || JSON.stringify(data));
    } catch (error) {
      console.error('Error contacting Viv backend:', error);
      setResponse('❌ Error contacting Viv backend.');
    }

    setIsLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Viv AI Concierge – {restaurantId}</h1>
      <textarea
        placeholder="Type your message here"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '100%', height: '100px', marginBottom: '1rem' }}
      />
      <br />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Send to Viv'}
      </button>
      <div style={{ marginTop: '2rem' }}>
        <strong>Response:</strong>
        <pre>{response}</pre>
      </div>
    </div>
  );
}
