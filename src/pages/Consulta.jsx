import { useEffect, useState } from 'react';
import { FileSearch, Search, Clock, Pencil, CarFront, User, Palette, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getPlaca } from '../api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const ESTADO_LABELS = { autorizado: 'Autorizado', no_registrado: 'No registrado', sospechoso: 'Sospechoso' };
const ESTADO_CLASSES = { autorizado: 'success', no_registrado: 'secondary', sospechoso: 'danger' };

export default function Consulta() {
  const [busqueda, setBusqueda] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historial, setHistorial] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('consulta_historial');
    if (saved) {
      try { setHistorial(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const saveToHistory = (placa) => {
    setHistorial((prev) => {
      const next = [placa, ...prev.filter((p) => p !== placa)].slice(0, 8);
      localStorage.setItem('consulta_historial', JSON.stringify(next));
      return next;
    });
  };

  const handleBuscar = async (e) => {
    e.preventDefault();
    const placa = busqueda.trim().toUpperCase();
    if (!placa) return;

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const data = await getPlaca(placa);
      setResultado(data);
      saveToHistory(placa);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="d-flex align-items-center gap-3 py-2 border-bottom" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 32, height: 32, background: 'rgba(15,23,42,0.04)', color: 'var(--text-muted)' }}>
        <Icon size={16} />
      </div>
      <div className="flex-grow-1">
        <div className="text-muted small">{label}</div>
        <div className="fw-medium">{value || 'Desconocido'}</div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid app-shell py-4">
      <div className="mb-4">
        <h1 className="page-header-title display-6 mb-1">Consulta de placa</h1>
        <p className="text-muted mb-0 small">Busca información de un vehículo por su número de placa</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card card-soft border-0 shadow-sm p-4 mb-3">
            <form onSubmit={handleBuscar}>
              <div className="input-group input-group-lg mb-3">
                <span className="input-group-text bg-white border-end-0">
                  <FileSearch size={20} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 fw-medium"
                  placeholder="Ingresa número de placa (Ej. ABC123)"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                />
                <button className="btn btn-brand px-4" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      <Search size={18} className="me-1" />Buscar
                    </>
                  )}
                </button>
              </div>
            </form>

            {historial.length > 0 && (
              <div className="mt-2">
                <div className="d-flex align-items-center gap-1 text-muted small mb-2">
                  <Clock size={14} /> Búsquedas recientes
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {historial.map((h) => (
                    <button
                      key={h}
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => { setBusqueda(h); }}
                      style={{ fontSize: '0.8rem' }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="card card-soft border-0 shadow-sm p-4">
              <LoadingSpinner message="Buscando vehículo..." />
            </div>
          )}

          {error && (
            <div className="card card-soft border-0 shadow-sm p-4">
              <div className="alert alert-danger mb-0 d-flex align-items-center gap-2">
                <FileSearch size={18} />
                {error}
              </div>
            </div>
          )}

          {resultado && (
            <div className="card card-soft border-0 shadow-sm animate-in">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3"
                      style={{ width: 60, height: 60, background: 'var(--brand-green)', color: '#fff' }}
                    >
                      <CarFront size={30} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="fw-bold mb-1">{resultado.placa}</h3>
                      <StatusBadge estado={resultado.estado} />
                    </div>
                  </div>
                  {resultado.estado !== 'no_registrado' && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/vehiculos')}>
                      <Pencil size={14} className="me-1" />Editar
                    </button>
                  )}
                </div>

                <InfoRow icon={User} label="Propietario" value={resultado.dueno} />
                <InfoRow icon={Tag} label="Marca" value={resultado.marca} />
                <InfoRow icon={CarFront} label="Modelo" value={resultado.modelo} />
                <InfoRow icon={Palette} label="Color" value={resultado.color} />
                <InfoRow icon={Calendar} label="Año" value={resultado.anio ?? 'N/A'} />
              </div>
            </div>
          )}

          {!resultado && !error && !loading && (
            <div className="text-center py-5 text-muted animate-in">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: 80, height: 80, background: 'rgba(15,23,42,0.03)' }}
              >
                <FileSearch size={36} className="opacity-50" />
              </div>
              <h5 className="fw-bold">Consulta una placa</h5>
              <p className="small mb-0">Ingresa el número de placa para ver la información del vehículo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
