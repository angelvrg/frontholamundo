import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Sin resultados', message, action }) {
  return (
    <div className="text-center py-5 animate-in">
      <div
        className="mb-3 text-muted d-inline-flex align-items-center justify-content-center rounded-circle"
        style={{ width: 80, height: 80, background: 'rgba(15,23,42,0.03)' }}
      >
        <Inbox size={40} strokeWidth={1.2} className="opacity-50" />
      </div>
      <h5 className="text-muted fw-bold mb-1">{title}</h5>
      {message && <p className="text-muted small mb-3">{message}</p>}
      {action}
    </div>
  );
}
