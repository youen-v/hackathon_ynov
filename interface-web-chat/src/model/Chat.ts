import type { Message } from "./Message";

export type Chat = {
  id: number;
  title: string;
  messages: Message[];
  createdAt: number;
};
