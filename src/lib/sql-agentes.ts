/**
 * Normaliza un ID de agente vacío/NULL/"undefined"/"null" (bug de la
 * integración GHL, ~39% de las filas en datos reales) al agente por
 * defecto. `param` es el placeholder ($n) que trae ese valor por defecto.
 */
export function sqlAgenteNormalizado(col: string, param: string): string {
  return `case
            when trim(coalesce(${col}, '')) = ''
              or lower(trim(${col})) in ('undefined', 'null')
              then ${param}
            else ${col}
          end`;
}
