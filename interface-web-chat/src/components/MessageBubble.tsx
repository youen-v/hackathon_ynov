import ReactMarkdown from "react-markdown";
import type { Message } from "../model/Message";


interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user";

    return (
        <div className={`message-row ${isUser ? "message-row--user" : "message-row--assistant"}`}>
            {!isUser && <div className="message-avatar" aria-hidden="true">AI</div>}
            <div className={`message-card ${isUser ? "message-card--user" : "message-card--assistant"}`}>
                <ReactMarkdown>
                    {message.text}
                </ReactMarkdown>
            </div>
        </div>
    );
}