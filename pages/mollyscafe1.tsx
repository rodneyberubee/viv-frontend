'use client';

import { useState } from 'react';

export default function Mollyscafe1Page() {
  const restaurantId = 'mollyscafe1';

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
      const payload = {
        userMessage: updatedMessages,
        restaurantId,
        route: 'reservation' // change if needed
      };

      const res = await fetch('/api/askViv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const reply = data.reply || '[No reply from Viv]';

      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Fetch error:', err);
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: '⚠️ Viv ran into an error.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>Viv AI – {restaurantId}</h1>
      <div style={{ marginBottom: '1rem', maxHeight: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 10, borderRadius: 8 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: 8 }}>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: msg.role === 'user' ? '#007aff' : '#eee',
              color: msg.role === '
