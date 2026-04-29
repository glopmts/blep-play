import { dbRemoveCacheCover } from "@/database/cache/coverArtCache";
import { MediaDeleteModule } from "@/modules/Mediadelete.module";
import { AlbumInterface } from "@/types/interfaces";
import * as MediaLibrary from "expo-media-library";
import { Alert, Platform } from "react-native";
import { invalidateAlbumsList } from "../database/cache/albuns-local-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeleteAlbumResult =
  | { success: true; deletedCount: number }
  | {
      success: false;
      reason: "cancelled" | "permission_denied" | "error";
      error?: string;
    };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Expo SDK 55+ unifica as permissões de leitura e escrita.
 * `requestPermissionsAsync(true)` solicita acesso de gravação (writeOnly = true).
 * A permissão retornada pode ser "granted", "denied" ou "limited" (iOS 14+).
 */
async function ensureWritePermission(): Promise<boolean> {
  const { status, accessPrivileges } =
    await MediaLibrary.requestPermissionsAsync(true);

  // "granted" garante acesso total; "limited" (iOS) indica seleção parcial —
  // ainda assim tentamos prosseguir e deixamos o sistema barrar se necessário.
  return status === "granted" || accessPrivileges === "limited";
}

/**
 * Busca todos os assets de áudio de um álbum via paginação.
 * Continua até não haver próxima página para garantir que álbuns grandes
 * (> 500 faixas) sejam completamente cobertos.
 */
async function fetchAssetsByAlbum(
  albumId: string,
): Promise<MediaLibrary.Asset[]> {
  const assets: MediaLibrary.Asset[] = [];
  let cursor: MediaLibrary.AssetRef | undefined;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      album: albumId,
      mediaType: MediaLibrary.MediaType.audio,
      first: 500,
      after: cursor,
    });
    assets.push(...page.assets);
    cursor = page.hasNextPage ? page.endCursor : undefined;
  } while (cursor);

  return assets;
}

/**
 * Remove o álbum do cache SQLite via `invalidateAlbumsList`.
 * Não lança — falhas de cache não devem bloquear o fluxo principal.
 */
async function removeAlbumFromCache(albumId: string): Promise<void> {
  try {
    // O cache de lista no SQLite não tem granularidade por ID,
    // então invalida tudo; na próxima abertura ele é reconstruído.
    await invalidateAlbumsList();
  } catch (error) {
    console.error("[deleteAlbum] removeAlbumFromCache:", error);
  }
}

// ---------------------------------------------------------------------------
// Core delete logic
// ---------------------------------------------------------------------------

/**
 * Deleta fisicamente do dispositivo todos os arquivos de áudio do álbum
 * e limpa os caches relacionados.
 *
 * Fluxo:
 *  1. Solicita permissão de escrita (Expo SDK 55+).
 *  2. Resolve a lista de assets (de `album.songs` ou do MediaStore).
 *  3. No Android 11+ usa o módulo nativo `MediaDeleteModule` para
 *     chamar `MediaStore.createDeleteRequest` diretamente, contornando
 *     o bug do `expo-media-library` com `createWriteRequest`.
 *  4. No iOS usa `MediaLibrary.deleteAssetsAsync`.
 *  5. Tenta remover o álbum vazio do MediaStore (falha silenciosa).
 *  6. Invalida caches de álbuns e capas.
 */
export async function deleteAlbumFromDevice(
  album: AlbumInterface,
): Promise<DeleteAlbumResult> {
  try {
    // 1. Permissão
    const hasPermission = await ensureWritePermission();
    if (!hasPermission) {
      return { success: false, reason: "permission_denied" };
    }

    // 2. Assets — `album.songs` é TrackDetails[], que estende Asset implicitamente
    //    via `filePath` / `uri`. Convertemos para o shape que o MediaLibrary espera.
    const resolvedAssets: MediaLibrary.Asset[] =
      Array.isArray(album.songs) && album.songs.length > 0
        ? album.songs.map((s) => ({
            id: s.id,
            filename: s.title,
            uri: s.uri,
            mediaType: MediaLibrary.MediaType.audio,
            width: 0,
            height: 0,
            creationTime: 0,
            modificationTime: 0,
            duration: s.duration / 1000, // TrackDetails usa ms; Asset usa s
            albumId: s.albumId,
            albumTitle: album.album,
            isFavorite: false,
          }))
        : await fetchAssetsByAlbum(album.id);

    if (resolvedAssets.length === 0) {
      await removeAlbumFromCache(album.id);
      return { success: true, deletedCount: 0 };
    }

    const assetIds = resolvedAssets.map((a) => a.id);
    let deleted = false;

    // 3 & 4. Delete por plataforma
    if (Platform.OS === "android") {
      // expo-media-library.deleteAssetsAsync tem bug no Android 11+:
      // usa createWriteRequest em vez de createDeleteRequest.
      // O módulo nativo resolve isso chamando MediaStore.createDeleteRequest.
      const uris = await MediaDeleteModule.resolveAudioUris(assetIds);

      if (uris.length === 0) {
        return {
          success: false,
          reason: "error",
          error: "Não foi possível resolver URIs dos assets.",
        };
      }

      deleted = await MediaDeleteModule.deleteMediaFiles(uris);
    } else {
      // iOS: deleteAssetsAsync funciona corretamente
      deleted = await MediaLibrary.deleteAssetsAsync(assetIds);
    }

    if (!deleted) {
      // O usuário cancelou o diálogo de permissão do sistema (Android 11+ / iOS)
      return { success: false, reason: "cancelled" };
    }

    // 5. Tenta remover o registro de álbum vazio do MediaStore
    try {
      await MediaLibrary.deleteAlbumsAsync(
        [{ id: album.id } as MediaLibrary.Album],
        true,
      );
    } catch {
      // Falha silenciosa — o álbum some do MediaStore no próximo scan automático
    }

    // 6. Invalida caches em paralelo
    await Promise.allSettled([
      removeAlbumFromCache(album.id),
      ...(album.songs?.map((song) => dbRemoveCacheCover(song.id)) ?? []),
    ]);

    return { success: true, deletedCount: resolvedAssets.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Usuário cancelou o diálogo nativo (Android/iOS)
    if (
      message.includes("CANCELLED") ||
      message.includes("cancelou") ||
      message.includes("User cancelled")
    ) {
      return { success: false, reason: "cancelled" };
    }

    console.error("[deleteAlbum] Erro inesperado:", message);
    return { success: false, reason: "error", error: message };
  }
}

// ---------------------------------------------------------------------------
// UI helper — Alert + callbacks
// ---------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  permission_denied:
    "Permissão negada. Vá em Configurações e conceda acesso à biblioteca de mídia.",
  error: "Erro desconhecido ao deletar.",
};

/**
 * Exibe um Alert de confirmação e, se confirmado, deleta o álbum.
 * Callbacks permitem que a tela pai atualize seu estado sem acoplar à lógica
 * de delete.
 *
 * @param album    Álbum a deletar
 * @param onSuccess Chamado com o número de faixas deletadas
 * @param onError   Chamado com a mensagem de erro (opcional)
 */
export function confirmAndDeleteAlbum(
  album: AlbumInterface,
  onSuccess: (deletedCount: number) => void,
  onError?: (reason: string) => void,
): void {
  Alert.alert(
    "Deletar álbum",
    `Tem certeza que deseja deletar "${album.album}" e todas as ${album.songs} músicas?\n\nEsta ação não pode ser desfeita.`,
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          const result = await deleteAlbumFromDevice(album);

          if (result.success) {
            onSuccess(result.deletedCount);
            return;
          }

          // Cancelamento silencioso — não mostra erro
          if (result.reason === "cancelled") return;

          const message =
            result.reason === "error" && result.error
              ? result.error
              : (ERROR_MESSAGES[result.reason] ?? ERROR_MESSAGES.error);

          onError?.(message);
          Alert.alert("Erro ao deletar", message, [{ text: "OK" }]);
        },
      },
    ],
  );
}
