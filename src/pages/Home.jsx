import { useEffect, useMemo, useState } from 'react';
import { Activity, Camera, Car, Search, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { getHistorial, getPlaca, getVehiculos, crearWebSocket, getEstado } from '../api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatConfidence, formatTimestamp, formatDateTime } from '../utils/format';
import { useCountUp } from '../hooks/useCountUp';

function PlateModal({ plate, onClose }) {
  const [details, setDetails] = useState(plate);

  useEffect(() => {
    if (plate && plate.dueno === undefined) {
      getPlaca(plate.placa)
        .then((data) => setDetails((prev) => ({ ...prev, ...data })))
        .catch(console.error);
    }
  }, [plate]);

  if (!plate) return null;
  return (
    <>
      <div className="modal-backdrop-custom" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered modal-custom" role="document">
          <div className="modal-content card-soft border-0 animate-in glass">
            <div className="modal-header border-0 pb-2">
              <div>
                <h5 className="modal-title fw-bold">Detalle de placa</h5>
                <p className="text-muted mb-0 small">Información del vehículo detectado</p>
              </div>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="mb-3 d-flex align-items-center gap-2">
                <span className="badge bg-primary px-3 py-2 fs-6">{details.placa}</span>
                <StatusBadge estado={details.estado} />
              </div>
              <dl className="row mb-0">
                <dt className="col-sm-5 text-muted small">Hora de detección</dt>
                <dd className="col-sm-7">{formatDateTime(details.timestamp)}</dd>
                <dt className="col-sm-5 text-muted small">Confianza</dt>
                <dd className="col-sm-7 fw-semibold text-success">{formatConfidence(details.confianza)}</dd>
                <dt className="col-sm-5 text-muted small">Dueño</dt>
                <dd className="col-sm-7">{details.dueno || 'Desconocido'}</dd>
                <dt className="col-sm-5 text-muted small">Marca</dt>
                <dd className="col-sm-7">{details.marca || 'Desconocido'}</dd>
                <dt className="col-sm-5 text-muted small">Modelo</dt>
                <dd className="col-sm-7">{details.modelo || 'Desconocido'}</dd>
                <dt className="col-sm-5 text-muted small">Color</dt>
                <dd className="col-sm-7">{details.color || 'Desconocido'}</dd>
                <dt className="col-sm-5 text-muted small">Año</dt>
                <dd className="col-sm-7">{details.anio ?? 'N/A'}</dd>
              </dl>
            </div>
            <div className="modal-footer border-0 pt-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({ icon: Icon, title, value, variant = 'primary' }) {
  const colors = {
    primary: { bg: '#dcfce7', icon: '#14532d', text: '#14532d' },
    success: { bg: '#dcfce7', icon: '#14532d', text: '#14532d' },
    warning: { bg: '#fef3c7', icon: '#92400e', text: '#92400e' },
    danger:  { bg: '#fee2e2', icon: '#991b1b', text: '#991b1b' },
  };
  const c = colors[variant] || colors.primary;
  return (
    <div className="kpi-card d-flex align-items-center gap-3">
      <div
        className="d-flex align-items-center justify-content-center rounded-3"
        style={{ width: 48, height: 48, background: c.bg, color: c.icon }}
      >
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <div className="text-muted small">{title}</div>
        <div className="fw-bold fs-5" style={{ color: c.text }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ cols = 3 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3">
          <div className="skeleton" style={{ height: 14, width: i === cols - 1 ? '60%' : '80%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function Home() {
  const [selectedPlate, setSelectedPlate] = useState(null);
  const [search, setSearch] = useState('');
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('conectando...');
  const [camStatus, setCamStatus] = useState('—');
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    setLoading(true);
    getHistorial(50)
      .then((data) => setPlates(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err.message || 'Error al conectar con el Backend');
        setPlates([]);
      })
      .finally(() => setLoading(false));

    getEstado().then((d) => setCamStatus(d.camara || '—')).catch(() => setCamStatus('sin conexión'));
    getVehiculos(1000, 0)
      .then((d) => setTotalVehiculos(Array.isArray(d) ? d.length : 0))
      .catch(() => setTotalVehiculos(0));

    const ws = crearWebSocket();
    ws.onopen = () => setWsStatus('conectado');
    ws.onclose = () => setWsStatus('desconectado');
    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (event) => {
      try {
        const deteccion = JSON.parse(event.data);
        if (deteccion.tipo === 'deteccion') {
          setPlates((prev) => [deteccion, ...prev]);
          toast.success(`Detectada: ${deteccion.placa}`, { duration: 2500 });
        }
      } catch (e) {
        console.error('Error procesando el WS:', e);
      }
    };

    return () => ws.close();
  }, []);

  const visiblePlates = useMemo(() => {
    let list = plates;
    if (filterEstado !== 'todos') {
      list = list.filter((p) => (p.estado || '').toLowerCase() === filterEstado);
    }
    if (search.trim()) {
      list = list.filter((p) => p.placa?.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [plates, search, filterEstado]);

  const stats = {
    total: plates.length,
    autorizados: plates.filter((p) => p.estado === 'autorizado').length,
    sospechosos: plates.filter((p) => p.estado === 'sospechoso').length,
  };

  const animatedTotal = useCountUp(stats.total);
  const animatedSospechosos = useCountUp(stats.sospechosos);

  return (
    <div className="container-fluid app-shell py-4">
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <p className="text-success mb-1 small fw-semibold text-uppercase tracking-wide">Sistema activo</p>
          <h1 className="page-header-title display-6 mb-0">Dashboard</h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            className={`badge ${wsStatus === 'conectado' ? 'bg-success' : 'bg-warning'} bg-opacity-75 d-flex align-items-center gap-1`}
            style={{ fontSize: '0.75rem', padding: '0.45em 0.8em', borderRadius: 999 }}
          >
            <Wifi size={12} strokeWidth={2.5} />
            WS: {wsStatus}
          </span>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <KpiCard icon={Activity} title="Detecciones hoy" value={animatedTotal} variant="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard
            icon={Camera}
            title="Cámara"
            value={camStatus === 'activa' ? 'Activa' : 'Detenida'}
            variant={camStatus === 'activa' ? 'success' : 'warning'}
          />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Car} title="Vehículos registrados" value={totalVehiculos} variant="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard icon={Search} title="Sospechosos" value={animatedSospechosos} variant="danger" />
        </div>
      </div>

      <div className="row gy-4">
        <div className="col-lg-7">
          <div className="card card-soft h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="h5 mb-1 fw-bold">Video de detección</h2>
                  <p className="text-muted small mb-0">Demostración del sistema LPR</p>
                </div>
                <span className="badge bg-danger d-flex align-items-center gap-2" style={{ borderRadius: 999, padding: '0.45em 0.8em' }}>
                  <span className="live-pulse" />
                  En vivo
                </span>
              </div>
              <div className="video-box">
                <video autoPlay muted loop playsInline>
                  <source src="/videoPlacas.mp4" type="video/mp4" />
                  Tu navegador no soporta video HTML.
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card card-soft h-100 border-0 shadow-sm table-card">
            <div className="card-body d-flex flex-column h-100">
              <div className="mb-3">
                <h2 className="h5 mb-1 fw-bold">Placas detectadas</h2>
                <p className="text-muted small mb-0">Historial y detecciones en tiempo real</p>
              </div>

              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={16} className="text-muted" />
                  </span>
                  <input
                    type="search"
                    className="form-control border-start-0"
                    placeholder="Buscar placa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-2 d-flex gap-2 flex-wrap">
                {['todos', 'autorizado', 'sospechoso', 'no_registrado'].map((f) => (
                  <button
                    key={f}
                    className={`btn btn-sm ${filterEstado === f ? 'btn-brand' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterEstado(f)}
                  >
                    {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="table-responsive flex-grow-1" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  <table className="table table-borderless align-middle mb-0">
                    <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                      <tr>
                        <th className="text-muted small fw-semibold">Placa</th>
                        <th className="text-muted small fw-semibold">Estado</th>
                        <th className="text-muted small fw-semibold text-end">Confianza</th>
                      </tr>
                    </thead>
                    <tbody>
                      <SkeletonRow cols={3} />
                      <SkeletonRow cols={3} />
                      <SkeletonRow cols={3} />
                      <SkeletonRow cols={3} />
                      <SkeletonRow cols={3} />
                    </tbody>
                  </table>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-danger">{error}</div>
              ) : (
                <div className="table-responsive flex-grow-1" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  <table className="table table-borderless align-middle mb-0">
                    <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                      <tr>
                        <th className="text-muted small fw-semibold">Placa</th>
                        <th className="text-muted small fw-semibold">Estado</th>
                        <th className="text-muted small fw-semibold text-end">Confianza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlates.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-4">
                            No se encontraron placas.
                          </td>
                        </tr>
                      ) : (
                        visiblePlates.map((plate, i) => (
                          <tr key={plate.placa + '-' + i} className="list-item" onClick={() => setSelectedPlate(plate)}>
                            <td className="py-3">
                              <strong>{plate.placa}</strong>
                              <div className="text-muted small">{formatTimestamp(plate.timestamp)}</div>
                            </td>
                            <td>
                              <StatusBadge estado={plate.estado} />
                            </td>
                            <td className="text-end text-success fw-semibold">{formatConfidence(plate.confianza)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPlate && <PlateModal plate={selectedPlate} onClose={() => setSelectedPlate(null)} />}
    </div>
  );
}
