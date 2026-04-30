import ActivityIndicatorCustom from "@/components/activityIndicator-Custom";
import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { showPlatformMessage } from "@/components/toast-message-plataform";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import { usePlayerHeight } from "@/context/player-height-context";
import { useMusicDetails } from "@/hooks/useMusicDetails";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTheme } from "@/hooks/useTheme";
import { METADATA_MUSIC } from "@/lib/metada-music";
import { TrackDetails } from "@/types/interfaces";
import { formatDuration } from "@/utils/formaTS/formatTimeSong";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import * as Clipboard from "expo-clipboard";
import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import {
  Album,
  ArrowRightCircle,
  CheckCircle,
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
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTrackCover } from "../../../../hooks/useTrackCover";

const DetailsMusic = () => {
  const { isDark, colors } = useTheme();

  const { playerHeight } = usePlayerHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlists, handleAddSongToPlaylist, handleRemoveSongFromPlaylist } =
    usePlaylists();
  const { error, loading, musicDetails } = useMusicDetails(
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
    (song: TrackDetails) => {
      return (
        <View className="flex-col gap-5 px-4">
          {playlists.length > 0 ? (
            playlists.map((c) => {
              const isMusic = c.songs?.some((s) => s.id === song.id) ?? false;

              return (
                <Pressable
                  key={c.id}
                  className="flex-col flex-1 gap-4 px-4 py-3.5 rounded-2xl dark:bg-zinc-800/70 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200 active:opacity-80"
                  onPress={async () => {
                    if (isMusic) {
                      await handleRemoveSongFromPlaylist(c.id, song.id);
                    } else {
                      await handleAddSongToPlaylist(c.id, song);
                    }
                  }}
                >
                  <View className="flex-row gap-4 items-center justify-between">
                    <View className="flex-row gap-3 items-center">
                      <View className="w-20 h-20 rounded-3xl overflow-hidden dark:bg-zinc-800 bg-zinc-100 items-center justify-center border dark:border-zinc-700 border-zinc-200 shadow-sm">
                        {c.coverArt ? (
                          <Image
                            source={{ uri: c.coverArt }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <ListMusicIcon
                            size={24}
                            color={colors.icon}
                            strokeWidth={1.5}
                          />
                        )}
                      </View>
                      <View className="flex-col gap-2">
                        <Text className="text">{c.title}</Text>
                        <Text className="text text-base text-zinc-300">
                          Musicas: {c.songs?.length || 0}
                        </Text>
                      </View>
                    </View>
                    {isMusic ? (
                      <CheckCircle size={28} color={colors.primary} />
                    ) : (
                      <ArrowRightCircle
                        size={28}
                        color={isDark ? "#71717a" : "#a1a1aa"}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View className="items-center justify-center">
              <Text className="text text-zinc-300">Nenhuma Playlist</Text>
            </View>
          )}
        </View>
      );
    },
    [
      playlists,
      handleAddSongToPlaylist,
      handleRemoveSongFromPlaylist,
      isDark,
      colors,
    ],
  );
  //  ^ selectedSong removido das deps — recebe via parâmetro agora

  const handleOpenBottomSheet = useCallback(
    (item: TrackDetails) => {
      openSheet({
        snapPoints: ["60%"],
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
      showPlatformMessage("Letra copiada para a área de transferência!");
      setTimeout(() => setIsCopying(false), 5000);
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
                    {isPlaying ? "Pausar" : "Tocar música"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="btn-delete-outline"
              activeOpacity={0.85}
            >
              <Trash2 size={16} color="#f87171" />
              <Text className="btn-delete-text">Excluir</Text>
            </TouchableOpacity>
          </View>

          {/* ── Detalhes ── */}
          <View className="detail-card">
            <View className="detail-card-header">
              <View className="flex-row gap-3 items-center">
                <View className="detail-card-icon-wrap">
                  <Info size={14} color="#3b82f6" />
                </View>
                <Text className="detail-card-title">Detalhes</Text>
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
                  <Text className="meta-label">{item.label}</Text>
                  <Text className="meta-value" numberOfLines={1}>
                    {String(value)}
                  </Text>
                </View>
              );
            })}

            {/* Linha extra: arquivo + duração */}
            <View className="meta-row">
              <Text className="meta-label">Arquivo</Text>
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
                <Text className="detail-card-title">Letra</Text>
              </View>

              {musicDetails.lyrics && (
                <TouchableOpacity
                  onPress={() =>
                    handleCopyLyrics(musicDetails.lyrics as string)
                  }
                  disabled={isCopying}
                  className="p-1.5"
                >
                  {isCopying ? (
                    <CopyCheck size={18} color="rgba(59,130,246,0.5)" />
                  ) : (
                    <Copy size={18} color={isDark ? "#fff" : "#18181b"} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {musicDetails.lyrics ? (
              <>
                <Text
                  className="lyrics-text"
                  numberOfLines={seeMore ? undefined : 8}
                >
                  {musicDetails.lyrics}
                </Text>
                <TouchableOpacity onPress={toggleSeeMore}>
                  <Text className="lyrics-see-more">
                    {seeMore ? "Ver menos" : "Ver mais"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text className="lyrics-empty">
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
    <View className={`hero-info ${noImage ? "relative bottom-0 mt-4" : ""}`}>
      {!noImage && (
        <View className="hero-badge">
          <View className="hero-dot" />
          <Text className="hero-badge-text">Música</Text>
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
