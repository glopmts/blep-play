import SkeletonLoadingAlbum from "@/components/loading-skeleton-album";
import { AlbumWithDetails } from "@/types/interfaces";
import { FlashList } from "@shopify/flash-list";
import { Music } from "lucide-react-native";
import { memo } from "react";
import { Text, View } from "react-native";
import LocalAlbumCard from "./LocalAlbumCard";

interface LocalAlbumsRowProps {
  items: AlbumWithDetails[];
  isDark: boolean;
  loading: boolean;
  loadingCovers?: boolean;
  onPress: (a: AlbumWithDetails) => void;
  onLongPress: (a: AlbumWithDetails) => void;
}

const LocalAlbumsRow = memo(
  ({
    items,
    isDark,
    loading,
    loadingCovers,
    onPress,
    onLongPress,
  }: LocalAlbumsRowProps) => {
    if (loading) {
      return (
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonLoadingAlbum horizontal />
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View style={{ alignItems: "center", padding: 20 }}>
          <Music size={40} color={isDark ? "#d4d4d8" : "#27272a"} />
          <Text style={{ color: "#9ca3af", marginTop: 8, textAlign: "center" }}>
            Nenhum álbum encontrado
          </Text>
        </View>
      );
    }

    return (
      <View style={{ height: 250 }}>
        <FlashList
          data={items}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, gap: 9 }}
          renderItem={({ item }) => (
            <LocalAlbumCard
              album={item}
              isDark={isDark}
              loadingCovers={loadingCovers}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          )}
        />
      </View>
    );
  },
);

LocalAlbumsRow.displayName = "LocalAlbumsRow";
export default LocalAlbumsRow;
