import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { showPlatformMessage } from "../components/toast-message-plataform";

const CACHE_DIRS = {
  IMAGES: `${FileSystem.cacheDirectory}ImageManager/`,
  EXPO_CACHE: `${FileSystem.cacheDirectory}ExponentExperienceData/`,
  ASSETS: `${FileSystem.cacheDirectory}Assets/`,
  ALBUMS: `${FileSystem.documentDirectory}albums/`,
  TEMP: FileSystem.cacheDirectory,
} as const;

export interface CacheStats {
  imageCacheSize: number;
  mmkvKeys: string[];
  totalSize: number;
  lastCleared: Date | null;
}

class CacheManager {
  private static instance: CacheManager;
  private lastCleared: Date | null = null;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Limpar todo o cache do app
  async clearAllCache(): Promise<void> {
    try {
      await this.clearImageCache();

      await this.clearTempFiles();

      // 3. Limpar AsyncStorage (recentes, favoritos, etc)
      await this.clearAsyncStorage();

      // 5. Limpar cache de álbuns customizado
      await this.clearAlbumsData();

      // 6. Limpar cache do React Navigation (se usado)
      await this.clearNavigationCache();

      this.lastCleared = new Date();
      showPlatformMessage("✅ Cache limpo com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao limpar cache:", error);
      throw error;
    }
  }

  // 1. Limpar cache de imagens
  private async clearImageCache(): Promise<void> {
    try {
      // Limpar cache do Expo Image
      await ImagePicker.requestMediaLibraryPermissionsAsync();

      // Limpar diretórios de imagem
      const dirs = Object.values(CACHE_DIRS);
      for (const dir of dirs) {
        try {
          if (dir) {
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (dirInfo.exists) {
              await FileSystem.deleteAsync(dir, { idempotent: true });
              console.log(`📁 Diretório limpo: ${dir}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Erro ao limpar ${dir}:`, error);
        }
      }

      // Recriar diretórios necessários
      await this.recreateCacheDirs();
    } catch (error) {
      console.error("Erro ao limpar cache de imagens:", error);
    }
  }

  // 2. Limpar arquivos temporários
  private async clearTempFiles(): Promise<void> {
    try {
      const tempDir = FileSystem.cacheDirectory;
      if (!tempDir) return;

      const files = await FileSystem.readDirectoryAsync(tempDir);

      for (const file of files) {
        const filePath = `${tempDir}${file}`;
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && !file.includes(".nomedia")) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
          }
        } catch (error) {
          console.log(`⚠️ Erro ao deletar ${file}:`, error);
        }
      }

      console.log(`🗑️ ${files.length} arquivos temporários removidos`);
    } catch (error) {
      console.error("Erro ao limpar arquivos temporários:", error);
    }
  }

  // 3. Limpar AsyncStorage
  private async clearAsyncStorage(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToClear = allKeys.filter(
        (key) =>
          key.includes("recents") ||
          key.includes("favorites") ||
          key.includes("cache") ||
          key.includes("temp"),
      );

      if (keysToClear.length > 0) {
        await AsyncStorage.multiRemove(keysToClear);
      }
      console.log(`💾 ${keysToClear.length} chaves do AsyncStorage removidas`);
    } catch (error) {
      console.error("Erro ao limpar AsyncStorage:", error);
    }
  }

  // 5. Limpar dados de álbuns
  private async clearAlbumsData(): Promise<void> {
    try {
      // Limpar cache em memória

      // Remover diretório de álbuns
      const albumsDir = CACHE_DIRS.ALBUMS;
      if (albumsDir) {
        const dirInfo = await FileSystem.getInfoAsync(albumsDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(albumsDir, { idempotent: true });
        }
      }

      console.log("🎵 Cache de álbuns limpo");
    } catch (error) {
      console.error("Erro ao limpar dados de álbuns:", error);
    }
  }

  // 6. Limpar cache do React Navigation
  private async clearNavigationCache(): Promise<void> {
    try {
      const navKeys = await AsyncStorage.getAllKeys();
      const navCacheKeys = navKeys.filter((key) =>
        key.includes("NAVIGATION_STATE"),
      );
      if (navCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(navCacheKeys);
      }
    } catch (error) {
      console.log("⚠️ Erro ao limpar cache de navegação:", error);
    }
  }

  // Recriar diretórios de cache
  private async recreateCacheDirs(): Promise<void> {
    try {
      const dirs = Object.values(CACHE_DIRS);
      for (const dir of dirs) {
        if (dir) {
          try {
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          } catch (error) {
            // Diretório já existe ou erro ignorável
          }
        }
      }
    } catch (error) {
      console.error("Erro ao recriar diretórios:", error);
    }
  }
  // Limpar cache específico por tipo
  async clearSpecificCache(
    type: "images" | "temp" | "async" | "mmkv",
  ): Promise<void> {
    switch (type) {
      case "images":
        await this.clearImageCache();
        break;
      case "temp":
        await this.clearTempFiles();
        break;
      case "async":
        await this.clearAsyncStorage();
        break;
    }
  }

  // Limpar cache de forma segura (sem erros)
  async safeClearCache(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.clearAllCache();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const cacheManager = CacheManager.getInstance();
