import type { Message } from "../model/Message";


interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    return (
        <div>
            {message.text}
        </div>
    );
}