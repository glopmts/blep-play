import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useAlbumCover } from "@/hooks/albums-hooks/useAlbumCover";
import { useAlbums } from "@/hooks/useAlbums";
import { useTheme } from "@/hooks/useTheme";
import { AlbumInterface } from "@/types/interfaces";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Music } from "lucide-react-native";
import React, { memo, useCallback, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BottomSheetAlbumDetails from "../bottom-sheet/BottomSheetAlbumDetails";
import SkeletonLoadingAlbum from "../loading-skeleton-album";
import AlbumThumbnail from "./album-thumbnail";

const AlbumCard = memo(
  ({
    album,
    onPress,
    isDark,
    loadingCovers,
    handleOpenBottomSheet,
  }: {
    album: AlbumInterface;
    onPress: (album: AlbumInterface) => void;
    isDark: boolean;
    loadingCovers?: boolean;
    handleOpenBottomSheet: (album: AlbumInterface) => void;
  }) => {
    const coverUri = useAlbumCover(album.id, album.artworkBase64);

    return (
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
          isDark={isDark}
          loadingCovers={loadingCovers}
          type="card"
          albumId={album.id}
        />
        <View className="">
          <Text
            className="text-base font-semibold text-black dark:text-white mb-1"
            numberOfLines={1}
          >
            {album.album}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

AlbumCard.displayName = "AlbumCard";

interface ALlbumScreen {
  horizontal?: boolean;
  title?: string;
}

export const AlbumScreen = ({ horizontal = true }: ALlbumScreen) => {
  const { albums, loading, refreshing, refresh } = useAlbums();
  const { isDark } = useTheme();

  useState<AlbumInterface | null>(null);
  const { openSheet, closeSheet } = useBottomSheet();

  const handleOpenBottomSheet = useCallback(
    (album: AlbumInterface) => {
      openSheet({
        snapPoints: ["40%"],
        content: <BottomSheetAlbumDetails album={album} onClose={closeSheet} />,
      });
    },
    [openSheet],
  );

  const handleAlbumPress = (album: AlbumInterface) => {
    router.navigate({
      pathname: "/details-album/[id]",
      params: { id: album.id },
    });
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20, // 20% do item visível já conta
  }).current;

  if (loading) {
    return (
      <View className="flex">
        <SkeletonLoadingAlbum horizontal={true} />
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <Music size={50} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="text-center text-gray-500 dark:text-gray-400 mt-3">
          Nenhum álbum encontrado com músicas
        </Text>
      </View>
    );
  }

  return (
    <View className="">
      {/* Lista de Álbuns */}
      <FlashList
        data={albums}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            onPress={handleAlbumPress}
            isDark={isDark}
            handleOpenBottomSheet={handleOpenBottomSheet}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4"
        horizontal={horizontal}
        refreshing={loading}
        viewabilityConfig={viewabilityConfig}
        onRefresh={refresh}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};
