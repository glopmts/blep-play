import { AlbumInterface } from "@/types/interfaces";
import { getAlbumsDb } from "../albumsCache";

const ALBUMS_LIST_TTL = 30 * 60 * 1000; // 30 min

export async function getCachedAlbumsList(): Promise<AlbumInterface[] | null> {
  try {
    const db = await getAlbumsDb();

    // Verifica se tem algum registro e se não expirou
    const meta = await db.getFirstAsync<{ cached_at: number }>(
      "SELECT cached_at FROM albums_list ORDER BY cached_at ASC LIMIT 1",
    );

    if (!meta) return null;
    if (Date.now() - meta.cached_at > ALBUMS_LIST_TTL) {
      await db.runAsync("DELETE FROM albums_list");
      return null;
    }

    const rows = await db.getAllAsync<{
      id: string;
      album: string;
      artist: string;
      numberOfSongs: number;
      year: number;
      artworkBase64: string | null;
    }>("SELECT * FROM albums_list ORDER BY album ASC");

    return rows.map((r) => ({
      id: r.id,
      album: r.album,
      artist: r.artist,
      numberOfSongs: r.numberOfSongs,
      year: r.year,
      artworkBase64: r.artworkBase64,
      artworkPath: null,
      artworkUri: null,
    }));
  } catch {
    return null;
  }
}

export async function setCachedAlbumsList(
  albums: AlbumInterface[],
): Promise<void> {
  try {
    const db = await getAlbumsDb();
    const now = Date.now();

    // Upsert em batch dentro de uma transação
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM albums_list");
      for (const a of albums) {
        await db.runAsync(
          `INSERT INTO albums_list
             (id, album, artist, numberOfSongs, year, artworkBase64, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            a.id,
            a.album,
            a.artist,
            a.numberOfSongs,
            a.year,
            a.artworkBase64,
            now,
          ],
        );
      }
    });
  } catch (e) {
    console.error("[albumsListCache] setCachedAlbumsList:", e);
  }
}

export async function invalidateAlbumsList(): Promise<void> {
  const db = await getAlbumsDb();
  await db.runAsync("DELETE FROM albums_list");
}
