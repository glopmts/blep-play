import AsyncStorage from "@react-native-async-storage/async-storage";

//  Config

const GITHUB_OWNER = "glopmts";
const GITHUB_REPO = "blep-play";
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const CACHE_KEY = "@blep_update_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

//  Types─

export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  prerelease: boolean;
  draft: boolean;
  published_at: string;
  assets: GitHubAsset[];
}

export interface UpdateInfo {
  latestVersion: string;
  releaseNotes: string;
  apkUrl: string;
  apkSize: number;
  publishedAt: string;
  releaseName: string;
  isPrerelease: boolean;
}

interface CacheEntry {
  data: GitHubRelease;
  fetchedAt: number;
}

//  Helpers ──

/** Strip leading "v" from tag like "v1.2.3" → "1.2.3" */
export const normalizeVersion = (tag: string): string =>
  tag.replace(/^v/i, "").trim();

/** Simple semver comparison: returns true if `remote` > `local` */
export const isNewerVersion = (local: string, remote: string): boolean => {
  const parse = (v: string) =>
    normalizeVersion(v)
      .split(".")
      .map((n) => parseInt(n, 10) || 0);

  const [lMaj, lMin, lPat] = parse(local);
  const [rMaj, rMin, rPat] = parse(remote);

  if (rMaj !== lMaj) return rMaj > lMaj;
  if (rMin !== lMin) return rMin > lMin;
  return rPat > lPat;
};

/** Find the first APK asset in a release */
const findApkAsset = (assets: GitHubAsset[]): GitHubAsset | undefined =>
  assets.find(
    (a) =>
      a.name.endsWith(".apk") ||
      a.content_type === "application/vnd.android.package-archive",
  );

//  Cache─

async function getCachedRelease(): Promise<GitHubRelease | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function setCachedRelease(data: GitHubRelease): Promise<void> {
  try {
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore cache write failures
  }
}

export async function clearUpdateCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

//  Fetcher ──

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch the latest GitHub release with:
 * - In-memory+AsyncStorage caching
 * - Automatic retry with back-off
 * - Offline fallback to cache
 */
export async function fetchLatestRelease(
  forceRefresh = false,
): Promise<GitHubRelease> {
  if (!forceRefresh) {
    const cached = await getCachedRelease();
    if (cached) return cached;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }

      const data: GitHubRelease = await res.json();
      await setCachedRelease(data);
      return data;
    } catch (err: any) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  // All retries failed — try stale cache
  const stale = await getCachedRelease().catch(() => null);
  if (stale) return stale;

  throw lastError ?? new Error("Falha ao verificar atualizações");
}

/**
 * High-level helper: returns structured UpdateInfo or null if no APK found.
 */
export async function getUpdateInfo(
  forceRefresh = false,
): Promise<UpdateInfo | null> {
  const release = await fetchLatestRelease(forceRefresh);
  const apk = findApkAsset(release.assets);
  if (!apk) return null;

  return {
    latestVersion: normalizeVersion(release.tag_name),
    releaseNotes: release.body || "Sem notas de versão.",
    apkUrl: apk.browser_download_url,
    apkSize: apk.size,
    publishedAt: release.published_at,
    releaseName: release.name || release.tag_name,
    isPrerelease: release.prerelease,
  };
}
