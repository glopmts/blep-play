import { Image } from "expo-image";
import { History, Music, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useMusicHistory } from "../hooks/useMusicHistory";
import { usePlayer } from "../hooks/usePlayer";
import { StoredTrack } from "../services/music-history.service";
import { storedTracksToSongs } from "../services/storedTrackToSong";
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
  loadingSongIndex,
  handleSongPress,
}: {
  song: StoredTrack;
  isDark: boolean;
  loadingSongIndex: boolean;
  handleSongPress: (index: number) => void;
}) => {
  return (
    <TouchableOpacity
      className="flex-col justify-center gap-3 py-2 px-3 mt-6"
      onPress={() => handleSongPress(0)}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: isDark ? "#27272a" : "#e4e4e7",
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
        <Text className="text text-sm truncate w-28" numberOfLines={1}>
          {song.title}
        </Text>
        <Text className="text-xs text-zinc-400" numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const HistoryRecentMusic = () => {
  const { recents, loading, reload, clearRecents } = useMusicHistory();
  const { currentTrack, playSongs, togglePlayPause } = usePlayer();
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
          <View className="items-center justify-center dark:bg-zinc-800 p-3 rounded-2xl">
            <Text>
              <History size={24} color={isDark ? "#a1a1aa" : "#000000"} />
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
          <View className="items-center justify-center dark:bg-zinc-800 p-6 rounded-3xl">
            <Text>
              <History size={40} color={isDark ? "#a1a1aa" : "#000000"} />
            </Text>
          </View>
          <Text className="text text-lg text-zinc-400">
            Nenhuma música recente.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecentCard
              song={item}
              isDark={isDark}
              handleSongPress={() => handleSongPress(0, item.id)}
              loadingSongIndex={loadingSongIndex !== null}
            />
          )}
          refreshing={loading}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          onRefresh={() => reload()}
          contentContainerClassName="gap-4"
        />
      )}
    </View>
  );
};

export default HistoryRecentMusic;
