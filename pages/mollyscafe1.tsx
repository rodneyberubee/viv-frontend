'use client';

import { useState } from 'react';

export default function MollysCafe() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [lastAction, setLastAction] = useState(null); // 🧠 Track last structured action

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const requestPayload: { messages: any[]; context?: any } = { messages: updatedMessages };
      if (lastAction) {
        requestPayload.context = lastAction;
      }

      const aiResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const aiData = await aiResponse.json();
      console.log('[DEBUG] Viv A response:', aiData);
      setAiData(aiData);

      if (!aiResponse.ok && !aiData.type) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiData.error || aiData.message || '⚠️ Something went wrong.'
        }]);
        return;
      }

      // 🧠 Let speakViv handle all types, including .incomplete
      const speakResponse = await fetch('/api/speakViv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiData)
      });

      const speakResult = await speakResponse.json();
      const spokenResponse = speakResult.spokenResponse;
      const structuredType = aiData.type;

      if (!spokenResponse) {
        console.warn('[WARN] No spoken response returned from speakViv:', speakResult);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Viv had trouble replying. Please try again.'
        }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: spokenResponse }]);

      // 🎯 Track the action type if applicable
      switch (structuredType) {
        case 'reservation.complete':
        case 'reservation.cancelled':
        case 'reservation.changed':
        case 'availability.available':
        case 'availability.unavailable':
        case 'reservation.error':
          setLastAction({ type: structuredType, confirmationCode: aiData.confirmationCode });
          break;
        default:
          setLastAction({ type: structuredType });
      }

    } catch (error) {
      console.error('[ERROR] Viv interaction failed:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, something went wrong while talking to Viv.'
      }]);
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
