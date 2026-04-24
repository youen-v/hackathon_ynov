import { useEffect, useRef } from "react";
import InputBar from "./InputBar";
import MessageBubble from "./MessageBubble";
import type { Message } from "../model/Message";


interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
  loading: boolean;
}

export default function ChatWindow({ messages, onSend, loading }: ChatWindowProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const suggestions = [
    "Comment puis-je commencer à investir en bourse?",
    "Quels sont les meilleurs moyens d'épargner pour la retraite?",
    "Comment établir un budget mensuel efficace?",
  ];

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  return (
    <section className="chat">
      <div className="chat__messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat__empty">
            <h2>Bienvenue</h2>
            <p>Je suis pret a t'aider. Essaie une suggestion pour commencer.</p>
            <div className="chat__suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="chat__suggestion"
                  type="button"
                  onClick={() => onSend(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {loading && (
          <div className="chat__typing" aria-live="polite">
            <span className="chat__dot" />
            <span className="chat__dot" />
            <span className="chat__dot" />
          </div>
        )}
      </div>
      <InputBar onSend={onSend} loading={loading} />
    </section>
  )
}

