/**
 * Utilidad simple para concatenar clases CSS condicionalmente.
 * Similar a clsx pero ultra-ligero.
 */
export function cls(...args) {
  return args
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}
