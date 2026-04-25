import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/utils/formaTS/formatTimeSong";
import { Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Music } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TrackPlayer, { RepeatMode } from "react-native-track-player";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ARTWORK_SIZE = SCREEN_WIDTH - 64;

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
  const [isReady, setIsReady] = useState(false);
  const [hasWaited, setHasWaited] = useState(false);

  const { uri, fileName } = useLocalSearchParams<{
    uri?: string;
    fileName?: string;
  }>();

  useEffect(() => {
    const timer = setTimeout(() => setHasWaited(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!uri) {
      setIsReady(true);
      return;
    }
    const handleDeepLink = async () => {
      const decodedUri = decodeURIComponent(uri);
      const activeTrack = await TrackPlayer.getActiveTrack();
      if (activeTrack?.url === decodedUri) {
        setIsReady(true);
        return;
      }
      await loadExternalTrack(uri, fileName ?? undefined);
      setIsReady(true);
    };
    handleDeepLink().catch(console.error);
  }, [uri]);

  useEffect(() => {
    if (currentTrack) setIsReady(true);
    else if (hasWaited) setIsReady(false);
  }, [currentTrack, hasWaited]);

  if ((!currentTrack || !isReady) && hasWaited) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <Text className="text">Nenhuma música selecionada</Text>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(main)/(tabs)")
          }
          className="mt-4 px-6 py-3 bg-zinc-700 rounded-xl"
        >
          <Text className="text text-lg">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentTrack || !isReady) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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

  return (
    <View
      className="content p-0"
      style={{ flex: 1, paddingBottom: currentTrack?.url ? 100 : 0 }}
    >
      {/* Background artwork blur */}
      {currentTrack.artwork ? (
        <Image
          source={{ uri: currentTrack.artwork as string }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={40}
        />
      ) : (
        <View style={StyleSheet.absoluteFill} className="bg-zinc-300" />
      )}

      <LinearGradient
        colors={[
          bgColorRgba,
          isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.5)",
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: Platform.OS === "ios" ? 56 : 40,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(main)/(tabs)")
          }
          style={{
            backgroundColor: "rgba(255,255,255,0.12)",
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-down" size={22} color={colors.icon} />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="dark:text-white/60 text-xs uppercase tracking-widest font-medium">
            Tocando agora
          </Text>
        </View>

        {/* placeholder para simetria */}
        <View style={{ width: 40 }} />
      </View>

      {/* Artwork */}
      <View
        className="items-center"
        style={{ marginTop: 32, paddingHorizontal: 32 }}
      >
        <View
          style={{
            width: ARTWORK_SIZE,
            height: ARTWORK_SIZE,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 24 },
            shadowOpacity: 0.7,
            shadowRadius: 32,
            elevation: 20,
          }}
        >
          {currentTrack.artwork ? (
            <Image
              source={{ uri: currentTrack.artwork as string }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View
              className="w-full h-full dark:bg-zinc-800 bg-zinc-300 items-center justify-center"
              style={{ borderRadius: 20 }}
            >
              <Music size={80} color={isDark ? "#52525b" : "#a1a1aa"} />
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View className="px-8 mt-8">
        <Text
          className="text text-2xl font-bold"
          numberOfLines={1}
          style={{ letterSpacing: -0.5 }}
        >
          {currentTrack.title}
        </Text>
        <Text className="text-white/55 text-base mt-1" numberOfLines={1}>
          {currentTrack.artist}
        </Text>
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
            color={isShuffle ? colors.primary : "rgba(255,255,255,0.4)"}
          />
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity
          onPress={skipToPrevious}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons
            name="play-skip-back"
            size={30}
            color={isDark ? "#fff" : "#000"}
          />
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
            <ActivityIndicator size="large" color={isDark ? "#fffc" : "#000"} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color={isDark ? "#fffc" : "#000"}
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          )}
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity
          onPress={skipToNext}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons
            name="play-skip-forward"
            size={30}
            color={isDark ? "#fff" : "#000"}
          />
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
