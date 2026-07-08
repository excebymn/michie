interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "yes mommy",
  cancelLabel = "cancel",
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="cfd-overlay" onClick={onCancel}>
      <div
        className="cfd-panel michie-box michie-box--secondary"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="cfd-title michie-text-secondary">{title}</h3>
        <p className="cfd-message michie-text-secondary">{message}</p>
        <div className="cfd-actions">
          <button
            className="cfd-btn cfd-btn--cancel michie-box michie-box--secondary michie-text-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`cfd-btn cfd-btn--confirm michie-box michie-box--primary michie-text-primary ${danger ? "cfd-btn--danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>

        <style>{`
          .cfd-overlay { position: fixed; inset: 0; z-index: 10001; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
          .cfd-panel { width: 320px; padding: 22px; display: flex; flex-direction: column; gap: 10px; }
          .cfd-title { margin: 0; font-size: 1.05rem; font-weight: 700; }
          .cfd-message { margin: 0; font-size: 0.85rem; opacity: 0.75; line-height: 1.5; }
          .cfd-actions { display: flex; gap: 8px; margin-top: 10px; }
          .cfd-btn { flex: 1; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
          .cfd-btn--danger { opacity: 0.9; }
        `}</style>
      </div>
    </div>
  );
}
