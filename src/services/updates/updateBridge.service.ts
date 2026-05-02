// Thin TypeScript wrapper around the Kotlin UpdateModule.
// Handles missing-module gracefully so the app works in Expo Go / web.

import { NativeEventEmitter, NativeModules, Platform } from "react-native";

// ─── Types

export interface ProgressPayload {
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes/sec
  downloadedFormatted: string;
  totalFormatted: string;
  speedFormatted: string;
}

export interface CompletePayload {
  filePath: string;
}

export interface ErrorPayload {
  error: string;
}

export interface InstallStatusPayload {
  /** 'installing' | 'launched' | 'permission_required' */
  status: string;
}

export type UpdateEventMap = {
  progressoDownload: ProgressPayload;
  downloadCompleto: CompletePayload;
  erroDownload: ErrorPayload;
  statusInstalacao: InstallStatusPayload;
};

// ─── Native module access

const { UpdateModule: _NativeUpdateModule } = NativeModules;

const isAvailable = Platform.OS === "android" && !!_NativeUpdateModule;

/** Raw NativeModule — consumers should prefer the typed helpers below */
export const NativeUpdateModule = _NativeUpdateModule as {
  startDownload(
    url: string,
    version: string,
    fileSize: number,
  ): Promise<boolean>;
  cancelDownload(): Promise<boolean>;
  canInstallPackages(): Promise<boolean>;
  requestInstallPermission(): Promise<string>;
  getAppVersion(): Promise<{ versionName: string; versionCode: number }>;
} | null;

// ─── Event emitter

let _emitter: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter | null {
  if (!isAvailable) return null;
  if (!_emitter) _emitter = new NativeEventEmitter(_NativeUpdateModule);
  return _emitter;
}

export function onUpdateEvent<K extends keyof UpdateEventMap>(
  event: K,
  handler: (payload: UpdateEventMap[K]) => void,
) {
  const emitter = getEmitter();
  if (!emitter) return { remove: () => {} };
  return emitter.addListener(event as string, handler);
}

// ─── Typed helpers

export async function nativeStartDownload(
  url: string,
  version: string,
  fileSize: number,
): Promise<boolean> {
  if (!NativeUpdateModule) return false;
  return NativeUpdateModule.startDownload(url, version, fileSize);
}

export async function nativeCancelDownload(): Promise<boolean> {
  if (!NativeUpdateModule) return false;
  return NativeUpdateModule.cancelDownload();
}

export async function nativeCanInstallPackages(): Promise<boolean> {
  if (!NativeUpdateModule) return true; // non-Android → assume OK
  return NativeUpdateModule.canInstallPackages();
}

export async function nativeRequestInstallPermission(): Promise<string> {
  if (!NativeUpdateModule) return "already_granted";
  return NativeUpdateModule.requestInstallPermission();
}

export async function nativeGetAppVersion(): Promise<{
  versionName: string;
  versionCode: number;
} | null> {
  let versionName = "0.0.0";
  let versionCode = 1;

  if (!NativeUpdateModule) {
    try {
      const Constants = require("expo-constants").default;
      versionName = Constants.expoConfig?.version ?? "0.0.0";
      versionCode = Constants.expoConfig?.android?.versionCode ?? 1;
    } catch {
      return null;
    }
  } else {
    const result = await NativeUpdateModule.getAppVersion();
    versionName = result.versionName;
    versionCode = result.versionCode;
  }

  return { versionName, versionCode };
}
