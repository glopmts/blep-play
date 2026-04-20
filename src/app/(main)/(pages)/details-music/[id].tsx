import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { showPlatformMessage } from "@/components/toast-message-plataform";
import { usePlayerHeight } from "@/context/player-height-context";
import { useMusic } from "@/hooks/useMusic";
import { usePlayer } from "@/hooks/usePlayer";
import { METADATA_MUSIC } from "@/lib/metada-music";
import { formatDuration } from "@/utils/formaTS/formatTimeSong";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import * as Clipboard from "expo-clipboard";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import {
  Album,
  Copy,
  CopyCheck,
  Info,
  Music,
  Pause,
  Play,
  TextInitialIcon,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const DetailsMusic = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { playerHeight } = usePlayerHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { error, loading, musicDetails } = useMusic({ musicId: id as string });
  const { playSongs, togglePlayPause, currentTrack } = usePlayer();
  const [seeMore, setSeeMore] = useState(false);
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const pathname = usePathname();
  const isOnPage = ["player", "details-music", "details-album"].some((p) =>
    pathname.includes(p),
  );

  // Função para calcular o valor de bottom com base na plataforma e se estamos na página de detalhes
  const getBottomValue = () => {
    if (Platform.OS === "ios") return isOnPage ? 40 : 72;
    return isOnPage ? 20 : 65;
  };

  // Calcula o espaço necessário embaixo
  const bottomPadding = currentTrack
    ? playerHeight + getBottomValue() + 16 // altura + posição + margem
    : 32;

  const toggleSeeMore = useCallback(() => setSeeMore((p) => !p), []);

  const handleCopyLyrics = useCallback(async (lyrics: string) => {
    if (isCopying) return;
    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(lyrics);
      showPlatformMessage("Letra copiada para a área de transferência!");
      setTimeout(() => setIsCopying(false), 5000); // Reseta o estado após 2 segundos
    } catch (error) {
      console.error("Erro ao copiar letra:", error);
      setIsCopying(false);
    }
  }, []);

  const handleSongPress = useCallback(
    async (index: number) => {
      if (!musicDetails || loadingSongIndex !== null) return;
      setLoadingSongIndex(index);
      try {
        if (currentTrack?.id === musicDetails.id) await togglePlayPause();
        else await playSongs([musicDetails], index);
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [musicDetails, playSongs, loadingSongIndex, currentTrack, togglePlayPause],
  );

  if (loading && !musicDetails) {
    return (
      <View className="infor-alert">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!musicDetails || error) {
    return (
      <View className="infor-alert gap-4">
        <View className="dark:bg-zinc-800 bg-zinc-200 p-6 rounded-2xl">
          <Music size={48} color={isDark ? "#71717a" : "#a1a1aa"} />
        </View>
        <Text className="text-1">Música não encontrada</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-2 px-6 py-3 bg-blue-500 rounded-xl"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPlaying = currentTrack?.id === musicDetails.id;

  return (
    <LayoutWithHeader
      header={false}
      showBackButton={false}
      statusBarStyle="light"
      statusBarOpen={false}
      viewPaddingTop="pt-0"
      variant="view"
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.heroContainer}>
          {musicDetails.coverArt ? (
            <ImageBackground
              source={{ uri: musicDetails.coverArt }}
              style={styles.heroImage}
              contentFit="cover"
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.92)"]}
                style={StyleSheet.absoluteFill}
              />
              <HeroContent musicDetails={musicDetails} />
            </ImageBackground>
          ) : (
            <View className="flex-1 dark:bg-zinc-800 bg-zinc-200 items-center justify-center">
              <LinearGradient
                colors={
                  isDark ? ["#27272a", "#18181b"] : ["#f4f4f5", "#e4e4e7"]
                }
                style={StyleSheet.absoluteFill}
              />
              <View className="dark:bg-zinc-700 bg-zinc-300 p-8 rounded-3xl mb-6">
                <Album size={56} color={isDark ? "#52525b" : "#a1a1aa"} />
              </View>
              <HeroContent musicDetails={musicDetails} noImage />
            </View>
          )}
          <BackButton isDark={true} />
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
          {/* ── Ações ── */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={styles.btnPlay}
              onPress={() => handleSongPress(0)}
              disabled={loadingSongIndex !== null}
              activeOpacity={0.85}
            >
              {loadingSongIndex === 0 ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  {isPlaying ? (
                    <Pause size={16} color="#fff" />
                  ) : (
                    <Play size={16} color="#fff" />
                  )}
                  <Text style={styles.btnPlayText}>
                    {isPlaying ? "Pausar" : "Tocar música"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDelete} activeOpacity={0.85}>
              <Trash2 size={16} color="#f87171" />
              <Text style={styles.btnDeleteText}>Excluir</Text>
            </TouchableOpacity>
          </View>

          {/* ── Detalhes ── */}
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Info size={14} color="#3b82f6" />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? "#fff" : "#18181b" },
                ]}
              >
                Detalhes
              </Text>
            </View>

            {METADATA_MUSIC.map((item, i) => {
              const value =
                musicDetails[item.value as keyof typeof musicDetails];
              if (!value) return null;
              return (
                <View
                  key={item.value}
                  style={[
                    styles.metaRow,
                    i < METADATA_MUSIC.length - 1 && {
                      borderBottomWidth: 0.5,
                      borderBottomColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <Text style={styles.metaLabel}>{item.label}</Text>
                  <Text
                    style={[
                      styles.metaValue,
                      { color: isDark ? "rgba(255,255,255,0.85)" : "#18181b" },
                    ]}
                    numberOfLines={1}
                  >
                    {String(value)}
                  </Text>
                </View>
              );
            })}

            {/* Linha extra: arquivo + duração */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Arquivo</Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: isDark ? "rgba(255,255,255,0.85)" : "#18181b" },
                ]}
              >
                {musicDetails.filename?.split(".").pop()?.toUpperCase()} •{" "}
                {formatDuration(musicDetails.duration)}
              </Text>
            </View>
          </View>

          {/* ── Letra ── */}
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <View style={styles.cardHeader}>
              <View className="flex-row gap-3 items-center">
                <View style={styles.cardIconWrap}>
                  <TextInitialIcon size={14} color="#3b82f6" />
                </View>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#fff" : "#18181b" },
                  ]}
                >
                  Letra
                </Text>
              </View>
              <View>
                {musicDetails.lyrics && (
                  <TouchableOpacity
                    onPress={() =>
                      handleCopyLyrics(musicDetails.lyrics as string)
                    }
                    disabled={isCopying}
                    style={{ padding: 6 }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {isCopying ? (
                        <CopyCheck size={18} color={"rgba(59,130,246,0.5)"} />
                      ) : (
                        <Copy size={18} color={isDark ? "#fff" : "#18181b"} />
                      )}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {musicDetails.lyrics ? (
              <>
                <Text
                  style={styles.lyricsText}
                  numberOfLines={seeMore ? undefined : 8}
                >
                  {musicDetails.lyrics}
                </Text>
                <TouchableOpacity
                  onPress={toggleSeeMore}
                  style={{ marginTop: 10 }}
                >
                  <Text style={styles.seeMore}>
                    {seeMore ? "Ver menos" : "Ver mais"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.lyricsEmpty}>
                Letra não disponível para esta música.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </LayoutWithHeader>
  );
};

// Componente auxiliar para o conteúdo do Hero
function HeroContent({
  musicDetails,
  noImage = false,
}: {
  musicDetails: any;
  noImage?: boolean;
}) {
  return (
    <View
      style={[
        styles.heroInfo,
        noImage && { position: "relative", bottom: 0, marginTop: 16 },
      ]}
    >
      {!noImage && (
        <View style={styles.heroBadge}>
          <View style={styles.heroDot} />
          <Text style={styles.heroBadgeText}>Música</Text>
        </View>
      )}
      <Text style={styles.heroTitle} numberOfLines={2}>
        {musicDetails.title ?? musicDetails.filename?.replace(/\.[^/.]+$/, "")}
      </Text>
      {musicDetails.artist && (
        <Text style={styles.heroArtist} numberOfLines={1}>
          {musicDetails.artist}
          {musicDetails.year ? ` • ${musicDetails.year}` : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    width: "100%",
    height: IMAGE_SIZE_BACKGROUND,
  },
  heroImage: {
    flex: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(59,130,246,0.2)",
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.35)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3b82f6",
  },
  heroBadgeText: {
    fontSize: 11,
    color: "#93c5fd",
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroArtist: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  btnPlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnPlayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  btnDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  btnDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f87171",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
  },
  cardDark: {
    backgroundColor: "#27272a",
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardLight: {
    backgroundColor: "#f4f4f5",
    borderColor: "rgba(0,0,0,0.06)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  metaLabel: {
    fontSize: 12,
    color: "rgba(113,113,122,1)",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 12,
    maxWidth: "60%",
    textAlign: "right",
  },
  lyricsText: {
    fontSize: 13,
    color: "rgba(161,161,170,1)",
    lineHeight: 22,
  },
  lyricsEmpty: {
    fontSize: 13,
    color: "rgba(113,113,122,1)",
    fontStyle: "italic",
  },
  seeMore: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },
});

export default DetailsMusic;
