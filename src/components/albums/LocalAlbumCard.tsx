import AlbumThumbnail from "@/components/albums/album-thumbnail";
import { AlbumWithDetails } from "@/types/interfaces";
import { memo } from "react";
import { Pressable, Text } from "react-native";

interface LocalAlbumCardProps {
  album: AlbumWithDetails;
  isDark: boolean;
  loadingCovers?: boolean;
  onPress: (a: AlbumWithDetails) => void;
  onLongPress: (a: AlbumWithDetails) => void;
}

const LocalAlbumCard = memo(
  ({
    album,
    isDark,
    loadingCovers,
    onPress,
    onLongPress,
  }: LocalAlbumCardProps) => (
    <Pressable
      onPress={() => onPress(album)}
      onLongPress={() => onLongPress(album)}
      delayLongPress={500}
      style={{ alignItems: "center", gap: 6, marginHorizontal: 8 }}
    >
      <AlbumThumbnail
        coverArt={album.coverArt ?? null}
        isDark={isDark}
        loadingCovers={loadingCovers}
        type="card"
        albumId={album.id}
      />
      <Text
        numberOfLines={1}
        style={{
          marginTop: 6,
          fontWeight: "600",
          fontSize: 13,
          color: isDark ? "#fff" : "#000",
          textAlign: "center",
          width: "100%",
        }}
      >
        {album.title}
      </Text>
      <Text style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}>
        {album.assetCount} {album.assetCount === 1 ? "música" : "músicas"}
      </Text>
    </Pressable>
  ),
);

LocalAlbumCard.displayName = "LocalAlbumCard";
export default LocalAlbumCard;
