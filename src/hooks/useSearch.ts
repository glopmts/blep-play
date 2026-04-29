import { TrackDetails } from "@/types/interfaces";
import { useCallback, useEffect, useState } from "react";

interface SearchResult {
  song: TrackDetails;
  matchType: "title" | "artist" | "album";
  score: number;
}

export const useSearch = (songs: TrackDetails[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Função de busca otimizada
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      const searchTerm = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      for (const song of songs) {
        let score = 0;
        let matchType: SearchResult["matchType"] = "title";

        // Busca no título (prioridade máxima)
        const titleMatch = song.title?.toLowerCase().includes(searchTerm);
        if (titleMatch) {
          score = 100;
          matchType = "title";
        }
        // Busca no artista
        else if (song.artist?.toLowerCase().includes(searchTerm)) {
          score = 80;
          matchType = "artist";
        }
        // Busca no álbum
        else if (song.album?.toLowerCase().includes(searchTerm)) {
          score = 60;
          matchType = "album";
        }

        if (score > 0) {
          results.push({ song, matchType, score });
        }
      }

      // Ordena por relevância
      results.sort((a, b) => b.score - a.score);

      setSearchResults(results);
      setIsSearching(false);
    },
    [songs],
  );

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    hasResults: searchResults.length > 0,
    resultsCount: searchResults.length,
  };
};
