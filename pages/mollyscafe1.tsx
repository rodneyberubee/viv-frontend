import { useState, useEffect, useRef } from 'react';

type Message = {
  sender: 'user' | 'viv';
  content: string;
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const vivMessage: Message = { sender: 'viv', content: data.reply || '...' };

      setMessages([...newMessages, vivMessage]);
    } catch (error) {
      console.error('[ERROR] Failed to get Viv response:', error);
      const errorMessage: Message = { sender: 'viv', content: 'Sorry, something went wrong.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        {messages.map((msg, idx) => (
          <div key={idx} style={msg.sender === 'user' ? styles.userBubble : styles.vivBubble}>
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={styles.inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={styles.input}
          disabled={isLoading}
        />
        <button onClick={sendMessage} style={styles.button} disabled={isLoading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f5f5f5',
  },
  chatBox: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    maxWidth: '80%',
  },
  vivBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    maxWidth: '80%',
  },
  inputBar: {
    display: 'flex',
    padding: '1rem',
    borderTop: '1px solid #ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #ccc',
    marginRight: '0.5rem',
  },
  button: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: '#333',
    color: 'white',
    cursor: 'pointer',
  },
};

export default ChatPage;
