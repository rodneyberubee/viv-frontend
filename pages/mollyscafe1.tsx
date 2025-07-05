'use client';

import { useState } from 'react';

export default function ChatPage() {
  const restaurantId = 'mollyscafe1'; // hardcoded for now

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm Viv 👋 — your reservation assistant for Molly's Cafe. How can I help?`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/askViv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          restaurantId
        })
      });

      const data = await res.json();
      const reply = data.reply || '⚠️ Viv didn’t reply.';

      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Viv error:', err);
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: '⚠️ Viv ran into an error. Try again shortly.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>Viv – Molly's Cafe</h1>
      <div style={{
        marginBottom: '1rem',
        maxHeight: 400,
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: 10,
        borderRadius: 8
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === 'user' ? 'right' : 'left',
              marginBottom: 8
            }}
          >
            <span style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              borderRadius: 16,
              background: msg.role === 'user' ? '#007aff' : '#eee',
              color: msg.role === 'user' ? '#fff' : '#000'
            }}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            flexGrow: 1,
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: 8
          }}
          placeholder="Ask Viv anything..."
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            background: '#007aff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
