import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="text-center py-5 text-muted animate-in">
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
        style={{ width: 56, height: 56, background: 'rgba(15,23,42,0.03)' }}
      >
        <Loader2 size={28} className="spin" />
      </div>
      <p className="mb-0 small">{message}</p>
    </div>
  );
}
