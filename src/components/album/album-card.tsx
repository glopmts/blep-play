import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useAlbum } from "@/hooks/useAlbumLocal";
import { useTheme } from "@/hooks/useTheme";
import { AlbumWithDetails } from "@/types/interfaces";
import { FlashList } from "@shopify/flash-list";
import { router, useNavigation } from "expo-router";
import { Music } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View, ViewToken } from "react-native";
import BottomSheetAlbumDetails from "../bottom-sheet/BottomSheetAlbumDetails";
import SkeletonLoadingAlbum from "../loading-skeleton-album";
import AlbumThumbnail from "./album-thumbnail";

// Componente Card
const AlbumCard = memo(
  ({
    album,
    onPress,
    isDark,
    loadingCovers,
    handleOpenBottomSheet,
  }: {
    album: AlbumWithDetails;
    onPress: (album: AlbumWithDetails) => void;
    isDark: boolean;
    loadingCovers: boolean;
    handleOpenBottomSheet: (album: AlbumWithDetails) => void;
  }) => {
    return (
      <TouchableOpacity
        onPress={() => onPress(album)}
        className="flex-col gap-3 items-center justify-center mb-4 p-3"
        activeOpacity={0.7}
        onLongPress={() => handleOpenBottomSheet(album)}
        delayLongPress={500}
      >
        <AlbumThumbnail
          coverArt={album.coverArt || null}
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
            {album.title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {album.assetCount} {album.assetCount === 1 ? "música" : "músicas"}
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

export const AlbumScreen = ({ title, horizontal = true }: ALlbumScreen) => {
  const {
    albums,
    loading,
    loadingCovers,
    selectAlbum,
    onAlbumsVisible,
    refreshAlbums,
    refreshAllAlbumCovers,
  } = useAlbum();
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();

  useState<AlbumWithDetails | null>(null);
  const { openSheet, closeSheet } = useBottomSheet();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (albums.length > 0) {
        refreshAllAlbumCovers();
      }
    });

    return unsubscribe;
  }, [navigation, albums.length, refreshAllAlbumCovers]);

  const handleOpenBottomSheet = useCallback(
    (album: AlbumWithDetails) => {
      openSheet({
        snapPoints: ["40%"],
        content: (
          <BottomSheetAlbumDetails
            album={album}
            isDark={isDark}
            onClose={closeSheet}
          />
        ),
      });
    },
    [openSheet],
  );

  const handleAlbumPress = (album: AlbumWithDetails) => {
    selectAlbum(album);
    router.navigate({
      pathname: "/details-album/[id]",
      params: { id: album.id, type: "album_local" },
    });
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleIds = viewableItems
        .map((v) => v.item?.id)
        .filter(Boolean) as string[];
      onAlbumsVisible(visibleIds);
    },
    [onAlbumsVisible],
  );

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
            loadingCovers={loadingCovers}
            handleOpenBottomSheet={handleOpenBottomSheet}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4"
        horizontal={horizontal}
        onRefresh={refreshAlbums}
        refreshing={loading}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};
