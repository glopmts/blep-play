import SongCard from "@/components/cards/song-card";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FlatList, Text, View } from "react-native";
import { Colors } from "../types/colors";
import ActivityIndicatorCustom from "./activityIndicator-Custom";

interface SearchResultsProps {
  results: any[];
  onSongPress: (index: number) => void;
  loadingSongIndex: number | null;
  loadingCovers: boolean;
  colors: Colors;
  currentTrackId?: string;
  isSearching: boolean;
  searchQuery: string;
}

const SearchResults = ({
  results,
  onSongPress,
  loadingSongIndex,
  loadingCovers,
  currentTrackId,
  colors,
  isSearching,
  searchQuery,
}: SearchResultsProps) => {
  const { t } = useTranslation();

  if (isSearching) {
    return <ActivityIndicatorCustom text={t("search.feedback.loading")} />;
  }

  if (searchQuery.length > 0 && results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Ionicons name="search-outline" size={60} color={colors.input} />
        <Text className={`text-lg font-semibold mt-4 text`}>
          {t("search.feedback.noresult")}
        </Text>
        <Text className={`text-sm mt-2 text-gary`}>
          {t("search.feedback.tips")}
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
