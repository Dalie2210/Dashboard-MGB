export const CAMILA_ID = "WhesYuUKSj0oyKQ82Mb0";
export const SAMI_ID = "pY4RVktMu533i316gpdS";
export const MELISSA_ID = "lcBVp05Z1iePe7NieiEG";

export const AGENTES: Record<string, string> = {
  [CAMILA_ID]: "Camila",
  [SAMI_ID]: "Sami",
  [MELISSA_ID]: "Melissa",
  "1m9rEcnlUamQvK5Lph0q": "Daniela",
  "8xgCUYnz5Y5ybO287QVe": "Diana",
  "6fMU2w4KqLxVr377s2By": "Nath",
  JIHjGkvK77nhiEwNhRvP: "Valentina",
};

export const AGENTE_POR_DEFECTO = CAMILA_ID; // vacío/NULL ⇒ Camila

export const AGENTES_CON_PANEL = [CAMILA_ID, SAMI_ID, MELISSA_ID] as const;

export function nombreAgente(agenteId: string): string {
  return AGENTES[agenteId] ?? `Sin identificar (…${agenteId.slice(-4)})`;
}
