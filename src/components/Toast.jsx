export default function Toast({ toast, onClose }) {
  const icons = { info: "ℹ️", success: "✅", error: "❌" };
  return (
    <div className={`toast ${toast.type}`}>
      <span>{icons[toast.type] || "ℹ️"}</span>
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}
