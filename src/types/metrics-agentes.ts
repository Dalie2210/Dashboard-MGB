import type { ConversacionesMetric, CsatMetric, TiempoMetric } from "@/types/metrics";

export type VentasTotales = {
  ingresos: number;
  transacciones: number;
  ticketPromedio: number | null;
  compradores: number;
};

export type VentasMetric = VentasTotales & {
  serieDiaria: { fecha: string; valor: number }[];
  /** Totales del período inmediatamente anterior, de igual duración. */
  anterior: VentasTotales;
};

export type CargaItem = { clave: number; conteo: number };

export type CargaMetric = {
  porDia: CargaItem[];
  porHora: CargaItem[];
};

export type VolumenRecibidoMetric = {
  contactos: number;
  asignaciones: number;
  /** Solo Melissa: contactos escalados hacia ella, por agente IA de origen. */
  porOrigen?: { agenteId: string; contactos: number }[];
  /** Solo Melissa: contactos asignados sin escalamiento registrado en el período. */
  sinEscalamiento?: number;
};

/** Escalamientos de este agente hacia Melissa. `porcentaje` = escaladas / atendidas.total. */
export type EscalamientoMetric = {
  escaladas: number;
  porcentaje: number | null;
};

export type MotivoItem = { motivo: string; conteo: number };

export type MotivoDetalleItem = { fecha: string; motivo: string; detalle: string | null; contactId: string };

/** Caso recibido por Melissa sin conversación cerrada posterior a la recepción. */
export type CasoSinCerrarItem = {
  contactId: string;
  conversationId: string | null;
  recibidoAt: string;
  motivo: string | null;
};

/** Resoluciones IA agrupadas por el prefijo de tópico (T1..T5) del campo `resultado`. */
export type TopicoItem = { topico: string; conteo: number };

export type ResolucionDetalleItem = { fecha: string; resultado: string; contactId: string };

export type ObjecionCanal = "ghl" | "manychat";

export type ObjecionItem = { categoria: string; conteo: number };

export type ObjecionDetalleItem = {
  fecha: string;
  categoria: string;
  detalle: string | null;
  contactId: string;
  canal: ObjecionCanal;
};

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
  objeciones: ObjecionItem[] | null;
  tiempoResolucionAgente: TiempoMetric | null;
  csat: CsatMetric | null;
  resolucionesPorTopico: TopicoItem[] | null;
};

/** Listados de detalle por tarjeta del panel de agente (un único formato: fecha + una columna extra + link). */
export const DETALLE_TIPOS = [
  "atendidas",
  "tiempo-respuesta",
  "tiempo-resolucion",
  "escaladas",
  "asignaciones",
  "csat",
] as const;

export type DetalleTipo = (typeof DETALLE_TIPOS)[number];

export type DetalleEstado = "todas" | "abierta" | "cerrada";

export type DetalleItem = {
  fecha: string;
  contactId: string;
  conversationId: string | null;
  celda: string;
  /** Valor numérico crudo de `celda` (segundos, puntaje, conteo) para ordenar; null si es texto. */
  valor: number | null;
};

export type DetalleResponse = {
  columna: string;
  items: DetalleItem[];
  /** true si había más filas que el tope y se recortó la lista. */
  truncado: boolean;
};
