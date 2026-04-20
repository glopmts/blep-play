import { useAlbumsGrouped } from "@/hooks/useAlbumsGrouped";
import { GroupedAlbum } from "@/types/interfaces";
import { router } from "expo-router";
import { Music } from "lucide-react-native";
import { memo, useCallback, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewToken,
} from "react-native";
import AlbumThumbnail from "../album.thumbnail";
import SkeletonLoadingAlbum from "../loading-skeleton-album";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8; // espaçamento entre os cards
const CARD_WIDTH = width / 2 - CARD_MARGIN * 2; // metade da tela menos as margens

interface AlbumCardProps {
  album: GroupedAlbum;
  onPress: (album: GroupedAlbum) => void;
  isDark: boolean;
  loadingCovers: boolean;
}

const AlbumCard = memo(
  ({ album, onPress, isDark, loadingCovers }: AlbumCardProps) => {
    return (
      <TouchableOpacity
        onPress={() => onPress(album)}
        activeOpacity={0.7}
        style={{
          width: CARD_WIDTH,
          marginHorizontal: CARD_MARGIN,
          marginBottom: 20,
          padding: 10,
        }}
      >
        {/* Container da imagem - quadrado perfeito */}
        <AlbumThumbnail
          coverArt={album.coverArt || null}
          isDark={isDark}
          loadingCovers={loadingCovers}
          type="list"
        />

        {/* Informações do álbum */}
        <View style={{ marginTop: 8, alignItems: "center" }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#fff" : "#000",
              textAlign: "center",
            }}
          >
            {album.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
              marginTop: 2,
            }}
          >
            {album.artistName}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: isDark ? "#6b7280" : "#9ca3af",
              marginTop: 4,
            }}
          >
            {album.assetCount} {album.assetCount === 1 ? "música" : "músicas"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

AlbumCard.displayName = "AlbumCard";

export const AlbumsList = () => {
  const { albums, loading, loadingCovers, refreshAlbums, onAlbumsVisible } =
    useAlbumsGrouped();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleAlbumPress = (album: GroupedAlbum) => {
    router.navigate({
      pathname: "/details-album/[id]",
      params: {
        id: album.id,
        artistName: album.artistName,
        albumTitle: album.title,
        type: "album_artist",
      },
    });
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems
        .map((v) => v.item?.id)
        .filter(Boolean) as string[];
      onAlbumsVisible(ids);
    },
    [onAlbumsVisible],
  );

  if (loading) {
    return (
      <View className="flex-1">
        <SkeletonLoadingAlbum numberOfItems={10} numColumns={2} />
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-5 dark:bg-zinc-900">
        <Music size={50} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="text-center text-gray-500 dark:text-gray-400 mt-3">
          Nenhum álbum encontrado
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={albums}
      renderItem={({ item }) => (
        <AlbumCard
          album={item}
          onPress={handleAlbumPress}
          isDark={isDark}
          loadingCovers={loadingCovers}
        />
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: CARD_MARGIN,
        paddingTop: 16,
        paddingBottom: 32,
      }}
      columnWrapperStyle={{
        justifyContent: "space-between",
      }}
      onRefresh={refreshAlbums}
      refreshing={loading}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
};
