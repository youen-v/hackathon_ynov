export type Message = {
  id: number;
  text: string;
  role: "user" | "assistant";
};