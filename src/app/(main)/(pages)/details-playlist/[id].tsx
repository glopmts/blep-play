import { BackButton } from "@/components/black-button";
import SongCard from "@/components/cards/song-card";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTheme } from "@/hooks/useTheme";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { ListMusicIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const PlayListDetails = () => {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { playlist } = usePlaylists(id);
  const [isLoading, setLoading] = useState(false);
  const { playSongs, currentTrack } = usePlayer();
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);

  // ── Toca a música clicada abrindo o player
  const handleSongPress = useCallback(
    async (index: number) => {
      if (!playlist?.songs || loadingSongIndex !== null) return; // bloqueia
      setLoadingSongIndex(index);
      try {
        await playSongs(playlist.songs, index);
        // router.navigate({
        //   pathname: "/player",
        // });
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [playlist, playSongs, loadingSongIndex],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size={30} color={isDark ? "#ffff" : "#3b82f6 "} />
      </View>
    );
  }

  return (
    <LayoutWithHeader
      header={false}
      statusBarOpen={false}
      viewPaddingTop="p-0"
      variant="view"
    >
      <View className="flex-1">
        <BackButton isDark={isDark} position="absolute" />
        {playlist?.id ? (
          <View style={{ width: "100%", height: IMAGE_SIZE_BACKGROUND }}>
            {playlist?.coverArt ? (
              <ImageBackground
                source={{ uri: playlist.coverArt }}
                style={{
                  flex: 1,
                  borderBottomEndRadius: 20,
                  borderBottomStartRadius: 20,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.9)"]}
                  style={StyleSheet.absoluteFill}
                />
                {/* Título sobre a imagem */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 24,
                      fontWeight: "700",
                      textShadowColor: "rgba(0,0,0,0.8)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                    numberOfLines={2}
                  >
                    {playlist.title}
                  </Text>
                </View>
              </ImageBackground>
            ) : (
              <View
                className="w-full h-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
                style={{
                  borderBottomEndRadius: 20,
                  borderBottomStartRadius: 20,
                }}
              >
                <View className="dark:bg-zinc-700 p-8 bg-zinc-300 rounded-2xl">
                  <ListMusicIcon
                    size={60}
                    color={isDark ? "#ffffff" : "#27272a"}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text">Playlist não encontrada!</Text>
          </View>
        )}
        <View className="mt-4">
          {playlist?.songs ? (
            playlist?.songs?.map((item, index) => {
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
                    loadingCovers={isLoading}
                    handleSongPress={handleSongPress}
                  />
                </View>
              );
            })
          ) : (
            <View className="flex-1 items-center justify-center mt-6">
              <Text className="text">
                Nenhuma musica encontrada nesta playlist
              </Text>
            </View>
          )}
        </View>
      </View>
    </LayoutWithHeader>
  );
};

export default PlayListDetails;
