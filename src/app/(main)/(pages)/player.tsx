import ActivityIndicatorCustom from "@/components/activityIndicator-Custom";
import EmptyState from "@/components/empty-state";
import LyricPlayerSong from "@/components/lyric-player";
import { Button } from "@/components/ui/button";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useTheme } from "@/context/ThemeContext";
import { usePipMusic } from "@/hooks/usePipMusic";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/utils/formaTS/formatTimeSong";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import { Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Clapperboard, Music, PictureInPicture } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TrackPlayer, { RepeatMode, Track } from "react-native-track-player";
import VideoClipMusic from "../../../components/video-clip-music";
import { useVideoClip } from "../../../hooks/useVideoClip";
import { TrackDetails } from "../../../types/interfaces";

export default function PlayerScreen() {
  const { isDark, colors } = useTheme();
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    position,
    duration,
    repeatMode,
    isShuffle,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleRepeat,
    toggleShuffle,
    loadExternalTrack,
  } = usePlayer();
  const [isReady, setIsReady] = useState(!!currentTrack);
  const hasLoadedRef = useRef(false);
  const { openSheet, closeSheet } = useBottomSheet();
  const [isVideoClip, setVideoClip] = useState(false);
  const { searchVideoClip, videoId } = useVideoClip();

  const { handlePip } = usePipMusic();
  const { t } = useTranslation();

  const { uri, fileName, artist, album, artworkUri } = useLocalSearchParams<{
    uri?: string;
    fileName?: string;
    artist?: string;
    album?: string;
    artworkUri?: string;
  }>();

  const hint: ExternalTrackHint = {
    title: fileName ? decodeURIComponent(fileName) : undefined,
    artist: artist ? decodeURIComponent(artist) : undefined,
    album: album ? decodeURIComponent(album) : undefined,
    artworkUri: artworkUri ? decodeURIComponent(artworkUri) : undefined,
  };

  const handleVideoClip = useCallback(() => {
    openSheet({
      snapPoints: ["40%"],
      content: <VideoClipMusic song={currentTrack as TrackDetails} />,
    });
  }, [currentTrack, openSheet]);

  useEffect(() => {
    if (currentTrack) setIsReady(true);
  }, [currentTrack]);

  useEffect(() => {
    if (!uri) {
      if (currentTrack) setIsReady(true);
      return;
    }

    if (hasLoadedRef.current) return;

    const handleDeepLink = async () => {
      hasLoadedRef.current = true;
      const decodedUri = decodeURIComponent(uri);

      const activeTrack = await TrackPlayer.getActiveTrack();
      if (activeTrack?.url === decodedUri) {
        setIsReady(true);
        return;
      }

      await loadExternalTrack(uri, fileName ?? undefined, hint);
    };

    handleDeepLink().catch(console.error);
  }, [uri]);

  if (!isReady || !currentTrack) {
    return (
      <View
        className="flex-1"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicatorCustom isImage={true} />
      </View>
    );
  }

  if (!currentTrack || !isReady) {
    return (
      <EmptyState title={t("music.notFound")} onAction={() => router.back()} />
    );
  }

  const handleLyric = useCallback(
    (track: Track) => {
      openSheet({
        trackArtwork: track.artwork,
        snapPoints: ["80%"],
        content: <LyricPlayerSong track={track} />,
      });
    },
    [openSheet, closeSheet],
  );

  const repeatIcon =
    repeatMode === RepeatMode.Track ? "repeat-outline" : "repeat";
  const repeatColor =
    repeatMode === RepeatMode.Off
      ? isDark
        ? "#52525b"
        : "#a1a1aa"
      : colors.primary;

  const bgColorRgba = isDark
    ? "rgba(24, 24, 27, 0.97)"
    : "rgba(255, 255, 255, 0.92)";

  const handleBack = useCallback(() => {
    // Se veio de link externo (replace), canGoBack() = false ou volta p/ lugar errado
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(main)/(tabs)");
    }
  }, []);

  return (
    <View
      className="flex-1 relative"
      style={{
        backgroundColor: colors.text_gray,
      }}
    >
      <LinearGradient
        colors={[
          bgColorRgba,
          isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.5)",
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* Artwork */}
      <View>
        <TouchableOpacity
          onLongPress={() => handleLyric(currentTrack)}
          delayLongPress={200}
          className="hero-container"
          style={{ height: IMAGE_SIZE_BACKGROUND * 1.1 }}
        >
          {currentTrack.artwork ? (
            <ImageBackground
              source={{ uri: currentTrack.artwork }}
              style={{
                flex: 1,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                overflow: "hidden",
              }}
              contentFit="cover"
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.67)"]}
                style={StyleSheet.absoluteFill}
              />
              {/* Header */}
              <View
                style={{
                  paddingTop: Platform.OS === "ios" ? 56 : 60,
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={handleBack}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    backgroundColor: colors.text_gray,
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={26}
                    color={colors.background}
                  />
                </TouchableOpacity>

                <View className="items-center">
                  <Text className="text-white text-base text-center uppercase tracking-widest font-medium">
                    {t("player.feedback.current")}
                  </Text>
                  <Text className="text-zinc-300 text-base text-center uppercase tracking-widest font-medium">
                    {currentTrack.title || ""}
                  </Text>
                </View>

                {/* placeholder para simetria */}
                <View style={{ width: 40 }} />
              </View>
            </ImageBackground>
          ) : (
            <View
              className="w-full h-full dark:bg-zinc-800 bg-zinc-300 items-center justify-center"
              style={{ borderRadius: 20 }}
            >
              <Music size={80} color={colors.icon} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View className="flex-row justify-between items-center">
        <View className="px-8 mt-8">
          <Text
            className="text text-2xl font-bold"
            numberOfLines={1}
            style={{ letterSpacing: -0.5 }}
          >
            {currentTrack.title}
          </Text>
          <Text className="text text-base mt-1" numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
        <View className="px-8 flex-row gap-3">
          <Button
            onPress={handlePip}
            variant="outline"
            icon={<PictureInPicture size={20} color={colors.icon} />}
          ></Button>
          <Button
            onPress={handleVideoClip}
            variant="outline"
            disabled={true}
            icon={<Clapperboard size={20} color={colors.icon} />}
          />
        </View>
      </View>

      {/* Progress */}
      <View className="px-8 mt-6">
        <Slider
          value={duration > 0 ? position / duration : 0}
          onSlidingComplete={(v) => {
            const val = Array.isArray(v) ? v[0] : v;
            seekTo(val * duration);
          }}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={isDark ? colors.primary : "#000"}
          trackStyle={{ height: 4, borderRadius: 2 }}
          thumbStyle={{ width: 14, height: 14, borderRadius: 7 }}
        />
        <View className="flex-row justify-between mt-1">
          <Text className="dark:text-white/45 text-xs">
            {formatTime(position)}
          </Text>
          <Text className="dark:text-white/45 text-xs">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View className="px-8 mt-6 flex-row items-center justify-between">
        {/* Shuffle */}
        <TouchableOpacity
          onPress={toggleShuffle}
          className="w-11 h-11 items-center justify-center"
        >
          <Ionicons
            name="shuffle"
            size={24}
            color={isShuffle ? colors.primary : colors.primary}
          />
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity
          onPress={skipToPrevious}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="play-skip-back" size={30} color={colors.icon} />
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          onPress={togglePlayPause}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {isBuffering ? (
            <ActivityIndicator size="large" color={colors.background} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color={colors.background}
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          )}
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity
          onPress={skipToNext}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="play-skip-forward" size={30} color={colors.icon} />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          onPress={toggleRepeat}
          className="w-11 h-11 items-center justify-center"
        >
          <Ionicons name={repeatIcon} size={24} color={repeatColor} />
          {repeatMode === RepeatMode.Track && (
            <View
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                backgroundColor: colors.primary,
                width: 8,
                height: 8,
                borderRadius: 4,
              }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
