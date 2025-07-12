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

      const assistantReply = aiData.response || aiData.raw || aiData.message || aiData.reply;
      const structuredType = aiData.type;
      const structuredParsed = aiData.parsed;

      // If Viv responded with a chat/follow-up, display it directly
      if (structuredType === 'chat' || !structuredType || !structuredParsed) {
        if (typeof assistantReply === 'string' && assistantReply.trim() !== '') {
          setMessages(prev => [...prev, { role: 'assistant', content: assistantReply }]);
        }
        return;
      }

      // Viv has enough info — send to backend
      console.log('[DEBUG] Forwarding structured payload to middleware:', structuredParsed);

      const middlewareResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: structuredType,
          parsed: structuredParsed
        })
      });

      const result = await middlewareResponse.json();
      console.log('[DEBUG] Middleware (logic only) result:', result);

      // Ask Viv to confirm the backend result in her own voice
      const handoffMessages = [
        { role: 'system', content: 'You just completed this action:' },
        { role: 'system', content: JSON.stringify(result) },
        { role: 'user', content: 'Can you confirm that in your own words for the guest?' }
      ];

      const followupResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...updatedMessages, ...handoffMessages] })
      });

      const followupData = await followupResponse.json();
      const followup = followupData.response || followupData.raw;

      if (followup && typeof followup === 'string') {
        setMessages(prev => [...prev, { role: 'assistant', content: followup }]);
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
