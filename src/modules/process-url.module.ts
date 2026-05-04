import { NativeModules, Platform } from "react-native";

const { AudioMetadata } = NativeModules;

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface AudioMetadataResult {
  /** Título da faixa (tag ID3 / MediaStore) */
  title?: string | null;
  /** Artista da faixa */
  artist?: string | null;
  /** Nome do álbum */
  album?: string | null;
  /** Artista do álbum (pode diferir do artista da faixa) */
  albumArtist?: string | null;
  /** Duração em milissegundos (string — converta com parseInt) */
  duration?: string | null;
  /** Ano de lançamento */
  year?: string | null;
  /** Número da faixa no álbum */
  trackNumber?: string | null;
  /** Gênero musical */
  genre?: string | null;
  /** Bitrate em bps (string) */
  bitrate?: string | null;
  /** MIME type do arquivo (ex: "audio/mpeg") */
  mimeType?: string | null;
  /**
   * URI da artwork.
   * - MediaStore: content://media/external/audio/albumart/<id>
   * - Embedded:   file:///data/user/0/<pkg>/cache/artwork_<hash>.jpg
   */
  artworkUri?: string | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Converte a string de duração do módulo nativo para número (ms) */
export function parseDuration(raw?: string | null): number {
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) ? 0 : n;
}

/** Converte bitrate (bps) para kbps legível */
export function formatBitrate(raw?: string | null): string {
  const n = parseInt(raw ?? "", 10);
  if (isNaN(n) || n === 0) return "—";
  return `${Math.round(n / 1000)} kbps`;
}

// ─────────────────────────────────────────────
// API principal
// ─────────────────────────────────────────────

/**
 * Obtém metadados ricos de um URI de áudio usando o módulo nativo Kotlin.
 * Funciona com content://, file:// e MediaStore URIs.
 *
 * Em caso de falha (módulo não disponível, URI inválida, etc.)
 * retorna um objeto vazio — nunca lança exceção para o chamador.
 *
 * @example
 * const meta = await getAudioMetadata("content://media/external/audio/media/42");
 * console.log(meta.title, meta.artworkUri);
 */
export async function getAudioMetadata(
  uri: string,
): Promise<AudioMetadataResult> {
  if (Platform.OS !== "android") return {};

  if (!AudioMetadata?.getMetadata) {
    console.warn("[AudioMetadata] Módulo nativo não disponível.");
    return {};
  }

  try {
    const result: AudioMetadataResult = await AudioMetadata.getMetadata(uri);
    return result ?? {};
  } catch (e) {
    console.warn("[AudioMetadata] getMetadata falhou:", e);
    return {};
  }
}

/**
 * Versão enriquecida que mescla metadados nativos com fallbacks
 * para campos não preenchidos (ex: título extraído do nome do arquivo).
 */
export async function getEnrichedMetadata(
  uri: string,
  fileNameFallback?: string,
): Promise<
  Required<Omit<AudioMetadataResult, "trackNumber" | "bitrate" | "mimeType">> &
    AudioMetadataResult
> {
  const meta = await getAudioMetadata(uri);

  const titleFromFileName = fileNameFallback
    ?.replace(/\.[^.]+$/, "") // remove extensão
    ?.replace(/[_-]/g, " ") // troca _ e - por espaço
    ?.trim();

  return {
    ...meta,
    title: meta.title || titleFromFileName || "Faixa desconhecida",
    artist: meta.artist || "Artista desconhecido",
    album: meta.album || "Álbum desconhecido",
    albumArtist: meta.albumArtist || meta.artist || "Artista desconhecido",
    duration: meta.duration || "0",
    year: meta.year || null,
    genre: meta.genre || null,
    artworkUri: meta.artworkUri || null,
  };
}
