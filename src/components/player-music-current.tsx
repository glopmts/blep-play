import { usePlayer } from "@/hooks/usePlayer";
import { Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { Music } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { usePlayerHeight } from "../context/player-height-context";
import { formatTime } from "../utils/formaTS/formatTimeSong";

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
  } = usePlayer();
  const { setPlayerHeight } = usePlayerHeight();
  const isDark = useColorScheme() === "dark";
  const pathname = usePathname();

  const IS_PAGE = ["player", "details-music", "details-album"];
  const isOnPage = IS_PAGE.some((page) => pathname.includes(page));

  const getBottomValue = () => {
    if (Platform.OS === "ios") return isOnPage ? 40 : 72;
    return isOnPage ? 20 : 65;
  };

  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleStopPlayer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      togglePlayStop();
    });
  };

  useEffect(() => {
    if (currentTrack) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [!!currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying]);

  if (!currentTrack) return null;

  const bgColor = isDark
    ? "rgba(24, 24, 27, 0.97)"
    : "rgba(255, 255, 255, 0.92)";
  const borderColor = isDark ? "rgba(63,63,70,0.6)" : "rgba(228,228,231,0.8)";
  const titleColor = isDark ? "#ffffff" : "#18181b";
  const artistColor = isDark ? "#a1a1aa" : "#71717a";

  return (
    <Animated.View
      style={[
        {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          transform: [{ translateY }],
          opacity,
          position: "absolute",
          bottom: getBottomValue(),
          left: 10,
          right: 10,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          overflow: "hidden",
          // Sombra
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 12,
        },
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
        {/* Artwork */}
        <Animated.View
          style={[
            {
              transform: [{ scale: pulseAnim }],
              shadowColor: isDark ? "#3b82f6" : "#000",
            },
          ]}
        >
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
          {/* Previous */}
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
          {/* Play / Pause */}
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

          {/* Next */}
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
        {/* Progress */}
      </TouchableOpacity>
      <View className="p-4">
        <View>
          <Slider
            value={duration > 0 ? position / duration : 0}
            onSlidingComplete={(v) => {
              const val = Array.isArray(v) ? v[0] : v;
              seekTo(val * duration);
            }}
            minimumValue={0}
            maximumValue={1}
            animateTransitions={true}
            minimumTrackTintColor="#3b82f6"
            thumbTintColor={isDark ? "#3b82f6" : "#000"}
            trackStyle={{ height: 4, borderRadius: 2 }}
            thumbStyle={{ width: 14, height: 14, borderRadius: 7 }}
            thumbImage={
              currentTrack.artwork
                ? { uri: currentTrack.artwork as string }
                : undefined
            }
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
      </View>
    </Animated.View>
  );
};

export default PlayerMusicRecurrent;
