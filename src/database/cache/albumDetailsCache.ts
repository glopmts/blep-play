import { AlbumInterface } from "@/types/interfaces";
import { getAlbumDetailsDb } from "../albums-details.cache";

const ALBUM_TTL = 60 * 60 * 1000; // 1 hora — faixas não mudam tanto

export async function getCachedAlbum(
  albumId: string,
): Promise<AlbumInterface | null> {
  try {
    const db = await getAlbumDetailsDb();
    const row = await db.getFirstAsync<{ data: string; cached_at: number }>(
      "SELECT data, cached_at FROM album_details WHERE album_id = ?",
      [albumId],
    );

    if (!row) return null;

    // Expirado?
    if (Date.now() - row.cached_at > ALBUM_TTL) {
      await db.runAsync("DELETE FROM album_details WHERE album_id = ?", [
        albumId,
      ]);
      return null;
    }

    return JSON.parse(row.data) as AlbumInterface;
  } catch {
    return null;
  }
}

export async function setCachedAlbum(album: AlbumInterface): Promise<void> {
  try {
    const db = await getAlbumDetailsDb();

    // Salva sem artworkBase64 das songs (economiza espaço — a do álbum fica)
    const toStore: AlbumInterface = {
      ...album,
      songs: album.songs?.map((s) => ({ ...s, coverArt: null })),
    };

    await db.runAsync(
      `INSERT OR REPLACE INTO album_details (album_id, data, cached_at)
       VALUES (?, ?, ?)`,
      [album.id, JSON.stringify(toStore), Date.now()],
    );
  } catch (e) {
    console.error("[albumDetailsCache] setCachedAlbum:", e);
  }
}

export async function invalidateCachedAlbum(albumId: string): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync("DELETE FROM album_details WHERE album_id = ?", [albumId]);
}

export async function clearAllAlbumDetails(): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync("DELETE FROM album_details");
}
