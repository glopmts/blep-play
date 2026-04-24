import * as MediaLibrary from "expo-media-library";
import { SongWithArt } from "../../types/interfaces";

export async function processAssetsInBatchesWithProgress(
  assets: MediaLibrary.Asset[],
  batchSize: number = 5,
  onBatchProcessed: (songs: SongWithArt[]) => void,
  callback: (asset: MediaLibrary.Asset) => Promise<SongWithArt>,
) {
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((asset) =>
        callback(asset).catch((err) => {
          console.error("Erro ao processar música:", err);
          return {
            ...asset,
            artist: "Desconhecido",
            album: "Desconhecido",
            title: asset.filename,
            genre: "Desconhecido",
            year: "Desconhecido",
            track: "0",
            duration: 0,
            coverArt: undefined,
          } as SongWithArt;
        }),
      ),
    );
    onBatchProcessed(batchResults);
  }
}
