import { Image } from "expo-image";
import {
  ArrowRightCircle,
  CheckCircle,
  ListMusicIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { Playlists, TrackDetails } from "../types/interfaces";

interface PlaylistSongPickerProps {
  song: TrackDetails | TrackDetails[]; // ← union
  playlists: Playlists[];
  colors: { icon: string; primary: string };
  isDark: boolean;
  onAddSong: (
    playlistId: string,
    song: TrackDetails,
  ) => Promise<Playlists | null>;
  onRemoveSong: (
    playlistId: string,
    songId: string,
  ) => Promise<Playlists | null>;
}

export function PlaylistSongPicker({
  song,
  playlists,
  colors,
  isDark,
  onAddSong,
  onRemoveSong,
}: PlaylistSongPickerProps) {
  const { t } = useTranslation();
  const songs = Array.isArray(song) ? song : [song];

  if (playlists.length === 0) {
    return (
      <View className="items-center flex-1 justify-center px-4">
        <Text className="text text-center text-zinc-300">
          {t("playlist.empty")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-col gap-5 px-4">
      {playlists.map((playlist) => {
        const isInPlaylist = songs.every(
          (s) => playlist.songs?.some((ps) => ps.id === s.id) ?? false,
        );

        return (
          <Pressable
            key={playlist.id}
            className="flex-col flex-1 gap-4 px-4 py-3.5 rounded-2xl dark:bg-zinc-800/70 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200 active:opacity-80"
            onPress={() => {
              if (isInPlaylist) {
                songs.forEach((s) => onRemoveSong(playlist.id, s.id));
              } else {
                songs
                  .filter((s) => !playlist.songs?.some((ps) => ps.id === s.id))
                  .forEach((s) => onAddSong(playlist.id, s));
              }
            }}
          >
            <View className="flex-row gap-4 items-center justify-between">
              <View className="flex-row gap-3 items-center">
                <View className="w-20 h-20 rounded-3xl overflow-hidden dark:bg-zinc-800 bg-zinc-100 items-center justify-center border dark:border-zinc-700 border-zinc-200 shadow-sm">
                  {playlist.coverArt ? (
                    <Image
                      source={{ uri: playlist.coverArt }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <ListMusicIcon
                      size={24}
                      color={colors.icon}
                      strokeWidth={1.5}
                    />
                  )}
                </View>
                <View className="flex-col gap-2">
                  <Text className="text">{playlist.title}</Text>
                  <Text className="text text-base text-zinc-300">
                    Musicas: {playlist.songs?.length ?? 0}
                  </Text>
                </View>
              </View>
              {isInPlaylist ? (
                <CheckCircle size={28} color={colors.primary} />
              ) : (
                <ArrowRightCircle
                  size={28}
                  color={isDark ? "#71717a" : "#a1a1aa"}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
