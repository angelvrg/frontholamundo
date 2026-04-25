import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, Play, Square, Activity, FileImage, Video, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { iniciarCamara, detenerCamara, analizarImagen, analizarVideo, getEstado, crearWebSocket } from '../api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatConfidence } from '../utils/format';
import { cls } from '../utils/cls';

const ESTADO_LABELS = { autorizado: 'Autorizado', no_registrado: 'No registrado', sospechoso: 'Sospechoso' };

export default function Camara() {
  const [camEstado, setCamEstado] = useState('cargando...');
  const [fuente, setFuente] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [resultadosImagen, setResultadosImagen] = useState(null);
  const [resultadosVideo, setResultadosVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [detecciones, setDetecciones] = useState([]);
  const [log, setLog] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [dragOverImg, setDragOverImg] = useState(false);
  const [dragOverVid, setDragOverVid] = useState(false);
  const imgRef = useRef(null);
  const vidRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLog((prev) => [{ time: new Date().toLocaleTimeString('es-ES'), msg }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const verificar = async () => {
      try {
        const data = await getEstado();
        setCamEstado(data.camara || 'desconocido');
      } catch {
        setCamEstado('sin conexión');
      }
    };
    verificar();
    const intervalo = setInterval(verificar, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const ws = crearWebSocket();
    ws.onmessage = (event) => {
      try {
        const det = JSON.parse(event.data);
        if (det.tipo === 'deteccion') {
          setDetecciones((prev) => [det, ...prev].slice(0, 20));
          addLog(`Detectada ${det.placa} — ${ESTADO_LABELS[det.estado] || det.estado}`);
        }
      } catch (e) {
        console.error('WS error:', e);
      }
    };
    return () => ws.close();
  }, [addLog]);

  const handleIniciar = async () => {
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const data = await iniciarCamara(fuente || undefined);
      setMensaje(data.mensaje || 'Cámara iniciada');
      setCamEstado('activa');
      addLog('Cámara iniciada' + (fuente ? ` (${fuente})` : ''));
      toast.success('Cámara iniciada');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetener = async () => {
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const data = await detenerCamara();
      setMensaje(data.mensaje || 'Cámara detenida');
      setCamEstado('detenida');
      addLog('Cámara detenida');
      toast.success('Cámara detenida');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImagenUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResultadosImagen(null);
    try {
      const data = await analizarImagen(file);
      setResultadosImagen(data);
      addLog(`Imagen analizada — ${data.total_detectadas} placa(s)`);
      if (data.total_detectadas > 0) toast.success(`${data.total_detectadas} placa(s) detectada(s)`);
      else toast('No se detectaron placas', { icon: '🔍' });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResultadosVideo(null);
    try {
      const data = await analizarVideo(file);
      setResultadosVideo(data);
      addLog(`Video analizado — ${data.total_detectadas} placa(s) en ${data.total_frames} frames`);
      if (data.total_detectadas > 0) toast.success(`${data.total_detectadas} placa(s) detectada(s)`);
      else toast('No se detectaron placas', { icon: '🔍' });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e, type) => {
    e.preventDefault();
    if (type === 'img') {
      setDragOverImg(false);
      const f = e.dataTransfer.files?.[0];
      if (f) {
        setPreviewImage(URL.createObjectURL(f));
        handleImagenUpload(f);
      }
    } else {
      setDragOverVid(false);
      const f = e.dataTransfer.files?.[0];
      if (f) {
        setPreviewVideo(URL.createObjectURL(f));
        handleVideoUpload(f);
      }
    }
  };

  const camBadgeEstado = camEstado === 'activa' ? 'activo'
    : camEstado === 'detenida' ? 'no_registrado'
    : null;

  const ResultCard = ({ p }) => (
    <div className="card card-soft border-0 shadow-sm mb-3">
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary px-3 py-2">{p.placa}</span>
            <StatusBadge estado={p.estado} />
          </div>
          <span className="text-muted small fw-semibold">{formatConfidence(p.confianza)}</span>
        </div>
        <div className="row text-muted small">
          <div className="col-6 col-md-3"><span className="fw-semibold text-dark">Dueño:</span> {p.dueno || 'Desconocido'}</div>
          <div className="col-6 col-md-3"><span className="fw-semibold text-dark">Marca:</span> {p.marca || 'Desconocido'}</div>
          <div className="col-6 col-md-3"><span className="fw-semibold text-dark">Modelo:</span> {p.modelo || 'Desconocido'}</div>
          <div className="col-6 col-md-3"><span className="fw-semibold text-dark">Color:</span> {p.color || 'Desconocido'}</div>
        </div>
        {p.frame !== undefined && (
          <div className="mt-1 text-muted small"><span className="fw-semibold text-dark">Frame:</span> {p.frame}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container-fluid app-shell py-4">
      <div className="mb-4">
        <h1 className="page-header-title display-6 mb-1">Cámara y análisis</h1>
        <p className="text-muted mb-0 small">Controla la cámara en tiempo real o analiza imágenes y videos</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && (
        <div className="alert alert-success d-flex align-items-center gap-2">
          <CheckCircle size={18} />
          {mensaje}
        </div>
      )}

      <div className="row gy-4">
        <div className="col-lg-4">
          <div className="card card-soft border-0 shadow-sm p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 36, height: 36, background: 'rgba(15,23,42,0.04)' }}>
                <Camera size={20} className="text-muted" />
              </div>
              <h2 className="h5 mb-0 fw-bold">Control de cámara</h2>
            </div>
            <div className="mb-3 d-flex align-items-center gap-2">
              <span className="text-muted small">Estado:</span>
              {camBadgeEstado ? (
                <StatusBadge estado={camBadgeEstado} />
              ) : (
                <span className="badge bg-warning text-dark">{camEstado}</span>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Fuente de video</label>
              <input
                type="text"
                className="form-control"
                placeholder="0 (webcam) o URL"
                value={fuente}
                onChange={(e) => setFuente(e.target.value)}
              />
              <div className="form-text small">Dejar vacío para webcam por defecto.</div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-brand flex-fill d-flex align-items-center justify-content-center gap-2"
                onClick={handleIniciar}
                disabled={loading || camEstado === 'activa'}
              >
                <Play size={16} /> Iniciar
              </button>
              <button
                className="btn btn-outline-danger flex-fill d-flex align-items-center justify-content-center gap-2"
                onClick={handleDetener}
                disabled={loading || camEstado !== 'activa'}
              >
                <Square size={16} /> Detener
              </button>
            </div>

            {log.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-semibold small text-muted mb-2">Log de actividad</h6>
                <div className="small text-muted" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {log.map((l, i) => (
                    <div
                      key={i}
                      className={cls('d-flex gap-2 py-1 border-bottom', i % 2 === 0 && 'bg-white')}
                      style={{ borderColor: 'rgba(15,23,42,0.04)' }}
                    >
                      <span className="text-muted opacity-50" style={{ minWidth: 64 }}>{l.time}</span>
                      <span>{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-soft border-0 shadow-sm p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 36, height: 36, background: 'rgba(15,23,42,0.04)' }}>
                <Upload size={20} className="text-muted" />
              </div>
              <h2 className="h5 mb-0 fw-bold">Análisis de archivos</h2>
            </div>

            <div
              className={cls('drop-zone mb-3', dragOverImg && 'drag-over')}
              onDragOver={(e) => { e.preventDefault(); setDragOverImg(true); }}
              onDragLeave={() => setDragOverImg(false)}
              onDrop={(e) => onDrop(e, 'img')}
              onClick={() => imgRef.current?.click()}
            >
              <FileImage size={32} className="text-muted mb-2" />
              <div className="fw-medium small">Arrastra una imagen o haz clic</div>
              <div className="text-muted small">JPG, PNG, BMP</div>
              <input
                ref={imgRef}
                type="file"
                className="d-none"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setPreviewImage(URL.createObjectURL(f)); handleImagenUpload(f); }
                }}
              />
            </div>
            {previewImage && (
              <div className="mb-3 position-relative">
                <img src={previewImage} alt="preview" className="preview-img" />
                <button
                  className="btn btn-sm btn-dark position-absolute top-0 end-0 m-2 rounded-circle p-1"
                  style={{ width: 28, height: 28 }}
                  onClick={() => setPreviewImage(null)}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div
              className={cls('drop-zone', dragOverVid && 'drag-over')}
              onDragOver={(e) => { e.preventDefault(); setDragOverVid(true); }}
              onDragLeave={() => setDragOverVid(false)}
              onDrop={(e) => onDrop(e, 'vid')}
              onClick={() => vidRef.current?.click()}
            >
              <Video size={32} className="text-muted mb-2" />
              <div className="fw-medium small">Arrastra un video o haz clic</div>
              <div className="text-muted small">MP4, AVI, MOV</div>
              <input
                ref={vidRef}
                type="file"
                className="d-none"
                accept="video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setPreviewVideo(URL.createObjectURL(f)); handleVideoUpload(f); }
                }}
              />
            </div>
            {previewVideo && (
              <div className="mt-3 position-relative">
                <video src={previewVideo} controls className="preview-img" />
                <button
                  className="btn btn-sm btn-dark position-absolute top-0 end-0 m-2 rounded-circle p-1"
                  style={{ width: 28, height: 28 }}
                  onClick={() => setPreviewVideo(null)}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {uploading && (
              <div className="text-center py-3 animate-in">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted small">Procesando...</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-soft border-0 shadow-sm p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 36, height: 36, background: 'rgba(15,23,42,0.04)' }}>
                <Activity size={20} className="text-muted" />
              </div>
              <h2 className="h5 mb-0 fw-bold">Detecciones en vivo</h2>
            </div>
            {detecciones.length === 0 ? (
              <div className="text-center text-muted py-5 animate-in">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{ width: 64, height: 64, background: 'rgba(15,23,42,0.03)' }}
                >
                  <Activity size={28} className="opacity-50" />
                </div>
                <p className="small mb-0">No hay detecciones recientes</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                    <tr>
                      <th className="text-muted small fw-semibold">Placa</th>
                      <th className="text-muted small fw-semibold">Estado</th>
                      <th className="text-muted small fw-semibold text-end">Confianza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detecciones.map((d, i) => (
                      <tr key={i}>
                        <td><strong>{d.placa}</strong></td>
                        <td><StatusBadge estado={d.estado} size="sm" /></td>
                        <td className="text-end text-muted small">{formatConfidence(d.confianza)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {resultadosImagen && (
        <div className="mt-4 animate-in">
          <h3 className="h5 fw-bold mb-3">Resultado de imagen — {resultadosImagen.total_detectadas} placa(s)</h3>
          {resultadosImagen.placas?.length > 0 ? (
            resultadosImagen.placas.map((p, i) => <ResultCard key={i} p={p} />)
          ) : (
            <p className="text-muted">No se detectaron placas en la imagen.</p>
          )}
        </div>
      )}

      {resultadosVideo && (
        <div className="mt-4 animate-in">
          <h3 className="h5 fw-bold mb-3">
            Resultado de video — {resultadosVideo.total_detectadas} placa(s) en {resultadosVideo.total_frames} frames
          </h3>
          {resultadosVideo.placas?.length > 0 ? (
            resultadosVideo.placas.map((p, i) => <ResultCard key={i} p={p} />)
          ) : (
            <p className="text-muted">No se detectaron placas en el video.</p>
          )}
        </div>
      )}
    </div>
  );
}
