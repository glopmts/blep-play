// Utilitário compartilhado entre useMusics e usePlayer
// Resolve o artwork de uma faixa sem depender do base64 no estado

import { getCoverUri, getOrPersistCover } from "@/database/cache/coverArtCache";

export async function resolveArtwork(
  id: string,
  coverArt?: string | null,
): Promise<string | undefined> {
  // 1. Estado já tem file:// URI (preenchido pelo batch do useMusics)
  if (coverArt?.startsWith("file://")) return coverArt;

  // 2. Disco / memCache — funciona mesmo com coverArt null
  const cached = await getCoverUri(id);
  if (cached) return toFileUri(cached);

  // 3. Tem base64 → persiste agora (primeira vez que o player abre essa faixa)
  if (coverArt) {
    const uri = await getOrPersistCover(id, coverArt);
    return uri ? toFileUri(uri) : undefined;
  }

  return undefined;
}

function toFileUri(path: string) {
  return path.startsWith("file://") ? path : `file://${path}`;
}
