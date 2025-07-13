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

      // 🧠 If we have a lastAction, inject lightweight context
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

      if (!aiResponse.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiData.error || aiData.message || '⚠️ Something went wrong.'
        }]);
        return;
      }

      const structuredType = aiData.type;
      const naturalSpeech = aiData.spokenResponse;

      if (structuredType === 'chat' || !structuredType) {
        const assistantReply = naturalSpeech || aiData.response || aiData.message || aiData.reply || 'How can I help you today?';
        setMessages(prev => [...prev, { role: 'assistant', content: assistantReply }]);
        return;
      }

      if (structuredType === 'reservation.complete') {
        const {
          name,
          partySize,
          contactInfo,
          date,
          timeSlot,
          confirmationCode
        } = aiData;

        const summary = naturalSpeech || `✅ Reservation confirmed for ${name} (${partySize} guests) at ${timeSlot} on ${date}. Confirmation code: ${confirmationCode}. We'll contact you at ${contactInfo}.`;

        setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
        setLastAction({ type: 'reservation.complete', confirmationCode });
        return;
      }

      if (structuredType === 'reservation.cancelled') {
        const { confirmationCode } = aiData;
        const summary = naturalSpeech || `🗑️ Reservation ${confirmationCode} has been cancelled.`;
        setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
        setLastAction({ type: 'reservation.cancelled', confirmationCode });
        return;
      }

      if (structuredType === 'reservation.changed') {
        const {
          confirmationCode,
          oldDate,
          oldTimeSlot,
          newDate,
          newTimeSlot
        } = aiData;

        const summary = naturalSpeech || `🔁 Reservation ${confirmationCode} has been updated from ${oldTimeSlot} on ${oldDate} to ${newTimeSlot} on ${newDate}.`;
        setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
        setLastAction({ type: 'reservation.changed', confirmationCode });
        return;
      }

      if (structuredType === 'availability.available') {
        const { date, timeSlot, remaining } = aiData;
        const summary = naturalSpeech || `✅ Yes! ${timeSlot} on ${date} is available. Remaining spots: ${remaining}.`;
        setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
        setLastAction({ type: 'availability.available' });
        return;
      }

      if (structuredType === 'availability.unavailable') {
        const { date, timeSlot, alternatives, reason } = aiData;

        const altText = alternatives?.before || alternatives?.after
          ? `\nHere are some alternatives: ${[alternatives.before, alternatives.after].filter(Boolean).join(', ')}`
          : '';

        const reasonText = reason === 'blocked'
          ? '⛔ That time is currently blocked by the restaurant.'
          : '❌ Sorry, that time is fully booked.';

        const summary = naturalSpeech || `${reasonText}\n${altText}`;
        setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
        setLastAction({ type: 'availability.unavailable' });
        return;
      }

      if (structuredType === 'reservation.error') {
        const { error, date, timeSlot, alternatives } = aiData;

        let msg = naturalSpeech || '';
        if (!msg) {
          if (error === 'slot_full') {
            msg = `🚫 Sorry, ${timeSlot || 'that time'} on ${date || 'that day'} is fully booked.`;
          } else if (error === 'time_blocked') {
            msg = `⛔ That time is currently blocked by the restaurant.`;
          } else {
            msg = `⚠️ Sorry, we couldn’t complete your reservation.`;
          }

          if (alternatives && alternatives.length) {
            msg += `\nHere are some nearby options: ${alternatives.join(', ')}`;
          }
        }

        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
        setLastAction({ type: 'reservation.error' });
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: naturalSpeech || `Thanks! Your request of type "${structuredType}" has been processed.`
      }]);
      setLastAction({ type: structuredType });

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
