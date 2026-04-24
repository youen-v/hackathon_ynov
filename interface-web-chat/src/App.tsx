import { useEffect } from 'react';
import './App.css';

import { sendMessage, checkApiHealth } from './services/api';
import { useChatStorage } from './hooks/useChatStorage';
import { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import type { Message } from './model/Message';

function App() {
  const { chats, activeChat, activeChatId, setActiveChatId, createChat, deleteChat, addMessage } = useChatStorage();
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ok' | 'down' | 'checking'>('checking');

  useEffect(() => {
    if (chats.length === 0) createChat();
  }, []);

  useEffect(() => {
    const check = async () => {
      setApiStatus('checking');
      setApiStatus(await checkApiHealth());
    };
    check();
    const interval = setInterval(check, 350000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (message: string) => {
    let chatId = activeChatId;
    if (!chatId) chatId = createChat();

    const userMessage: Message = { id: Date.now(), text: message, role: 'user' };
    addMessage(chatId, userMessage);
    setLoading(true);

    try {
      const response = await sendMessage(message);
      const botMessage: Message = { id: Date.now() + 1, text: response, role: 'assistant' };
      addMessage(chatId, botMessage);
    } catch {
      addMessage(chatId, { id: Date.now() + 1, role: 'assistant', text: 'Une erreur est survenue. Réessayez.' });
    }
    setLoading(false);
  };

  return (
    <div className="layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onCreate={createChat}
        onDelete={deleteChat}
      />

      <div className="main">
        <header className="app-shell__header">
          <span
            className={`app-shell__badge app-shell__badge--${apiStatus}`}
            title={apiStatus === 'ok' ? 'API opérationnelle' : apiStatus === 'checking' ? 'Vérification...' : 'API indisponible'}
          >
            {apiStatus === 'ok' && 'Assistant disponible'}
            {apiStatus === 'checking' && 'Vérification...'}
            {apiStatus === 'down' && 'Assistant indisponible'}
          </span>
          <h1>Assistant Financier</h1>
          <p>Pose ta question, je t'aide en quelques secondes.</p>
        </header>

        <ChatWindow
          messages={activeChat?.messages ?? []}
          onSend={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;
