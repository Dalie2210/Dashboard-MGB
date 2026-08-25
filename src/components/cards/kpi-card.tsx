export function KpiCard({ valor, subtitulo }: { valor: string; subtitulo?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-3xl font-semibold tabular-nums text-foreground">{valor}</p>
      {subtitulo ? <p className="text-xs text-muted-foreground">{subtitulo}</p> : null}
    </div>
  );
}
