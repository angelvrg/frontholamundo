import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Activity, CarFront, FileSearch, ScanLine, ShieldCheck } from 'lucide-react';
import { getEstado, crearWebSocket } from './api';
import Home from './pages/Home';
import Vehiculos from './pages/Vehiculos';
import Consulta from './pages/Consulta';
import Camara from './pages/Camara';

const navItems = [
  { to: '/', end: true, label: 'Inicio', icon: Activity },
  { to: '/vehiculos', label: 'Vehículos', icon: CarFront },
  { to: '/consulta', label: 'Consulta', icon: FileSearch },
  { to: '/camara', label: 'Cámara', icon: ScanLine },
];

function Navbar() {
  const [backendOk, setBackendOk] = useState(true);
  const [wsStatus, setWsStatus] = useState('conectando...');

  useEffect(() => {
    const check = async () => {
      try {
        await getEstado();
        setBackendOk(true);
      } catch {
        setBackendOk(false);
      }
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const ws = crearWebSocket();
    ws.onopen = () => setWsStatus('conectado');
    ws.onclose = () => setWsStatus('desconectado');
    ws.onerror = () => setWsStatus('error');
    return () => ws.close();
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-tenax sticky-top py-2">
      <div className="container-fluid">
        <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2 fs-5">
          <ShieldCheck size={24} strokeWidth={2.2} />
          <span className="d-none d-sm-inline">TENAX LPR</span>
        </NavLink>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto gap-lg-1">
            {navItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 rounded-pill ${isActive ? 'active fw-semibold bg-white bg-opacity-10' : ''}`
                  }
                >
                  <item.icon size={16} strokeWidth={2.2} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge ${backendOk ? 'bg-success' : 'bg-danger'} bg-opacity-75 border-0`}
              style={{ fontSize: '0.68rem', letterSpacing: '0.04em', padding: '0.4em 0.7em' }}
            >
              API {backendOk ? 'OK' : 'OFF'}
            </span>
            <span
              className={`badge ${wsStatus === 'conectado' ? 'bg-success' : 'bg-warning'} bg-opacity-75 border-0`}
              style={{ fontSize: '0.68rem', letterSpacing: '0.04em', padding: '0.4em 0.7em' }}
            >
              WS {wsStatus === 'conectado' ? 'OK' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer-tenax">
      <div className="container-fluid">
        <span className="opacity-75">TENAX-LPR — Sistema de reconocimiento de placas vehiculares</span>
      </div>
    </footer>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="page-transition" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/vehiculos" element={<Vehiculos />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/camara" element={<Camara />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
