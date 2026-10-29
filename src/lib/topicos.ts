/** Codificación de tópicos (T1–T5) compartida por resoluciones y motivos de escalamiento. */
export const NOMBRES_TOPICO: Record<string, string> = {
  T1: "Sin acceso al programa",
  T2: "Pago o suscripción",
  T3: "Cancelación o reembolso",
  T4: "Consulta general del programa",
  T5: "Caso no clasificado",
};

export function etiquetaTopico(topico: string): string {
  const nombre = NOMBRES_TOPICO[topico];
  return nombre ? `${topico} — ${nombre}` : topico;
}
