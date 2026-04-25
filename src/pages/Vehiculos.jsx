import { useEffect, useMemo, useState } from 'react';
import { CarFront, LayoutGrid, List, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getVehiculos, crearVehiculo, editarVehiculo, eliminarVehiculo } from '../api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { cls } from '../utils/cls';

const ESTADOS = ['autorizado', 'no_registrado', 'sospechoso'];
const ESTADO_LABELS = { autorizado: 'Autorizado', no_registrado: 'No registrado', sospechoso: 'Sospechoso' };
const VACIO = { placa: '', dueno: '', marca: '', modelo: '', color: '', anio: '', estado: 'autorizado' };

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [editPlaca, setEditPlaca] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [vista, setVista] = useState('tabla');

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehiculos(1000, 0);
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const abrirCrear = () => {
    setForm(VACIO);
    setEditPlaca(null);
    setModal('crear');
  };

  const abrirEditar = (v) => {
    setForm({
      placa: v.placa || '',
      dueno: v.dueno || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      color: v.color || '',
      anio: v.anio ?? '',
      estado: v.estado || 'autorizado',
    });
    setEditPlaca(v.placa);
    setModal('editar');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, anio: form.anio === '' ? null : Number(form.anio) };
      if (modal === 'crear') {
        await crearVehiculo(payload);
        toast.success('Vehículo registrado correctamente');
      } else {
        const { placa, ...datosEdit } = payload;
        Object.keys(datosEdit).forEach((k) => {
          if (datosEdit[k] === '' || datosEdit[k] === null) delete datosEdit[k];
        });
        await editarVehiculo(editPlaca, datosEdit);
        toast.success('Vehículo actualizado correctamente');
      }
      setModal(null);
      cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (numero) => {
    try {
      await eliminarVehiculo(numero);
      setConfirmDelete(null);
      toast.success('Vehículo eliminado');
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const visible = useMemo(() => {
    let list = vehiculos;
    if (filterEstado !== 'todos') {
      list = list.filter((v) => v.estado === filterEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        (v.placa || '').toLowerCase().includes(q) ||
        (v.dueno || '').toLowerCase().includes(q) ||
        (v.marca || '').toLowerCase().includes(q) ||
        (v.modelo || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehiculos, search, filterEstado]);

  const countByEstado = (e) => vehiculos.filter((v) => v.estado === e).length;

  const filterBtn = (key, label, count) => (
    <button
      key={key}
      className={cls('btn btn-sm', filterEstado === key ? 'btn-brand' : 'btn-outline-secondary')}
      onClick={() => setFilterEstado(key)}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );

  return (
    <div className="container-fluid app-shell py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="page-header-title display-6 mb-1">Vehículos</h1>
          <p className="text-muted mb-0 small">Registro y administración de vehículos</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button className={cls('btn btn-sm', vista === 'tabla' ? 'btn-brand' : 'btn-outline-secondary')} onClick={() => setVista('tabla')}>
              <List size={16} />
            </button>
            <button className={cls('btn btn-sm', vista === 'grid' ? 'btn-brand' : 'btn-outline-secondary')} onClick={() => setVista('grid')}>
              <LayoutGrid size={16} />
            </button>
          </div>
          <button className="btn btn-brand d-flex align-items-center gap-2" onClick={abrirCrear}>
            <Plus size={16} /> Nuevo vehículo
          </button>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input
              type="search"
              className="form-control border-start-0"
              placeholder="Buscar por placa, dueño, marca o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="d-flex gap-2 flex-wrap">
            {filterBtn('todos', 'Todos', vehiculos.length)}
            {ESTADOS.map((e) => filterBtn(e, ESTADO_LABELS[e], countByEstado(e)))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Cargando vehículos..." />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : vehiculos.length === 0 ? (
        <EmptyState
          title="Sin vehículos registrados"
          message="No hay vehículos en la base de datos todavía."
          action={
            <button className="btn btn-brand" onClick={abrirCrear}>
              <Plus size={16} className="me-1" />
              Registrar primer vehículo
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Sin resultados" message="No coincide tu búsqueda con ningún vehículo." />
      ) : vista === 'tabla' ? (
        <div className="card card-soft border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="text-muted small fw-semibold">Placa</th>
                  <th className="text-muted small fw-semibold">Dueño</th>
                  <th className="text-muted small fw-semibold">Marca</th>
                  <th className="text-muted small fw-semibold">Modelo</th>
                  <th className="text-muted small fw-semibold">Color</th>
                  <th className="text-muted small fw-semibold">Año</th>
                  <th className="text-muted small fw-semibold">Estado</th>
                  <th className="text-muted small fw-semibold text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.id || v.placa}>
                    <td><strong className="text-dark">{v.placa}</strong></td>
                    <td>{v.dueno || '—'}</td>
                    <td>{v.marca || '—'}</td>
                    <td>{v.modelo || '—'}</td>
                    <td>{v.color || '—'}</td>
                    <td>{v.anio ?? '—'}</td>
                    <td><StatusBadge estado={v.estado} /></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => abrirEditar(v)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmDelete(v.placa)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {visible.map((v) => (
            <div className="col-md-6 col-lg-4 col-xl-3" key={v.id || v.placa}>
              <div className="card card-soft h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title fw-bold mb-0">{v.placa}</h5>
                    <StatusBadge estado={v.estado} />
                  </div>
                  <div className="text-muted small">
                    <div><span className="fw-semibold text-dark">Dueño:</span> {v.dueno || '—'}</div>
                    <div><span className="fw-semibold text-dark">Marca:</span> {v.marca || '—'}</div>
                    <div><span className="fw-semibold text-dark">Modelo:</span> {v.modelo || '—'}</div>
                    <div><span className="fw-semibold text-dark">Color:</span> {v.color || '—'}</div>
                    <div><span className="fw-semibold text-dark">Año:</span> {v.anio ?? '—'}</div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-0 d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => abrirEditar(v)}>
                    <Pencil size={14} className="me-1" />Editar
                  </button>
                  <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => setConfirmDelete(v.placa)}>
                    <Trash2 size={14} className="me-1" />Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <>
          <div className="modal-backdrop-custom" onClick={() => setModal(null)} />
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-custom">
              <div className="modal-content card-soft border-0 animate-in glass">
                <div className="modal-header border-0 pb-2">
                  <h5 className="modal-title fw-bold">{modal === 'crear' ? 'Registrar vehículo' : 'Editar vehículo'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)} aria-label="Cerrar" />
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body">
                    {modal === 'crear' && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Placa *</label>
                        <input type="text" className="form-control" name="placa" value={form.placa} onChange={handleChange} required placeholder="Ej. ABC123" />
                      </div>
                    )}
                    {modal === 'editar' && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Placa</label>
                        <input type="text" className="form-control" value={editPlaca} disabled />
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Dueño</label>
                      <input type="text" className="form-control" name="dueno" value={form.dueno} onChange={handleChange} placeholder="Nombre del propietario" />
                    </div>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold small">Marca</label>
                        <input type="text" className="form-control" name="marca" value={form.marca} onChange={handleChange} placeholder="Toyota" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold small">Modelo</label>
                        <input type="text" className="form-control" name="modelo" value={form.modelo} onChange={handleChange} placeholder="Corolla" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold small">Año</label>
                        <input type="number" className="form-control" name="anio" value={form.anio} onChange={handleChange} placeholder="2024" />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold small">Color</label>
                        <input type="text" className="form-control" name="color" value={form.color} onChange={handleChange} placeholder="Blanco" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold small">Estado</label>
                        <select className="form-select" name="estado" value={form.estado} onChange={handleChange}>
                          {ESTADOS.map((e) => (
                            <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-brand" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={<>¿Estás seguro de eliminar el vehículo con placa <strong>{confirmDelete}</strong>?</>}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
          confirmText="Eliminar"
          confirmVariant="danger"
        />
      )}
    </div>
  );
}
