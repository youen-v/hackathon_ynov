import { useState, useEffect } from "react";
import type { Chat } from "../model/Chat";
import type { Message } from "../model/Message";

const STORAGE_KEY = "techcorp_chats";
const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB safety margin under 5 MB

function load(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(chats: Chat[]) {
  try {
    const serialized = JSON.stringify(chats);
    if (new Blob([serialized]).size > MAX_BYTES) {
      // Retire le chat le plus ancien pour faire de la place
      const trimmed = chats.slice(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // localStorage plein — on ignore silencieusement
  }
}

export function useChatStorage() {
  const [chats, setChats] = useState<Chat[]>(load);
  const [activeChatId, setActiveChatId] = useState<number | null>(() => {
    const saved = load();
    return saved.length > 0 ? saved[saved.length - 1].id : null;
  });

  useEffect(() => {
    save(chats);
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  function createChat(): number {
    const id = Date.now();
    const newChat: Chat = { id, title: "Nouvelle conversation", messages: [], createdAt: id };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(id);
    return id;
  }

  function deleteChat(id: number) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }

  function addMessage(chatId: number, message: Message) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const messages = [...c.messages, message];
        // Titre auto = premier message utilisateur tronqué à 35 chars
        const title =
          c.messages.length === 0 && message.role === "user"
            ? message.text.slice(0, 35) + (message.text.length > 35 ? "…" : "")
            : c.title;
        return { ...c, messages, title };
      })
    );
  }

  return { chats, activeChat, activeChatId, setActiveChatId, createChat, deleteChat, addMessage };
}
