'use client';

import { useState } from 'react';

export default function MollysCafe() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiData, setAiData] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const aiData = await aiResponse.json();
      console.log('[DEBUG] Viv A response:', aiData);
      setAiData(aiData);

      const assistantReply =
        aiData.response ||
        aiData.raw ||
        aiData.message ||
        aiData.reply ||
        (aiData.type?.startsWith('availability.check') && aiData.available === false
          ? `I'm sorry, that time is booked. Want to try ${aiData.alternatives?.before} or ${aiData.alternatives?.after}?`
          : JSON.stringify(aiData, null, 2));

      console.log('[Viv DEBUG] Assistant is replying with:', JSON.stringify(assistantReply));

      if (typeof assistantReply === 'string' && assistantReply.trim() !== '') {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantReply }]);
      }

      // ✅ Reservation was already created by Viv A — just confirm it to the guest
      if (aiData.type === 'reservation.complete' && aiData.parsed) {
        const summaryText = `Reservation complete: ${aiData.parsed.partySize} people under the name ${aiData.parsed.name} at ${aiData.parsed.timeSlot} on ${aiData.parsed.date}.`;

        const handoffMessages = [
          { role: 'system', content: summaryText },
          { role: 'user', content: 'Can you confirm it for the guest in your own words?' }
        ];

        const followupResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...updatedMessages, ...handoffMessages] })
        });

        const followupData = await followupResponse.json();
        const followup = followupData.response || followupData.raw;
        if (followup) {
          setMessages(prev => [...prev, { role: 'assistant', content: followup }]);
        }
      }
    } catch (error) {
      console.error('[ERROR] Viv interaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}><strong>{msg.role}:</strong> {msg.content}</li>
        ))}
      </ul>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }}
      />
      <button
        onClick={sendMessage}
        disabled={isLoading}
        style={{ marginTop: '0.5rem', padding: '0.5rem 1rem' }}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>

      {messages.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '12px', color: 'gray' }}>
          <strong>Last Viv Message:</strong>
          <pre>{JSON.stringify(messages[messages.length - 1], null, 2)}</pre>
        </div>
      )}

      {aiData && (
        <div style={{ marginTop: '1rem', fontSize: '12px', color: '#888' }}>
          <strong>🧠 Viv AI Debug Info:</strong>
          <pre>{JSON.stringify(aiData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
