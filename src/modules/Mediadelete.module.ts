import { NativeModule, requireNativeModule } from "expo";

interface MediaDeleteModuleType extends NativeModule {
  /**
   * Deleta arquivos de mídia pelo URI do MediaStore.
   * Android 11+: abre o diálogo nativo de confirmação de deleção.
   * Android 9/10: deleção direta via ContentResolver.
   *
   * @param uris Lista de content:// URIs
   * @returns true se a deleção foi confirmada, rejeita se cancelada
   */
  deleteMediaFiles(uris: string[]): Promise<boolean>;

  /**
   * Converte IDs numéricos de assets (retornados pelo expo-media-library)
   * para content:// URIs do MediaStore necessários para o createDeleteRequest.
   *
   * @param assetIds IDs dos assets (ex: ["42", "137"])
   * @returns URIs completos (ex: ["content://media/external/audio/media/42"])
   */
  resolveAudioUris(assetIds: string[]): Promise<string[]>;
}

// Carrega o módulo nativo — lança em dev se o módulo não estiver registrado
export const MediaDeleteModule =
  requireNativeModule<MediaDeleteModuleType>("MediaDeleteModule");
