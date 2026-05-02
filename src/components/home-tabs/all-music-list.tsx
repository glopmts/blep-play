import { useLibrarySettingsContext } from "@/context/LibrarySettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useMusics } from "@/hooks/music-hooks/useAllMusics";
import { usePlayer } from "@/hooks/usePlayer";
import { memo, useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import SongCard from "../cards/song-card";

const AllMusicList = () => {
  const { activePaths, ready } = useLibrarySettingsContext();

  const { musics, loading, error, isRefresh, reload } = useMusics(
    ready ? activePaths : null,
  );

  const { colors, isDark } = useTheme();
  const { currentTrack, playSongs } = usePlayer();
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);

  const handleSongPress = useCallback(
    async (index: number) => {
      if (!musics || loadingSongIndex !== null) return;
      setLoadingSongIndex(index);
      try {
        await playSongs(musics, index);
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [musics, playSongs, loadingSongIndex],
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {loading ? (
        <View className="flex-1">
          <ActivityIndicator size={28} color={colors.iconActive} />
        </View>
      ) : (
        <>
          <View className="pb-4 p-4">
            <Text className="text text-xl">Todas as musicas</Text>
            <Text className="text text-zinc-400 text-base">
              Total musicas: {musics.length || 0}
            </Text>
          </View>
          <FlatList
            data={musics}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const isCurrentlyPlaying = currentTrack?.id === item.id;

              return (
                <View className="px-4" key={item.id}>
                  <SongCard
                    song={item}
                    index={index}
                    isDark={isDark}
                    isLoading={loadingSongIndex === index}
                    loadingSongIndex={loadingSongIndex}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                    loadingCovers={loading}
                    handleSongPress={handleSongPress}
                  />
                </View>
              );
            }}
            horizontal={false}
            numColumns={1}
            refreshing={isRefresh}
            showsHorizontalScrollIndicator={false}
            onRefresh={() => reload()}
            contentContainerClassName="gap-4"
            contentContainerStyle={{
              paddingBottom: 80,
              paddingTop: 8,
            }}
          />
        </>
      )}
    </View>
  );
};

export default memo(AllMusicList);
