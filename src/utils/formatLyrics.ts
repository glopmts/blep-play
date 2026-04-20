export function formatLyrics(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;

  let lyrics = raw;

  // Remove timestamps LRC: [00:12.34] ou [00:12]
  lyrics = lyrics.replace(/\[\d{1,2}:\d{2}(?:\.\d+)?\]/g, "");

  // Remove metadados LRC no topo: [ti:titulo] [ar:artista] etc
  lyrics = lyrics.replace(
    /\[(?:ti|ar|al|by|offset|length|re|ve):[^\]]*\]/gi,
    "",
  );

  // Remove caracteres de controle exceto \n e \r
  lyrics = lyrics.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normaliza quebras de linha (Windows \r\n → \n)
  lyrics = lyrics.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove linhas em branco duplicadas (mais de 2 seguidas → 1)
  lyrics = lyrics.replace(/\n{3,}/g, "\n\n");

  // Remove espaços no início/fim de cada linha
  lyrics = lyrics
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Remove linhas vazias no início e fim
  lyrics = lyrics.trim();

  return lyrics.length > 0 ? lyrics : undefined;
}
