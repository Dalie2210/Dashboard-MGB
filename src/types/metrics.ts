export type SerieDiaria = { fecha: string; valor: number }[];

export type ConversacionesMetric = {
  total: number;
  abiertas: number;
  cerradas: number;
  abiertasMasDe3Dias?: number;
  serieDiaria: SerieDiaria;
};

export type ChatsPorAgenteItem = {
  agenteId: string;
  nombre: string;
  chats: number;
  porcentaje: number;
};

export type ChatsPorAgenteMetric = {
  items: ChatsPorAgenteItem[];
  totalChats: number;
};

export type ResueltoIaDesglose = { clave: string; conteo: number }[];

export type ResueltoIaMetric = {
  totalConversaciones: number;
  conversacionesIa: number;
  porcentaje: number | null;
  /** % del periodo inmediatamente anterior (misma duración). */
  porcentajeAnterior: number | null;
  porcentajeCamila: number | null;
  porcentajeSami: number | null;
  porResultado: ResueltoIaDesglose;
  porAgenteIa: ResueltoIaDesglose;
};

export type TiempoMetric = {
  promedioSegundos: number | null;
  medianaSegundos: number | null;
  muestras: number;
  serieDiaria: SerieDiaria;
};

export type CsatDistribucionItem = { score: number; conteo: number };

export type CsatMetric = {
  promedio: number | null;
  respuestas: number;
  satisfechos: number;
  csatPorcentaje: number | null;
  distribucion: CsatDistribucionItem[];
  pendientesEnRango: number;
  tasaRespuesta: number | null;
  /** Solo en el dashboard general: CSAT atribuido a cada agente con panel. */
  porAgente?: CsatAgenteItem[];
};

export type CsatAgenteItem = {
  agenteId: string;
  promedio: number | null;
  respuestas: number;
  tasaRespuesta: number | null;
};

export type CsatDetalleItem = {
  fecha: string;
  contactId: string;
  score: number;
  agente: string | null;
  motivo: string | null;
};

export type CierresInactividadMetric = {
  inactividad: number;
  resueltos: number;
  /** % de los cierres del período que fueron automáticos por inactividad. */
  porcentaje: number | null;
  serieDiaria: SerieDiaria;
};

export type CierreInactividadItem = {
  fecha: string;
  contactId: string;
  conversationId: string | null;
  duracionSegundos: number | null;
};

export type PrimeraRespuestaMetric = { ia: TiempoMetric; humana: TiempoMetric };

export type MetricsResponse = {
  rango: { from: string; to: string };
  conversaciones: ConversacionesMetric;
  chatsPorAgente: ChatsPorAgenteMetric;
  resueltoIa: ResueltoIaMetric;
  primeraRespuesta: PrimeraRespuestaMetric;
  tiempoResolucion: TiempoMetric;
  cierresInactividad: CierresInactividadMetric;
  csat: CsatMetric;
};
