import { useState } from 'react'
import './App.css'

import type { Message } from './model/Message';
import { sendMessage } from './services/api'
import ChatWindow from './components/ChatWindow';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text: message,
      role: 'user',
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);
    try {
      const response = await sendMessage(message);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response,
        role: 'assistant'
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      setMessages((prevMessages) => [...prevMessages, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again later.'
      }]);
    }
    setLoading(false);
  };

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <span className="app-shell__badge">Assistant disponible</span>
        <h1>Assistant IA</h1>
        <p>Pose ta question, je t'aide en quelques secondes.</p>
      </header>
      <ChatWindow
        messages={messages}
        onSend={handleSendMessage}
        loading={loading}
      />
    </main>
  )
}

export default App
