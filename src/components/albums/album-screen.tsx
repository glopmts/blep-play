import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useAlbums } from "@/hooks/albums-hooks/useAlbums";
import { useTheme } from "@/hooks/useTheme";
import { AlbumInterface } from "@/types/interfaces";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Music } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BottomSheetAlbumDetails from "../bottom-sheet/BottomSheetAlbumDetails";
import SkeletonLoadingAlbum from "../loading-skeleton-album";
import AlbumCard from "./LocalAlbumCard";

interface ALlbumScreen {
  horizontal?: boolean;
  title?: string;
  initialAlbumsToShow?: number;
}

export const AlbumScreen = ({
  horizontal = true,
  initialAlbumsToShow = 8, // Mostrar apenas 8 álbuns inicialmente
}: ALlbumScreen) => {
  const { albums, loading, refreshing, refresh } = useAlbums();
  const { isDark } = useTheme();
  const [showAllAlbums, setShowAllAlbums] = useState(false);
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
    itemVisiblePercentThreshold: 20,
  }).current;

  // Determinar quais álbuns mostrar baseado no estado
  const displayedAlbums = showAllAlbums
    ? albums
    : albums.slice(0, initialAlbumsToShow);

  const hasMoreAlbums = albums.length > initialAlbumsToShow && !showAllAlbums;

  const ListFooterComponent = () => {
    if (!hasMoreAlbums) return null;

    return (
      <TouchableOpacity
        onPress={() => router.navigate("/(main)/(tabs)/albums")}
        className="items-center justify-center py-8 px-4"
        activeOpacity={0.7}
      >
        <View className="bg-primary-500 dark:bg-primary-400 rounded-lg px-6 py-3">
          <Text className="text font-semibold text-center text-base">
            Ver restante dos álbuns ({albums.length - initialAlbumsToShow}{" "}
            restantes)
          </Text>
        </View>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
          Toque para carregar mais álbuns
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex">
        <SkeletonLoadingAlbum horizontal={horizontal} />
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
    <View>
      <FlashList
        data={displayedAlbums}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            onPress={handleAlbumPress}
            handleOpenBottomSheet={handleOpenBottomSheet}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-4"
        horizontal={horizontal}
        refreshing={refreshing}
        viewabilityConfig={viewabilityConfig}
        onRefresh={refresh}
        showsHorizontalScrollIndicator={false}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={{
          paddingBottom: 120, // Padding extra no final
        }}
      />
    </View>
  );
};
