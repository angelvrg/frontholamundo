/**
 * TENAX-LPR — Módulo centralizado de comunicación con el backend FastAPI.
 * Todas las rutas usan el proxy de Vite (/api → http://localhost:8000).
 */

const BASE = '/api';

/* ───── Helpers ───── */

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/* ───── Estado del sistema ───── */

export async function getEstado() {
  return request('/');
}

/* ───── Historial ───── */

export async function getHistorial(limit = 50) {
  return request(`/historial?limit=${limit}`);
}

/* ───── Consulta de placa ───── */

export async function getPlaca(numero) {
  return request(`/placa/${numero}`);
}

/* ───── Vehículos CRUD ───── */

export async function getVehiculos(limit = 100, offset = 0) {
  return request(`/vehiculos?limit=${limit}&offset=${offset}`);
}

export async function crearVehiculo(datos) {
  return request('/vehiculos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function editarVehiculo(numero, datos) {
  return request(`/vehiculos/${numero}`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
}

export async function eliminarVehiculo(numero) {
  return request(`/vehiculos/${numero}`, {
    method: 'DELETE',
  });
}

/* ───── Cámara ───── */

export async function iniciarCamara(fuente) {
  const body = fuente !== undefined && fuente !== '' ? { fuente } : {};
  return request('/camara/iniciar', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function detenerCamara() {
  return request('/camara/detener', {
    method: 'POST',
  });
}

/* ───── Análisis de imagen ───── */

export async function analizarImagen(file) {
  const formData = new FormData();
  formData.append('imagen', file);
  const res = await fetch(`${BASE}/analizar-imagen`, {
    method: 'POST',
    body: formData,
    // No establecemos Content-Type: el navegador asigna multipart/form-data con boundary
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

/* ───── Análisis de video ───── */

export async function analizarVideo(file) {
  const formData = new FormData();
  formData.append('video', file);
  const res = await fetch(`${BASE}/analizar-video`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

/* ───── WebSocket ───── */

export function crearWebSocket() {
  // Usamos el endpoint /ws del proxy de Vite
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/ws`);
}