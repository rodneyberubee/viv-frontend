'use client';

import { useState } from 'react';

export default function MollysCafe() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<any>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const requestPayload: { messages: any[]; context?: any } = { messages: updatedMessages };
      if (lastAction) requestPayload.context = lastAction;

      const aiResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const aiData = await aiResponse.json();

      if (!aiResponse.ok && !aiData.type) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiData.error || aiData.message || '⚠️ Something went wrong.'
        }]);
        return;
      }

      const speakResponse = await fetch('/api/speakViv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiData)
      });

      const speakResult = await speakResponse.json();
      const spokenResponse = speakResult.spokenResponse;
      const structuredType = aiData.type;

      if (!spokenResponse) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Viv had trouble replying. Please try again.' }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: spokenResponse }]);

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
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, something went wrong while talking to Viv.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xs px-4 py-2 rounded-lg shadow ${
              msg.role === 'assistant'
                ? 'bg-white text-gray-800 self-start'
                : 'bg-orange-100 text-gray-900 self-end'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white shadow-inner flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center transform -rotate-90 hover:bg-orange-600 transition"
        >
          <span className="text-lg font-bold">!V</span>
        </button>
      </div>
    </div>
  );
}
