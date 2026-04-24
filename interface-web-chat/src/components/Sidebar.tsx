import type { Chat } from "../model/Chat";

interface SidebarProps {
  chats: Chat[];
  activeChatId: number | null;
  loadingChatIds: Set<number>;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
}

export default function Sidebar({ chats, activeChatId, loadingChatIds, onSelect, onCreate, onDelete }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span className="sidebar__brand">TechCorp AI</span>
        <button className="sidebar__new" onClick={onCreate} title="Nouvelle conversation">
          +
        </button>
      </div>

      <ul className="sidebar__list">
        {[...chats].reverse().map((chat) => (
          <li
            key={chat.id}
            className={`sidebar__item ${chat.id === activeChatId ? "sidebar__item--active" : ""}`}
            onClick={() => onSelect(chat.id)}
          >
            <span className="sidebar__item-title">{chat.title}</span>
            {loadingChatIds.has(chat.id) && (
              <span className="sidebar__spinner" title="Réponse en cours…" aria-label="En cours">
                <span className="sidebar__spinner-dot" />
                <span className="sidebar__spinner-dot" />
                <span className="sidebar__spinner-dot" />
              </span>
            )}
            <button
              className="sidebar__delete"
              title="Supprimer"
              onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
