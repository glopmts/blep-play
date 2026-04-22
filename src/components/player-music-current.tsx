import { usePlayer } from "@/hooks/usePlayer";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { Music } from "lucide-react-native";
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
import { usePlayerHeight } from "../context/player-height-context";
import { useTheme } from "../hooks/useTheme";

const PlayerMusicRecurrent = () => {
  const {
    skipToNext,
    currentTrack,
    isPlaying,
    isBuffering,
    position,
    seekTo,
    duration,
    togglePlayPause,
    skipToPrevious,
    togglePlayStop,
    stopAndClear,
  } = usePlayer();
  const { setPlayerHeight } = usePlayerHeight();
  const { isDark, colors } = useTheme();

  const pathname = usePathname();

  const IS_PAGE = ["player", "details-music", "details-album"];
  const isOnPage = IS_PAGE.some((page) => pathname.includes(page));

  const getBottomValue = () => {
    if (Platform.OS === "ios") return isOnPage ? 40 : 72;
    return isOnPage ? 20 : 65;
  };

  // Shared values para Reanimated
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const dragX = useSharedValue(0);
  const scale = useSharedValue(1);

  const stopAndClearPlayer = () => {
    stopAndClear();
  };

  // Animação de fechar com saída
  const animateClose = () => {
    dragX.value = 0;
    translateY.value = withTiming(100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(stopAndClearPlayer)();
    });
  };

  // Gesto de arrasto horizontal
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Permite arrasto apenas para direita, limitado a 150px
      const newX = Math.min(Math.max(0, event.translationX), 150);
      dragX.value = newX;
    })
    .onEnd((event) => {
      if (event.translationX > 80 && event.velocityX > 300) {
        runOnJS(animateClose)();
      } else {
        // Volta à posição original com spring
        dragX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    })
    .activeOffsetX([10, 10])
    .failOffsetY([-10, 10])
    .minDistance(5);

  // Animações de entrada/saída baseadas na existência da track
  useEffect(() => {
    if (currentTrack) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [!!currentTrack]);

  // Animação de pulsação quando tocando
  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isPlaying]);

  // Estilos animados
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: dragX.value }],
    opacity: opacity.value,
  }));

  const artworkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowColor: isDark ? "#3b82f6" : "#000",
  }));

  if (!currentTrack) return null;

  const bgColor = isDark
    ? "rgba(24, 24, 27, 0.97)"
    : "rgba(255, 255, 255, 0.92)";
  const borderColor = isDark ? "rgba(63,63,70,0.6)" : "rgba(228,228,231,0.8)";
  const titleColor = isDark ? "#ffffff" : "#18181b";
  const artistColor = isDark ? "#a1a1aa" : "#71717a";

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            backgroundColor: bgColor,
            borderTopColor: borderColor,
            position: "absolute",
            bottom: getBottomValue(),
            left: 10,
            right: 10,
            borderRadius: 18,
            borderWidth: StyleSheet.hairlineWidth,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 12,
          },
          containerAnimatedStyle,
        ]}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setPlayerHeight(height);
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.navigate("/player")}
          className="flex-row items-center gap-3 px-3 py-2"
        >
          {/* Artwork com animação de pulsação */}
          <Animated.View style={artworkAnimatedStyle}>
            {currentTrack.artwork ? (
              <Image
                source={{ uri: currentTrack.artwork as string }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#3f3f46" : "#e4e4e7",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Music size={20} color={isDark ? "#a1a1aa" : "#71717a"} />
              </View>
            )}
          </Animated.View>

          {/* Info */}
          <View className="flex-1">
            <Text
              className={`text-1 text-lg truncate w-full ${titleColor}`}
              numberOfLines={1}
            >
              {currentTrack.title}
            </Text>
            <Text
              className={`text-base dark:text-zinc-400 ${artistColor}`}
              numberOfLines={1}
            >
              {currentTrack.artist ?? "Artista desconhecido"}
            </Text>
          </View>

          {/* Controles */}
          <View className="flex-row items-center gap-2 ml-auto">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                skipToPrevious();
              }}
              className="p-2"
              activeOpacity={0.7}
            >
              <Ionicons
                name="play-skip-back"
                size={22}
                color={isDark ? "#ffffff" : "#18181b"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="p-2"
              activeOpacity={0.8}
            >
              {isBuffering ? (
                <Ionicons name="hourglass-outline" size={18} color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color="#fff"
                  style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                skipToNext();
              }}
              className="p-2"
              activeOpacity={0.7}
            >
              <Ionicons
                name="play-skip-forward"
                size={22}
                color={isDark ? "#ffffff" : "#18181b"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

export default PlayerMusicRecurrent;
