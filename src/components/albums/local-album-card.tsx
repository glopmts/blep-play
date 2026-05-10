import AlbumThumbnail from "@/components/albums/album-thumbnail";
import { AlbumInterface } from "@/types/interfaces";
import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAlbumCover } from "../../hooks/albums-hooks/useAlbumCover";

const AlbumCard = memo(
  ({
    album,
    onPress,
    loadingCovers,
    isCurrentlyPlaying,
    handleOpenBottomSheet,
  }: {
    album: AlbumInterface;
    onPress: (album: AlbumInterface) => void;
    loadingCovers?: boolean;
    isCurrentlyPlaying?: boolean;
    handleOpenBottomSheet: (album: AlbumInterface) => void;
  }) => {
    const coverUri = useAlbumCover(album.id, album.artworkBase64);

    return (
      <View>
        <TouchableOpacity
          onPress={() => onPress(album)}
          className="flex-col gap-3 items-center justify-center mb-4 p-3"
          activeOpacity={0.7}
          delayLongPress={500}
          onLongPress={() =>
            handleOpenBottomSheet({
              ...album,
              artworkBase64: coverUri,
            })
          }
        >
          <AlbumThumbnail
            coverArt={coverUri}
            loadingCovers={loadingCovers}
            type="card"
            albumId={album.id}
            isCurrentlyPlaying={isCurrentlyPlaying}
          />
          <View className="">
            <Text
              className="text-base w-40 font-semibold text-black dark:text-white mb-1"
              numberOfLines={1}
            >
              {album.album}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

AlbumCard.displayName = "AlbumCard";
export default AlbumCard;
