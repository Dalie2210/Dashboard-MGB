export type SerieDiaria = { fecha: string; valor: number }[];

export type ConversacionesMetric = {
  total: number;
  abiertas: number;
  cerradas: number;
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
};

export type CsatDetalleItem = { fecha: string; contactId: string; score: number };

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

export type MetricsResponse = {
  rango: { from: string; to: string };
  conversaciones: ConversacionesMetric;
  chatsPorAgente: ChatsPorAgenteMetric;
  resueltoIa: ResueltoIaMetric;
  primeraRespuesta: TiempoMetric;
  tiempoResolucion: TiempoMetric;
  cierresInactividad: CierresInactividadMetric;
  csat: CsatMetric;
};
