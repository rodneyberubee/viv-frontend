'use client';

import { useState, useEffect, useRef } from 'react';

export default function MollysCafe() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        setMessages(prev => [...prev, { role: 'assistant', content: aiData.error || '⚠️ Something went wrong.' }]);
        return;
      }

      const speakResponse = await fetch('/api/speakViv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiData)
      });

      const speakResult = await speakResponse.json();
      const spokenResponse = speakResult.spokenResponse;

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: spokenResponse || '⚠️ Viv had trouble replying.' }
      ]);

      setLastAction({ type: aiData.type, confirmationCode: aiData.confirmationCode });
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, something went wrong.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* Chat container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[75%] p-3 rounded-2xl shadow text-[16px] leading-relaxed animate-fadeIn ${
                msg.role === 'assistant'
                  ? 'bg-white text-gray-900'
                  : 'bg-orange-100 text-gray-900'
              }`}
              style={{
                transition: 'all 0.3s ease-in-out',
                fontFamily: `'SF Pro Rounded', 'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif`
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="bg-white rounded-2xl px-3 py-2 shadow animate-fadeIn flex space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t bg-white flex items-center space-x-2 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none text-[16px]"
          style={{
            fontFamily: `'SF Pro Rounded', 'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif`
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl hover:bg-orange-600 transform rotate-12"
          style={{
            fontFamily: `'SF Pro Rounded', 'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif`
          }}
        >
          !V
        </button>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .animate-bounce {
          animation: bounce 1.4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
