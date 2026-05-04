import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

const { BackgroundUpdateModule } = NativeModules;

// Stub para iOS (não implementado) ou quando o módulo não existe
const stub = {
  startBackgroundCheck: async () => "not_supported",
  stopBackgroundCheck: async () => "not_supported",
  updateStoredVersion: async () => "not_supported",
  checkNow: async () => "not_supported",
};

const module =
  Platform.OS === "android" && BackgroundUpdateModule
    ? BackgroundUpdateModule
    : stub;

export interface BackgroundCheckConfig {
  repoOwner: string;
  repoName: string;
  currentVersion: string;
}

/**
 * Inicia verificação periódica em segundo plano (a cada 6h).
 * WorkManager garante execução mesmo com app fechado.
 * Quando detectar update, envia notificação push automaticamente.
 */
export async function startBackgroundUpdateCheck(
  config: BackgroundCheckConfig,
): Promise<string> {
  return module.startBackgroundCheck(
    config.repoOwner,
    config.repoName,
    config.currentVersion,
  );
}

/**
 * Para as verificações em background.
 * Chamar ao fazer logout ou desabilitar updates automáticos.
 */
export async function stopBackgroundUpdateCheck(): Promise<string> {
  return module.stopBackgroundCheck();
}

/**
 * Atualiza a versão armazenada no nativo.
 * Chamar após um update bem-sucedido para evitar notificações duplicadas.
 */
export async function updateStoredVersion(version: string): Promise<string> {
  return module.updateStoredVersion(version);
}

/**
 * Dispara uma verificação imediata (OneTimeWork).
 * Útil para verificar manualmente sem esperar o intervalo de 6h.
 */
export async function triggerImmediateCheck(): Promise<string> {
  return module.checkNow();
}

const BG_UPDATE_ENABLED_KEY = "@bg_update_enabled";

export async function setBgUpdateEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BG_UPDATE_ENABLED_KEY, JSON.stringify(enabled));
}

export async function getBgUpdateEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BG_UPDATE_ENABLED_KEY);
  return val === null ? true : JSON.parse(val); // padrão: ativado
}

export const isBackgroundCheckSupported = Platform.OS === "android";
