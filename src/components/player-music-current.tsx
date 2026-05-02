import { usePlayer } from "@/hooks/usePlayer";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { Music, X } from "lucide-react-native";
import { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { usePlayerHeight } from "../context/player-height-context";
import { useTheme } from "../context/ThemeContext";

const PLAYER_PAGES = ["player", "details-music", "details-album"];

const PlayerMusicRecurrent = () => {
  const {
    skipToNext,
    currentTrack,
    isPlaying,
    isBuffering,
    position,
    duration,
    togglePlayPause,
    skipToPrevious,
    stopAndClear,
  } = usePlayer();

  const { setPlayerHeight } = usePlayerHeight();
  const { isDark, colors } = useTheme();
  const pathname = usePathname();

  const isOnPage = PLAYER_PAGES.some((page) => pathname.includes(page));

  const getBottomValue = () => {
    if (Platform.OS === "ios") return isOnPage ? 40 : 72;
    return isOnPage ? 20 : 85;
  };

  // ─── Animated values
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const dragX = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // ─── Atualiza progress bar
  useEffect(() => {
    if (duration > 0) {
      progressWidth.value = withTiming((position / duration) * 100, {
        duration: 500,
      });
    }
  }, [position, duration]);

  const stopAndClearPlayer = () => stopAndClear();

  const animateClose = () => {
    dragX.value = withTiming(200, { duration: 180 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(stopAndClearPlayer)();
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      dragX.value = Math.min(Math.max(0, e.translationX), 200);
    })
    .onEnd((e) => {
      if (e.translationX > 80 && e.velocityX > 200) {
        scheduleOnRN(animateClose);
      } else {
        dragX.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    })
    .activeOffsetX([10, 10])
    .failOffsetY([-10, 10])
    .minDistance(5);

  // ─── Entrada / saída
  useEffect(() => {
    if (currentTrack) {
      dragX.value = withSpring(0, { damping: 18, stiffness: 180 }); // ← reseta posição
      translateY.value = withSpring(0, { damping: 18, stiffness: 130 });
      opacity.value = withTiming(1, { duration: 280 });
    } else {
      translateY.value = withTiming(100, { duration: 220 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [!!currentTrack]);

  // ─── Pulsação do ícone de música
  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 250 });
    }
  }, [isPlaying]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: dragX.value }],
    opacity: opacity.value,
  }));

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!currentTrack || pathname.includes("player")) return null;

  // ─── Cores por tema
  const bg = isDark ? "rgba(18, 18, 22, 0.96)" : "rgba(252, 252, 253, 0.96)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const titleColor = isDark ? "#F4F4F5" : "#18181B";
  const subtitleColor = isDark ? "#71717A" : "#A1A1AA";
  const accentColor = "#A6FF4D";
  const trackBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const btnBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: getBottomValue(),
            left: 12,
            right: 12,
            borderRadius: 20,
            backgroundColor: bg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor,
            overflow: "hidden",
            elevation: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 24,
          },
          containerStyle,
        ]}
        onLayout={(e) => setPlayerHeight(e.nativeEvent.layout.height)}
      >
        {/* Progress bar — topo do card */}
        <View
          style={{
            height: 2,
            backgroundColor: trackBg,
            width: "100%",
          }}
        >
          <Animated.View
            style={[
              {
                height: 2,
                backgroundColor: accentColor,
                borderRadius: 1,
              },
              progressStyle,
            ]}
          />
        </View>

        {/* Conteúdo principal */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.navigate("/player")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          {/* Artwork */}
          <Animated.View style={artworkStyle}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: isDark ? "#27272A" : "#E4E4E7",
              }}
            >
              {currentTrack.artwork ? (
                <Image
                  source={{ uri: currentTrack.artwork as string }}
                  style={{ width: 46, height: 46 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Music size={18} color={subtitleColor} />
                </View>
              )}
            </View>

            {/* Indicador de playing */}
            {isPlaying && (
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: accentColor,
                  borderWidth: 1.5,
                  borderColor: bg,
                }}
              />
            )}
          </Animated.View>

          {/* Info */}
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: titleColor,
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {currentTrack.title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: subtitleColor,
                fontWeight: "400",
              }}
              numberOfLines={1}
            >
              {currentTrack.artist ?? "Artista desconhecido"}
            </Text>
          </View>

          {/* Controles */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            {/* Anterior */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                skipToPrevious();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: btnBg,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-back" size={16} color={subtitleColor} />
            </TouchableOpacity>

            {/* Play / Pause — botão principal */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                zIndex: 100,
                backgroundColor: accentColor,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              {isBuffering ? (
                <Ionicons name="hourglass-outline" size={16} color="#000" />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color="#000"
                  style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
              )}
            </TouchableOpacity>

            {/* Próximo */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                skipToNext();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: btnBg,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="play-skip-forward"
                size={16}
                color={subtitleColor}
              />
            </TouchableOpacity>

            {/* Fechar */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                animateClose();
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 2,
              }}
              activeOpacity={0.6}
            >
              <X size={14} color={subtitleColor} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

export default PlayerMusicRecurrent;
