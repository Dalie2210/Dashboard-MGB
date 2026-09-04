import type { ConversacionesMetric, TiempoMetric } from "@/types/metrics";

export type VentasMetric = {
  ingresos: number;
  transacciones: number;
  ticketPromedio: number | null;
  compradores: number;
  serieDiaria: { fecha: string; valor: number }[];
};

export type CargaItem = { clave: number; conteo: number };

export type CargaMetric = {
  porDia: CargaItem[];
  porHora: CargaItem[];
};

export type VolumenRecibidoMetric = {
  contactos: number;
  asignaciones: number;
};

/** Escalamientos de este agente hacia Melissa. `porcentaje` = escaladas / atendidas.total. */
export type EscalamientoMetric = {
  escaladas: number;
  porcentaje: number | null;
};

export type MotivoItem = { motivo: string; conteo: number };

export type MotivoDetalleItem = { fecha: string; motivo: string; contactId: string };

/** Tiempo de primera respuesta (Camila/Sami). `sinSesion` = filas del rango sin `sesion_id`, excluidas del join. */
export type TiempoRespuestaMetric = TiempoMetric & { sinSesion: number };

/** Tiempo tras recibir el caso (Melissa). `sinCerrar` = contactos recibidos que aún no tienen cierre posterior. */
export type TiempoTrasRecibirMetric = TiempoMetric & { sinCerrar: number };

export type AgenteMetricsResponse = {
  rango: { from: string; to: string };
  agenteId: string;
  atendidas: ConversacionesMetric;
  tiempoRespuesta: TiempoRespuestaMetric;
  ventas: VentasMetric | null;
  porcentajeCierre: number | null;
  tiempoResolucion: TiempoTrasRecibirMetric | null;
  cargaDiaHora: CargaMetric | null;
  volumenRecibido: VolumenRecibidoMetric | null;
  escaladoAMelissa: EscalamientoMetric | null;
  resueltoSinEscalar: EscalamientoMetric | null;
  motivosEscalamiento: MotivoItem[] | null;
};
