export function formatDuracion(segundos: number | null): string {
  if (segundos == null || !Number.isFinite(segundos)) return "—";

  const total = Math.round(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatPorcentaje(valor: number | null, decimales = 0): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return `${valor.toFixed(decimales)}%`;
}

export function formatNumero(valor: number | null): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("es-CO").format(valor);
}

export function formatDecimal(valor: number | null, decimales = 1): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return valor.toFixed(decimales);
}
