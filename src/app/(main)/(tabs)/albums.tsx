import AlbumCard from "@/components/albums/LocalAlbumCard";
import BottomSheetAlbumDetails from "@/components/bottom-sheet/BottomSheetAlbumDetails";
import Header from "@/components/header";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import SkeletonLoadingAlbum from "@/components/loading-skeleton-album";
import SearchBar from "@/components/searchBar";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/albums-hooks/useAlbums";
import { AlbumInterface } from "@/types/interfaces";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { usePlayer } from "../../../hooks/usePlayer";
import { Colors } from "../../../types/colors";

type SearchResult = {
  score: number;
  album: AlbumInterface;
};

function getNumColumns(width: number): number {
  if (width < 360) return 1;
  if (width < 480) return 2;
  if (width < 720) return 3;
  return 4;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = getNumColumns(SCREEN_WIDTH);

type RenderItemProps = {
  item: AlbumInterface;
  isCurrentlyPlaying?: boolean;
  onPress: (album: AlbumInterface) => void;
  onLongPress: (album: AlbumInterface) => void;
};

const AlbumItem = memo(
  ({ item, isCurrentlyPlaying, onPress, onLongPress }: RenderItemProps) => (
    <AlbumCard
      album={item}
      isCurrentlyPlaying={isCurrentlyPlaying}
      onPress={onPress}
      handleOpenBottomSheet={onLongPress}
    />
  ),
);

const ListFooterLoader = ({
  isLoading,
  colors,
}: {
  isLoading: boolean;
  colors: Colors;
}) => {
  if (!isLoading) return null;

  return (
    <View className="py-8 items-center justify-center">
      <ActivityIndicator size="large" color={colors?.primary || "#3b82f6"} />
      <Text className="text-gray-500 dark:text-gray-400 mt-2">
        Carregando mais álbuns...
      </Text>
    </View>
  );
};

const Albums = () => {
  const { colors } = useTheme();
  const { openSheet, closeSheet } = useBottomSheet();
  const { albums, loading, refreshing, refresh } = useAlbums();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para paginação/scroll infinito
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [displayedAlbums, setDisplayedAlbums] = useState<AlbumInterface[]>([]);
  const { playSongs, currentTrack } = usePlayer();

  const itemsPerPage = 20; // Quantos itens carregar por vez

  // Ref para cancelar debounce anterior sem re-criar performSearch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtTopRef = useRef(true);
  const scrollOffsetRef = useRef(0);
  const flashListRef = useRef<FlatList<AlbumInterface>>(null);

  const handleOpenBottomSheet = useCallback(
    (album: AlbumInterface) => {
      openSheet({
        snapPoints: ["30%"],
        content: <BottomSheetAlbumDetails album={album} onClose={closeSheet} />,
      });
    },
    [openSheet, closeSheet],
  );

  const handleAlbumPress = useCallback((album: AlbumInterface) => {
    router.navigate({
      pathname: "/details-album/[id]",
      params: { id: album.id },
    });
  }, []);

  const loadMoreAlbums = useCallback(() => {
    if (!hasMoreData || isLoadingMore || refreshing || loading) return;

    const nextPage = currentPage + 1;
    const startIndex = 0;
    const endIndex = nextPage * itemsPerPage;
    const newAlbums = albums.slice(startIndex, endIndex);

    setIsLoadingMore(true);

    setTimeout(() => {
      setDisplayedAlbums(newAlbums);
      setCurrentPage(nextPage);
      setHasMoreData(endIndex < albums.length);
      setIsLoadingMore(false);
    }, 300);
  }, [
    albums,
    currentPage,
    hasMoreData,
    isLoadingMore,
    loading,
    refreshing,
    itemsPerPage,
  ]);

  // Resetar paginação quando os álbuns mudarem
  useEffect(() => {
    if (albums && albums.length > 0) {
      const initialAlbums = albums.slice(0, itemsPerPage);
      setDisplayedAlbums(initialAlbums);
      setCurrentPage(1);
      setHasMoreData(albums.length > itemsPerPage);
    } else {
      setDisplayedAlbums([]);
    }
  }, [albums, itemsPerPage]);

  const performSearch = useCallback(
    (query: string) => {
      const term = query.toLowerCase().trim();

      if (!term) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      const results: SearchResult[] = [];

      for (const album of albums) {
        const titleMatch = album.album?.toLowerCase().includes(term);
        const artistMatch = album.artist?.toLowerCase().includes(term);

        let score = 0;
        if (titleMatch) score += 100;
        if (artistMatch) score += 80;

        if (score > 0) results.push({ album, score });
      }

      results.sort((a, b) => b.score - a.score);
      setSearchResults(results);
      setIsSearching(false);
    },
    [albums],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(searchQuery), 100);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const displayData = useMemo<AlbumInterface[]>(() => {
    if (searchQuery.trim()) return searchResults.map((r) => r.album);
    return displayedAlbums;
  }, [searchQuery, searchResults, displayedAlbums]);

  // Função para detectar quando chegou ao fim da lista
  const handleEndReached = useCallback(() => {
    if (!searchQuery.trim()) {
      loadMoreAlbums();
    }
  }, [loadMoreAlbums, searchQuery]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offsetY;
    isAtTopRef.current = offsetY <= 0;
  }, []);

  const maintainScrollPosition = useCallback(() => {
    if (flashListRef.current && scrollOffsetRef.current > 0) {
      // Pequeno delay para garantir que os dados foram atualizados
      setTimeout(() => {
        flashListRef.current?.scrollToOffset({
          offset: scrollOffsetRef.current,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const currentAlbumName = useMemo(() => {
    return currentTrack?.album || null;
  }, [currentTrack?.album]);

  if (loading) {
    return (
      <LayoutWithHeader header={false} statusBarOpen={false}>
        <Header />

        <View className="">
          <SkeletonLoadingAlbum
            numberOfItems={itemsPerPage}
            numColumns={NUM_COLUMNS}
          />
        </View>
      </LayoutWithHeader>
    );
  }

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />
      <View className="flex-1">
        <View className="pb-5">
          <SearchBar
            colors={colors}
            onClear={clearSearch}
            isSearching={isSearching}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Buscar album, artista..."
          />
        </View>
        <View className="flex-1">
          <FlatList
            ref={flashListRef}
            data={displayData}
            renderItem={({ item }) => {
              const isCurrentlyPlaying = currentAlbumName === item.album;

              return (
                <AlbumItem
                  item={item}
                  isCurrentlyPlaying={isCurrentlyPlaying}
                  onPress={handleAlbumPress}
                  onLongPress={handleOpenBottomSheet}
                />
              );
            }}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            overScrollMode="never"
            refreshing={refreshing}
            onRefresh={() => {
              // Resetar paginação ao refresh
              setCurrentPage(1);
              setHasMoreData(true);
              const initialAlbums = albums.slice(0, itemsPerPage);
              setDisplayedAlbums(initialAlbums);
              refresh();
              maintainScrollPosition();
            }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 80,
              paddingTop: 8,
            }}
            removeClippedSubviews={true} // Remove views fora da tela
            initialNumToRender={NUM_COLUMNS * 2} // Quantos itens renderizar inicialmente
            maxToRenderPerBatch={NUM_COLUMNS * 3} // Máximo por lote
            updateCellsBatchingPeriod={50} // Tempo entre atualizações
            windowSize={5} // Tamanho da janela de renderização
            disableVirtualization={false} // Mantém virtualização
            decelerationRate="normal" // Velocidade de desaceleração
            scrollEventThrottle={16} // Frequência de eventos de scroll (60fps)
            onScroll={handleScroll} // Monitorar scroll
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3} // Carrega quando faltar 30% para o fim
            ListFooterComponent={
              !searchQuery.trim()
                ? () => (
                    <ListFooterLoader
                      isLoading={isLoadingMore}
                      colors={colors}
                    />
                  )
                : undefined
            }
            extraData={[searchQuery, refreshing]}
          />
        </View>
      </View>
    </LayoutWithHeader>
  );
};

export default memo(Albums);
