import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { usePlayerStore } from "@/hooks/usePlayerStoreOnline";
import { musicApi } from "@/services/musicApi.service";
import { SearchResults, Track } from "@/types/online-search";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";

export default function SearchScreen() {
  const router = useRouter();
  const { play, playQueue } = usePlayerStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracks" | "artists" | "albums">(
    "tracks",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useTheme();

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await musicApi.search(q.trim());
        setResults(data);
      } catch (error) {
        console.error("Search failed" + error);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handlePlayTrack = (track: Track, allTracks: Track[]) => {
    const idx = allTracks.findIndex((t) => t.id === track.id);
    playQueue(allTracks, idx >= 0 ? idx : 0);
  };

  return (
    <LayoutWithHeader statusBarOpen={false} header={false}>
      <View className="flex-1 items-center justify-center">
        <Text className="text">Em testes...</Text>
      </View>
    </LayoutWithHeader>
  );
}
