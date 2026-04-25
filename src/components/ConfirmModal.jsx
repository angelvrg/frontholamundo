import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  title = 'Confirmar acción',
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'danger',
}) {
  return (
    <>
      <div className="modal-backdrop-custom" onClick={onCancel} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered modal-custom" role="document">
          <div className="modal-content card-soft border-0 animate-in glass">
            <div className="modal-header border-0 pb-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 36, height: 36, background: '#fef3c7' }}
                >
                  <AlertTriangle size={18} className="text-warning" />
                </div>
                <h5 className="modal-title mb-0 fw-bold">{title}</h5>
              </div>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar" />
            </div>
            <div className="modal-body pt-2">
              <p className="mb-0 text-muted">{message}</p>
            </div>
            <div className="modal-footer border-0 pt-2">
              <button className="btn btn-outline-secondary" onClick={onCancel}>
                {cancelText}
              </button>
              <button
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
                style={{ minWidth: 100 }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
