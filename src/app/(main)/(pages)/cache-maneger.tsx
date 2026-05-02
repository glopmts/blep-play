import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { BackButton } from "@/components/black-button";
import { useTheme } from "@/context/ThemeContext";
import { dbClearAllAlbums } from "@/database/albumsCache";
import { clearAllCovers } from "@/database/cache/coverArtCache";
import { musicCache } from "@/database/music-cache";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import {
  Album,
  Database,
  HardDrive,
  Image,
  Music,
  RefreshCw,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── tipos
interface CacheSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  size: number | null; // bytes
  count: number | null;
  loading: boolean;
  onClear: () => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getDirSize(dir: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return 0;
    const files = await FileSystem.readDirectoryAsync(dir);
    let total = 0;
    for (const f of files) {
      const fi = await FileSystem.getInfoAsync(dir + f);
      if (fi.exists) total += (fi as any).size ?? 0;
    }
    return total;
  } catch {
    return 0;
  }
}

async function countRows(dbName: string, table: string): Promise<number> {
  try {
    const db = await SQLite.openDatabaseAsync(dbName);
    const row = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) as n FROM ${table}`,
    );
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

// ─── componente principal
const CacheManager = () => {
  const { colors } = useTheme();
  const accent = colors.primary ?? "#A6FF4D";
  const danger = colors.danger ?? "#ef4444";
  const card = colors.input ?? "#27272a";
  const text = colors.text ?? "#fff";
  const sub = colors.text_gray ?? "#888";
  const border = colors.border ?? "#ffffff14";

  const [sections, setSections] = useState<CacheSection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);

  // ── medir cada seção
  const measure = useCallback(async (): Promise<CacheSection[]> => {
    const coversDir = `${FileSystem.cacheDirectory}covers/`;
    const musicCoversDir = `${FileSystem.cacheDirectory}music_covers/`;
    const musicsRecent = `${FileSystem.cacheDirectory}music_recents_v1`;
    const playlistCoversDir = `${FileSystem.documentDirectory}playlist_covers/`;

    const [
      coversSize,
      musicCoversSize,
      playlistCoversSize,
      trackCount,
      albumCount,
      coverCount,
    ] = await Promise.all([
      getDirSize(coversDir),
      getDirSize(musicCoversDir),
      getDirSize(playlistCoversDir),
      countRows("music_cache_v2.db", "cached_tracks"),
      countRows("albums_cache_v2.db", "albums_list"),
      countRows("covers_cache_v2.db", "covers_cache"),
    ]);

    return [
      {
        id: "covers",
        label: "Capas de álbuns",
        description: "Imagens comprimidas em disco",
        icon: <Image size={20} color={accent} />,
        size: coversSize + musicCoversSize,
        count: coverCount,
        loading: false,
        onClear: async () => {
          await clearAllCovers();
        },
      },
      {
        id: "tracks",
        label: "Cache de faixas",
        description: "Índice SQLite de músicas escaneadas",
        icon: <Music size={20} color={accent} />,
        size: null,
        count: trackCount,
        loading: false,
        onClear: async () => {
          await musicCache.clearCache();
        },
      },
      {
        id: "albums",
        label: "Cache de álbuns",
        description: "Lista de álbuns em cache",
        icon: <Album size={20} color={accent} />,
        size: null,
        count: albumCount,
        loading: false,
        onClear: async () => {
          await dbClearAllAlbums();
        },
      },
      {
        id: "playlists",
        label: "Capas de playlists",
        description: "Imagens customizadas de playlists",
        icon: <HardDrive size={20} color={accent} />,
        size: playlistCoversSize,
        count: null,
        loading: false,
        onClear: async () => {
          const info = await FileSystem.getInfoAsync(playlistCoversDir);
          if (info.exists)
            await FileSystem.deleteAsync(playlistCoversDir, {
              idempotent: true,
            });
        },
      },
    ];
  }, [accent]);

  const load = useCallback(async () => {
    setRefreshing(true);
    // Mostra loading em cada card
    setSections((prev) =>
      prev.length === 0
        ? [
            {
              id: "covers",
              label: "Capas de álbuns",
              description: "",
              icon: null,
              size: null,
              count: null,
              loading: true,
              onClear: async () => {},
            },
            {
              id: "tracks",
              label: "Cache de faixas",
              description: "",
              icon: null,
              size: null,
              count: null,
              loading: true,
              onClear: async () => {},
            },
            {
              id: "albums",
              label: "Cache de álbuns",
              description: "",
              icon: null,
              size: null,
              count: null,
              loading: true,
              onClear: async () => {},
            },
            {
              id: "playlists",
              label: "Capas de playlists",
              description: "",
              icon: null,
              size: null,
              count: null,
              loading: true,
              onClear: async () => {},
            },
          ]
        : prev.map((s) => ({ ...s, loading: true })),
    );
    const result = await measure();
    setSections(result);
    setRefreshing(false);
  }, [measure]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = (section: CacheSection) => {
    Alert.alert(
      `Limpar ${section.label}`,
      "Esta ação não pode ser desfeita. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            setClearingId(section.id);
            try {
              await section.onClear();
              await load();
            } finally {
              setClearingId(null);
            }
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Limpar todo o cache",
      "Todos os dados em cache serão removidos. As músicas continuarão disponíveis, mas capas e índices serão recriados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar tudo",
          style: "destructive",
          onPress: async () => {
            setClearingId("all");
            try {
              await Promise.all(sections.map((s) => s.onClear()));
              await load();
            } finally {
              setClearingId(null);
            }
          },
        },
      ],
    );
  };

  const totalSize = sections.reduce((acc, s) => acc + (s.size ?? 0), 0);

  return (
    <LayoutWithHeader statusBarOpen={false} header={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16 }}>
          <BackButton
            position="relative"
            style={{ paddingTop: 8, paddingHorizontal: 2 }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
            }}
          >
            <View
              style={{
                padding: 14,
                backgroundColor: card,
                borderRadius: 16,
              }}
            >
              <Database size={26} color={accent} />
            </View>
            <View>
              <Text style={{ color: text, fontSize: 22, fontWeight: "700" }}>
                Gerenciar Cache
              </Text>
              <Text style={{ color: sub, fontSize: 13, marginTop: 2 }}>
                {totalSize > 0 ? formatBytes(totalSize) : "calculando..."} em
                uso
              </Text>
            </View>

            {/* Refresh */}
            <Pressable
              onPress={load}
              disabled={refreshing}
              hitSlop={12}
              style={{ marginLeft: "auto", opacity: refreshing ? 0.5 : 1 }}
            >
              <RefreshCw size={20} color={sub} />
            </Pressable>
          </View>

          {/* Cards */}
          <View style={{ marginTop: 24, gap: 10 }}>
            {sections.map((section) => (
              <CacheCard
                key={section.id}
                section={section}
                clearing={clearingId === section.id || clearingId === "all"}
                onClear={() => handleClear(section)}
                colors={{ card, text, sub, border, accent, danger }}
              />
            ))}
          </View>

          {/* Botão limpar tudo */}
          {sections.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={clearingId !== null}
              style={{
                marginTop: 20,
                padding: 15,
                borderRadius: 14,
                backgroundColor:
                  clearingId !== null
                    ? (colors.danger_v2 ?? "#450a0a")
                    : danger + "22",
                borderWidth: 1,
                borderColor: danger + "44",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {clearingId === "all" ? (
                <ActivityIndicator size={16} color={danger} />
              ) : (
                <Trash2 size={16} color={danger} />
              )}
              <Text style={{ color: danger, fontWeight: "700", fontSize: 14 }}>
                {clearingId === "all" ? "Limpando..." : "Limpar todo o cache"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Nota informativa */}
          <Text
            style={{
              color: sub,
              fontSize: 11,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 16,
            }}
          >
            Limpar o cache não remove suas músicas ou playlists.{"\n"}
            Capas e índices serão recriados automaticamente.
          </Text>
        </View>
      </ScrollView>
    </LayoutWithHeader>
  );
};

// ─── card individual
interface CardColors {
  card: string;
  text: string;
  sub: string;
  border: string;
  accent: string;
  danger: string;
}

function CacheCard({
  section,
  clearing,
  onClear,
  colors,
}: {
  section: CacheSection;
  clearing: boolean;
  onClear: () => void;
  colors: CardColors;
}) {
  const { card, text, sub, border, accent, danger } = colors;

  return (
    <View
      style={{
        backgroundColor: card,
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      {/* Ícone */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: accent + "18",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {section.loading ? (
          <ActivityIndicator size={16} color={accent} />
        ) : (
          section.icon
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: text, fontSize: 14, fontWeight: "600" }}>
          {section.label}
        </Text>
        <Text style={{ color: sub, fontSize: 11, marginTop: 2 }}>
          {section.description}
        </Text>

        {/* Métricas */}
        {!section.loading && (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 5,
              flexWrap: "wrap",
            }}
          >
            {section.size !== null && (
              <Pill
                label={formatBytes(section.size)}
                color={section.size > 0 ? accent : sub}
              />
            )}
            {section.count !== null && (
              <Pill
                label={`${section.count} ${section.count === 1 ? "item" : "itens"}`}
                color={section.count > 0 ? accent : sub}
              />
            )}
            {section.size === null && section.count === null && (
              <Pill label="—" color={sub} />
            )}
          </View>
        )}
      </View>

      {/* Botão limpar */}
      <Pressable
        onPress={onClear}
        disabled={clearing || section.loading}
        hitSlop={10}
        style={({ pressed }) => ({
          opacity: clearing || section.loading ? 0.4 : pressed ? 0.6 : 1,
          padding: 8,
          borderRadius: 8,
          backgroundColor: danger + "18",
        })}
      >
        {clearing ? (
          <ActivityIndicator size={14} color={danger} />
        ) : (
          <Trash2 size={16} color={danger} />
        )}
      </Pressable>
    </View>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: color + "22",
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export default CacheManager;
