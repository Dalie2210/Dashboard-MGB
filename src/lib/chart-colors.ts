// Paleta validada con la skill `dataviz` (node scripts/validate_palette.js).
// Ver plan: sistema de diseño Be Welly + reglas de color por trabajo (categórico/secuencial).

/** Único acento de marca para series de un solo valor (tendencias, sparklines). */
export const ACCENT_PRIMARY = "#EB6050"; // --coral
export const ACCENT_SECONDARY = "#9A82E3"; // --lavender-text

/**
 * Tema categórico documentado (8 familias, orden fijo — es el mecanismo de
 * seguridad CVD, nunca se reordena). Usado para "Chats por agente" porque
 * puede tener hasta 8 series nominales (7 agentes + "Otros").
 */
export const CATEGORICAL_THEME = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
];

export const CATEGORICAL_MAX_SLOTS = CATEGORICAL_THEME.length;
export const CATEGORICAL_OTROS_COLOR = "#898781"; // muted ink — "Otros" no es identidad propia

/**
 * Rampa secuencial (un solo hue, luz→oscuro) usada como ordinal para la
 * distribución CSAT 1–5: el orden de los puntajes importa, así que el color
 * debe leerse como progresión, no como identidad categórica.
 */
export const CSAT_ORDINAL_STEPS = [
  "#86b6ef", // step 250 — mínimo permitido en extremo claro (2:1) para ordinal
  "#5598e7", // step 350
  "#2a78d6", // step 450
  "#1c5cab", // step 550
  "#104281", // step 650
];
