import ActivityIndicatorCustom from "@/components/activityIndicator-Custom";
import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { showPlatformMessage } from "@/components/toast-message-plataform";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import { usePlayerHeight } from "@/context/player-height-context";
import { useTheme } from "@/context/ThemeContext";
import { useMusicDetails } from "@/hooks/music-hooks/useMusicDetails";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTrackCover } from "@/hooks/useTrackCover";
import { METADATA_MUSIC } from "@/lib/metada-music";
import { TrackDetails } from "@/types/interfaces";
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
  ListMusicIcon,
  Music,
  Pause,
  Play,
  TextInitialIcon,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PlaylistSongPicker } from "../../../../components/PlaylistSongPicker";

const DetailsMusic = () => {
  const { isDark, colors } = useTheme();

  const { playerHeight } = usePlayerHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlists, handleRemoveSongFromPlaylist, handleAddSongToPlaylist } =
    usePlaylists();
  const { error, loading, musicDetails, loadingLyrics } = useMusicDetails(
    id ? String(id) : "",
  );

  const { playSongs, togglePlayPause, currentTrack } = usePlayer();
  const [seeMore, setSeeMore] = useState(false);
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const { openSheet, closeSheet } = useBottomSheet();
  const toggleSeeMore = useCallback(() => setSeeMore((p) => !p), []);
  const { cover } = useTrackCover(
    musicDetails?.filePath || "",
    musicDetails?.id,
  );
  const { t } = useTranslation();

  const pathname = usePathname();
  const isOnPage = ["player", "details-music", "details-album"].some((p) =>
    pathname.includes(p),
  );

  const getBottomValue = () => {
    if (Platform.OS === "ios") return isOnPage ? 40 : 72;
    return isOnPage ? 20 : 65;
  };

  const bottomPadding = currentTrack
    ? playerHeight + getBottomValue() + 16
    : 32;

  const getBottomSheetContent = useCallback(
    (song: TrackDetails) => (
      <PlaylistSongPicker
        song={song}
        playlists={playlists}
        colors={colors}
        isDark={isDark}
        onAddSong={handleAddSongToPlaylist}
        onRemoveSong={handleRemoveSongFromPlaylist}
      />
    ),
    [
      playlists,
      handleAddSongToPlaylist,
      handleRemoveSongFromPlaylist,
      isDark,
      colors,
    ],
  );

  const handleOpenBottomSheet = useCallback(
    (item: TrackDetails) => {
      openSheet({
        snapPoints: ["30%", "50%"],
        content: () => getBottomSheetContent(item), // ← currying com item atual
      });
    },
    [openSheet, getBottomSheetContent],
  );

  const handleCopyLyrics = useCallback(async (lyrics: string) => {
    if (isCopying) return;
    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(lyrics);
      showPlatformMessage(t("lyrics.feedback.copied"));
      setTimeout(() => setIsCopying(false), 5000);
    } catch (error) {
      console.error("Erro ao copiar letra:", error);
      showPlatformMessage(t("lyrics.feedback.copyError"));
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

  if (loading) {
    return (
      <View className="flex-1">
        <ActivityIndicatorCustom />
      </View>
    );
  }

  if (!musicDetails || error) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4"
        style={{
          backgroundColor: colors.surface,
        }}
      >
        <View className="dark:bg-zinc-800 bg-zinc-200 p-6 rounded-2xl">
          <Music size={48} color={isDark ? "#71717a" : "#a1a1aa"} />
        </View>
        <Text className="text-1">{t("music.notFound")}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-2 px-6 py-3 bg-blue-500 rounded-xl"
        >
          <Text className="text-white font-semibold">{t("common.back")}</Text>
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
        <View
          className="hero-container"
          style={{ height: IMAGE_SIZE_BACKGROUND }}
        >
          {cover ? (
            <ImageBackground
              source={{ uri: cover }}
              style={{
                flex: 1,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                overflow: "hidden",
              }}
              contentFit="cover"
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.92)"]}
                style={StyleSheet.absoluteFill}
              />
              <HeroContent musicDetails={musicDetails} t={t} />
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
              <HeroContent musicDetails={musicDetails} noImage t={t} />
            </View>
          )}
          <BackButton
            isBottomOption={true}
            handleSongPress={() => handleOpenBottomSheet(musicDetails)}
          >
            <View>
              <ListMusicIcon size={16} color="#fff" />
            </View>
          </BackButton>
        </View>

        <View className="px-4 gap-3 mt-4">
          {/* ── Ações ── */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              className="btn-play"
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
                  <Text className="btn-play-text">
                    {isPlaying
                      ? `${t("player.feedback.current")}`
                      : `${t("player.feedback.playe")}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="btn-delete-outline"
              activeOpacity={0.85}
            >
              <Trash2 size={16} color="#f87171" />
              <Text className="btn-delete-text">{t("common.delete")}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Detalhes ── */}
          <View className="detail-card">
            <View className="detail-card-header">
              <View className="flex-row gap-3 items-center">
                <View className="detail-card-icon-wrap">
                  <Info size={14} color="#3b82f6" />
                </View>
                <Text className="detail-card-title">{t("common.details")}</Text>
              </View>
            </View>

            {METADATA_MUSIC.map((item, i) => {
              const value =
                musicDetails[item.value as keyof typeof musicDetails];
              if (!value) return null;
              return (
                <View
                  key={item.value}
                  className={[
                    "meta-row",
                    i < METADATA_MUSIC.length - 1
                      ? "border-b-[0.5px] border-black/[0.06] dark:border-white/[0.06]"
                      : "",
                  ].join(" ")}
                >
                  <Text className="meta-label">{t(item.labelKey)}</Text>
                  <Text className="meta-value" numberOfLines={1}>
                    {String(value)}
                  </Text>
                </View>
              );
            })}

            {/* Linha extra: arquivo + duração */}
            <View className="meta-row">
              <Text className="meta-label">{t("common.file")}</Text>
              <Text className="meta-value">
                {musicDetails.title?.split(".").pop()?.toUpperCase()} •{" "}
                {formatDuration(musicDetails.duration)}
              </Text>
            </View>
          </View>

          {/* ── Letra ── */}
          <View className="detail-card">
            <View className="detail-card-header">
              <View className="flex-row gap-3 items-center">
                <View className="detail-card-icon-wrap">
                  <TextInitialIcon size={14} color="#3b82f6" />
                </View>
                <Text className="detail-card-title">{t("lyrics.title")}</Text>
              </View>

              {musicDetails.lyrics && (
                <TouchableOpacity
                  onPress={() =>
                    handleCopyLyrics(musicDetails.lyrics as string)
                  }
                  disabled={isCopying || loadingLyrics}
                  className="p-1.5"
                >
                  {isCopying ? (
                    <CopyCheck size={18} color="rgba(59,130,246,0.5)" />
                  ) : (
                    <Copy size={18} color={colors.icon} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {loadingLyrics ? (
              <ActivityIndicator size={28} color={colors.iconActive} />
            ) : musicDetails.lyrics ? (
              <>
                <Text
                  className="lyrics-text"
                  numberOfLines={seeMore ? undefined : 8}
                >
                  {musicDetails.lyrics}
                </Text>
                <TouchableOpacity onPress={toggleSeeMore}>
                  <Text className="lyrics-see-more">
                    {seeMore
                      ? `${t("text.feedback.seeless")}`
                      : `${t("text.feedback.seemore")}`}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text className="lyrics-empty">{t("lyrics.unavailable")}</Text>
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
  t,
}: {
  musicDetails: any;
  noImage?: boolean;
  t: any;
}) {
  return (
    <View className={`hero-info ${noImage ? "relative bottom-0 mt-4" : ""}`}>
      {!noImage && (
        <View className="hero-badge">
          <View className="hero-dot" />
          <Text className="hero-badge-text">{t("music.title")}</Text>
        </View>
      )}
      <Text className="hero-title" numberOfLines={2}>
        {musicDetails.title ?? musicDetails.filename?.replace(/\.[^/.]+$/, "")}
      </Text>
      {musicDetails.artist && (
        <Text className="hero-artist" numberOfLines={1}>
          {musicDetails.artist}
          {musicDetails.year ? ` • ${musicDetails.year}` : ""}
        </Text>
      )}
    </View>
  );
}

export default DetailsMusic;
