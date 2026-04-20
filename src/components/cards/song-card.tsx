import { SongWithArt } from "@/types/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Music } from "lucide-react-native";
import { memo } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type SongCardProps = {
  song: SongWithArt;
  index: number;
  isDark: boolean;
  loadingCovers: boolean;
  isLoading: boolean;
  loadingSongIndex: number | null;
  isCurrentlyPlaying: boolean;
  handleSongPress: (index: number) => void;
};

const SongCard = memo(
  ({
    song,
    index,
    isDark,
    loadingCovers,
    isCurrentlyPlaying,
    isLoading,
    loadingSongIndex,
    handleSongPress,
  }: SongCardProps) => {
    const formatDuration = (duration?: number) => {
      if (!duration && duration !== 0) return "--:--";
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    {
      isLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" />
      ) : isCurrentlyPlaying ? (
        <Ionicons name="musical-notes" size={16} color="#3b82f6" />
      ) : (
        song.duration && (
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {formatDuration(song.duration)}
          </Text>
        )
      );
    }

    const handleDetailsMusic = (musicId: string) => {
      router.navigate({
        pathname: "/details-music/[id]",
        params: { id: musicId },
      });
    };

    return (
      <TouchableOpacity
        onPress={() => handleSongPress(index)}
        disabled={loadingSongIndex !== null}
        activeOpacity={0.7}
        onLongPress={() => handleDetailsMusic(song.id)}
        className={`card-music ${isCurrentlyPlaying ? "bg-blue-500/10 dark:bg-blue-500/10" : ""}`}
        style={
          isCurrentlyPlaying
            ? {
                borderWidth: 1,
                borderColor: "rgba(59,130,246,0.3)",
                borderRadius: 12,
              }
            : undefined
        }
      >
        {/* Artwork */}
        <View className="bg-zinc-400 dark:bg-zinc-700 w-16 h-16 rounded-lg overflow-hidden">
          {loadingCovers ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator
                size="small"
                color={isDark ? "#fff" : "#3b82f6"}
              />
            </View>
          ) : song.coverArt ? (
            <Image
              source={{ uri: song.coverArt }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "#27272a" : "#e4e4e7",
              }}
            >
              <Music size={24} color={isDark ? "#d4d4d8" : "#27272a"} />
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 ml-3">
          <Text
            className={`text-base font-semibold ${
              isCurrentlyPlaying
                ? "text-blue-500"
                : "text-black dark:text-white"
            }`}
            numberOfLines={1}
          >
            {song.filename?.replace(/\.[^/.]+$/, "") || `Música ${index + 1}`}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {song.genre ?? song.artist ?? "—"}
          </Text>
        </View>

        {/* Indicador tocando */}
        {isCurrentlyPlaying ? (
          <Ionicons name="musical-notes" size={16} color="#3b82f6" />
        ) : (
          song.duration && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatDuration(song.duration)}
            </Text>
          )
        )}
      </TouchableOpacity>
    );
  },
);

export default SongCard;
