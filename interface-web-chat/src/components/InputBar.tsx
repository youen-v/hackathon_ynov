import React from "react";

interface InputBarProps {
    onSend: (message: string) => void;
}

export default function InputBar({ onSend }: InputBarProps) {
    const [input, setInput] = React.useState("");

    const handleSubmit = () => {
        if (input.trim() === "") return;
        onSend(input);
        setInput("");
    }

    return (
        <div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Type your message..."
            />
            <button onClick={handleSubmit}>Send</button>
        </div>
    );
}