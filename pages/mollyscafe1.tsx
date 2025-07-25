'use client';

import { useState, useEffect, useRef } from 'react';

export default function MollysCafe() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload: { messages: any[]; context?: any } = { messages: [...messages, userMessage] };
      if (lastAction) payload.context = lastAction;

      const aiResponse = await fetch('https://api.vivaitable.com/api/askViv/mollyscafe1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const aiData = await aiResponse.json();

      const speakResponse = await fetch('/api/speakViv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiData)
      });
      const speakResult = await speakResponse.json();

      setMessages(prev => [...prev, { role: 'assistant', content: speakResult.spokenResponse || '⚠️ Viv had trouble replying.' }]);
      setLastAction({ type: aiData.type, confirmationCode: aiData.confirmationCode });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[75%] p-3 rounded-lg text-sm shadow ${
              msg.role === 'assistant' ? 'bg-white text-gray-900 self-start' : 'bg-orange-100 text-gray-900 self-end'
            }`}
            style={{ marginBottom: '10px' }}
          >
            {msg.content}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="bg-white rounded-full px-4 py-2 shadow flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white flex items-center space-x-2 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-orange-500 rounded-full w-12 h-12 flex items-center justify-center hover:bg-orange-600"
        >
          <span
            className=""
            style={{
              transform: 'rotate(-90deg)',
              color: '#FFA94D', // lighter orange
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}
          >
            !V
          </span>
        </button>
      </div>
    </div>
  );
}
