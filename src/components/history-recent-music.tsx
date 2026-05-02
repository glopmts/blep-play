import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { EllipsisVertical, History, Music, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { StoredTrack } from "../database/cache/music-history.cache";
import { useMusicHistory } from "../hooks/useMusicHistory";
import { usePlayer } from "../hooks/usePlayer";
import { storedTracksToSongs } from "../services/storedTrackToSong.service";
import { Colors } from "../types/colors";
import { formatDuration } from "../utils/formaTS/formatTimeSong";
import SkeletonLoadingAlbum from "./loading-skeleton-album";

const Placeholder = ({ isDark, size }: { isDark: boolean; size: number }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "#27272a" : "#e4e4e7",
    }}
  >
    <Music size={size} color={isDark ? "#d4d4d8" : "#27272a"} />
  </View>
);

const RecentCard = ({
  song,
  isDark,
  colors,
  isCurrentlyPlaying,
  handleSongPress,
}: {
  song: StoredTrack;
  isDark: boolean;
  colors: Colors;
  loadingSongIndex: boolean;
  isCurrentlyPlaying: boolean;
  handleSongPress: (song: StoredTrack) => void;
}) => {
  return (
    <View
      className="flex-row items-center justify-between gap-3 py-2 px-3 mt-6 border-b border-zinc-200/10"
      style={
        isCurrentlyPlaying
          ? {
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.3)",
              borderRadius: 12,
              opacity: 0.7,
              shadowColor: colors.card,
              boxShadow: colors.cardMuted,
            }
          : undefined
      }
    >
      <TouchableOpacity className="" onPress={() => handleSongPress(song)}>
        <View className="flex-row gap-3 ">
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: colors.cardMuted,
            }}
          >
            {song.artwork ? (
              <Image
                source={{ uri: song.artwork }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk" // ← cache agressivo
                recyclingKey={song.artwork!} // ← reutiliza célula na FlatList
              />
            ) : (
              <Placeholder isDark={isDark} size={24} />
            )}
          </View>
          <View className="flex-col">
            <Text
              className="text text-xl truncate"
              numberOfLines={1}
              style={{
                width: 300,
              }}
            >
              {song.title}
            </Text>
            <Text className="text-xs text-zinc-400" numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <View className="flex-row gap-2 items-center">
        {isCurrentlyPlaying ? (
          <Ionicons name="musical-notes" size={16} color="#3b82f6" />
        ) : (
          song.duration && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatDuration(song.duration)}
            </Text>
          )
        )}
        <EllipsisVertical size={24} color={isDark ? "#a1a1aa" : "#000000"} />
      </View>
    </View>
  );
};

const HistoryRecentMusic = () => {
  const { recents, loading, reload, clearRecents } = useMusicHistory();
  const { currentTrack, playSongs, togglePlayPause } = usePlayer();
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);
  const { isDark, colors } = useTheme();

  const handleSongPress = useCallback(
    async (index: number, songId: string) => {
      if (!recents.length || loadingSongIndex !== null) return;
      setLoadingSongIndex(index);
      try {
        if (currentTrack?.id === songId) {
          await togglePlayPause();
        } else {
          const songs = storedTracksToSongs(recents);
          await playSongs(songs, index);
        }
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [recents, playSongs, loadingSongIndex, currentTrack, togglePlayPause],
  );

  if (loading) {
    return (
      <View className="">
        <SkeletonLoadingAlbum horizontal={true} />
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row justify-between gap-3 items-center">
        <View className="flex-row gap-3 items-center">
          <View
            className="items-center justify-center p-3"
            style={{
              borderRadius: colors.rounded.rounded_2xl,
            }}
          >
            <Text>
              <History size={24} color={colors.icon} />
            </Text>
          </View>
          <Text className="text">Músicas Recente</Text>
          <Text className="text-xs text-zinc-400">({recents.length})</Text>
        </View>
        <TouchableOpacity
          onPress={clearRecents}
          className="btn-delete p-3 bg-red-500/60"
        >
          <Trash2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {recents.length === 0 ? (
        <View className="mt-8 items-center justify-center">
          <View
            className="items-center justify-center p-6"
            style={{
              borderRadius: colors.rounded.rounded_3xl,
              backgroundColor: colors.cardMuted,
            }}
          >
            <Text>
              <History size={40} color={colors.icon} />
            </Text>
          </View>
          <Text className="text text-lg text-zinc-400 mt-3">
            Nenhuma música recente.
          </Text>
          <TouchableOpacity
            className="btn mt-4 border dark:border-zinc-600"
            onPress={() => reload()}
          >
            {loading ? (
              <ActivityIndicator size={20} color={colors.iconActive} />
            ) : (
              <Text className="text-white text-xl">Recarregar pagina</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isCurrentlyPlaying = currentTrack?.id === item.id;
            return (
              <RecentCard
                song={item}
                isCurrentlyPlaying={isCurrentlyPlaying}
                colors={colors}
                isDark={isDark}
                handleSongPress={() => handleSongPress(index, item.id)}
                loadingSongIndex={loadingSongIndex !== null}
              />
            );
          }}
          refreshing={loading}
          horizontal={false}
          numColumns={1}
          showsHorizontalScrollIndicator={false}
          onRefresh={() => reload()}
          contentContainerClassName="gap-4"
          contentContainerStyle={{
            paddingBottom: 80,
            paddingTop: 8,
          }}
        />
      )}
    </View>
  );
};

export default HistoryRecentMusic;
