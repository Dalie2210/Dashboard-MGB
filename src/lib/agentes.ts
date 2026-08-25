export const AGENTES: Record<string, string> = {
  WhesYuUKSj0oyKQ82Mb0: "Camila",
  pY4RVktMu533i316gpdS: "Sami",
  lcBVp05Z1iePe7NieiEG: "Melissa",
  "1m9rEcnlUamQvK5Lph0q": "Daniela",
  "8xgCUYnz5Y5ybO287QVe": "Diana",
  "6fMU2w4KqLxVr377s2By": "Nath",
  JIHjGkvK77nhiEwNhRvP: "Valentina",
};

export const AGENTE_POR_DEFECTO = "WhesYuUKSj0oyKQ82Mb0"; // vacío/NULL ⇒ Camila

export function nombreAgente(agenteId: string): string {
  return AGENTES[agenteId] ?? `Sin identificar (…${agenteId.slice(-4)})`;
}
