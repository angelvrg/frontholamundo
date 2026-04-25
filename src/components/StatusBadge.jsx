import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';

const CONFIG = {
  autorizado:    { label: 'Autorizado',    className: 'bg-success text-white',           icon: ShieldCheck },
  sospechoso:    { label: 'Sospechoso',    className: 'bg-danger text-white',            icon: ShieldAlert },
  no_registrado: { label: 'No registrado', className: 'bg-secondary text-white',         icon: ShieldX },
};

export default function StatusBadge({ estado, showIcon = true, size = 'md' }) {
  const key = (estado || '').toLowerCase().replace(/\s+/g, '_');
  const cfg = CONFIG[key] || { label: estado || 'Desconocido', className: 'bg-secondary-subtle text-secondary', icon: HelpCircle };
  const Icon = cfg.icon;

  const sizeMap = {
    sm: { fontSize: '0.72rem', padding: '0.3em 0.6em', icon: 11 },
    md: { fontSize: '0.78rem', padding: '0.45em 0.8em', icon: 13 },
    lg: { fontSize: '0.85rem', padding: '0.5em 0.9em', icon: 14 },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`badge d-inline-flex align-items-center gap-1 ${cfg.className}`}
      style={{ fontSize: s.fontSize, letterSpacing: '0.025em', padding: s.padding, borderRadius: 999 }}
    >
      {showIcon && <Icon size={s.icon} />}
      {cfg.label}
    </span>
  );
}
