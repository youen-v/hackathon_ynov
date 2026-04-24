import { useEffect, useState } from 'react';
import './App.css';

import { sendMessage, checkApiHealth } from './services/api';
import { useChatStorage } from './hooks/useChatStorage';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import type { Message } from './model/Message';

function App() {
  const { chats, activeChat, activeChatId, setActiveChatId, createChat, deleteChat, addMessage } = useChatStorage();
  const [loadingChats, setLoadingChats] = useState<Set<number>>(new Set());
  const [notifyChats, setNotifyChats] = useState<Set<number>>(new Set());
  const [respondedChats, setRespondedChats] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
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
    setLoadingChats(prev => new Set([...prev, chatId!]));
    setRespondedChats(prev => { const s = new Set(prev); s.delete(chatId!); return s; });

    try {
      const response = await sendMessage(message);
      const botMessage: Message = { id: Date.now() + 1, text: response, role: 'assistant' };
      addMessage(chatId, botMessage);
      if (notifyChats.has(chatId)) {
        setRespondedChats(prev => new Set([...prev, chatId!]));
      }
    } catch {
      addMessage(chatId, { id: Date.now() + 1, role: 'assistant', text: 'Une erreur est survenue. Réessayez.' });
    }
    setLoadingChats(prev => { const s = new Set(prev); s.delete(chatId!); return s; });
  };

  const handleToggleNotify = () => {
    if (!activeChatId) return;
    const id = activeChatId;
    setNotifyChats(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleResponseClick = () => {
    if (!activeChatId) return;
    const title = activeChat?.title ?? 'cette conversation';
    setToast(`Réponse reçue dans "${title}"`);
    setRespondedChats(prev => { const s = new Set(prev); s.delete(activeChatId); return s; });
    setNotifyChats(prev => { const s = new Set(prev); s.delete(activeChatId); return s; });
  };

  const isLoading = activeChatId ? loadingChats.has(activeChatId) : false;
  const notifyEnabled = activeChatId ? notifyChats.has(activeChatId) : false;
  const hasNewResponse = activeChatId ? respondedChats.has(activeChatId) : false;

  return (
    <div className="layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        loadingChatIds={loadingChats}
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
          loading={isLoading}
          notifyEnabled={notifyEnabled}
          hasNewResponse={hasNewResponse}
          onToggleNotify={handleToggleNotify}
          onResponseClick={handleResponseClick}
        />
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default App;
