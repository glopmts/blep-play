import SongCard from "@/components/cards/song-card";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Text, View } from "react-native";
import ActivityIndicatorCustom from "./activityIndicator-Custom";

interface SearchResultsProps {
  results: any[];
  onSongPress: (index: number) => void;
  loadingSongIndex: number | null;
  isDark: boolean;
  loadingCovers: boolean;
  currentTrackId?: string;
  isSearching: boolean;
  searchQuery: string;
}

const SearchResults = ({
  results,
  onSongPress,
  loadingSongIndex,
  isDark,
  loadingCovers,
  currentTrackId,
  isSearching,
  searchQuery,
}: SearchResultsProps) => {
  if (isSearching) {
    return <ActivityIndicatorCustom text="Buscando..." />;
  }

  if (searchQuery.length > 0 && results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Ionicons
          name="search-outline"
          size={60}
          color={isDark ? "#52525b" : "#a1a1aa"}
        />
        <Text
          className={`text-lg font-semibold mt-4 ${isDark ? "text-white" : "text-black"}`}
        >
          Nenhum resultado encontrado
        </Text>
        <Text
          className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          Tente buscar por título, artista ou álbum
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.song.id}
      renderItem={({ item, index }) => (
        <View className="px-4">
          <SongCard
            song={item.song}
            index={index}
            isDark={isDark}
            isLoading={loadingSongIndex === index}
            loadingSongIndex={loadingSongIndex}
            isCurrentlyPlaying={currentTrackId === item.song.id}
            loadingCovers={loadingCovers}
            handleSongPress={() => onSongPress(index)}
          />
        </View>
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 160 }}
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={5}
    />
  );
};

export default SearchResults;
