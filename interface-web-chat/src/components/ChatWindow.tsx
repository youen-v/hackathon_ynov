import InputBar from "./InputBar";
import MessageBubble from "./MessageBubble";
import type { Message } from "../model/Message";


interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
  loading: boolean;
}

export default function ChatWindow({ messages, onSend, loading }: ChatWindowProps) {
    return (
        <div>
            <div>
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}
                {loading && <div>Thinking...</div>}
            </div>
            <InputBar onSend={onSend} />
        </div>
    )
}