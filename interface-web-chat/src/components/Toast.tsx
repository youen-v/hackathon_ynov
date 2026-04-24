import { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 4000);
    const remove = setTimeout(onDismiss, 4300);
    return () => { clearTimeout(hide); clearTimeout(remove); };
  }, [message]);

  if (!message) return null;

  return (
    <div className={`toast ${visible ? 'toast--in' : 'toast--out'}`} role="status">
      <span className="toast__bell">🔔</span>
      <span className="toast__text">{message}</span>
      <button
        className="toast__close"
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
