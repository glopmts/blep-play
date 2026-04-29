export function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds?: number | string): string {
  if (!seconds) return "--:--";

  // Converte para número se for string
  let totalSeconds =
    typeof seconds === "string" ? parseInt(seconds, 10) : seconds;

  // Se for NaN, retorna --:--
  if (isNaN(totalSeconds)) return "--:--";

  // Se for maior que 100000 (>27 horas), provavelmente é milissegundos
  // Converte milissegundos para segundos
  if (totalSeconds > 100000) {
    totalSeconds = Math.floor(totalSeconds / 1000);
  }

  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
