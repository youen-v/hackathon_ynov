import React from "react";

interface InputBarProps {
    onSend: (message: string) => void;
    loading: boolean;
}

export default function InputBar({ onSend, loading }: InputBarProps) {
    const [input, setInput] = React.useState("");

    const handleSubmit = () => {
        if (input.trim() === "" || loading) return;
        onSend(input);
        setInput("");
    }

    return (
        <div className="composer">
            <input
                className="composer__input"
                type="text"
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Ecris ton message..."
                aria-label="Message"
            />
            <button className="composer__button" onClick={handleSubmit} type="button" disabled={loading}>
                Envoyer
            </button>
        </div>
    );
}