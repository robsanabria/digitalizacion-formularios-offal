// Utilidades de fecha para evitar el corrimiento de -1 día por zona horaria.
// new Date().toISOString() devuelve la fecha en UTC; en Argentina (UTC-3) eso
// puede caer en el día anterior. Estas funciones usan la fecha LOCAL del navegador.

// Fecha de HOY (del sistema/navegador) como 'YYYY-MM-DD' en hora local.
export function hoyLocal() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
