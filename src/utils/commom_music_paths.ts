// ── Pastas padrão onde o Android costuma guardar músicas ──────────────────────

export const COMMON_MUSIC_PATHS = [
  "/storage/emulated/0/Music",
  "/storage/emulated/0/music",
  "/storage/emulated/0/Download",
  "/storage/emulated/0/Downloads",
  "/sdcard/Music",
  "/sdcard/music",
  // Samsung / Xiaomi costumam usar estes:
  "/storage/emulated/0/MIUI/music",
  "/storage/emulated/0/Sound recordings",
] as const;
