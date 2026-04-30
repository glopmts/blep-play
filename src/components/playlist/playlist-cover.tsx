import { useTheme } from "@/context/ThemeContext";
import { useCover } from "@/hooks/use-track-metadata";
import { Image } from "expo-image";
import { ListMusicIcon } from "lucide-react-native";
import { View } from "react-native";

type PlaylistCoverProps = {
  firstSong?: { id: string; filePath: string } | null;
  size?: number;
  className?: string;
  coverArt?: string | null;
};

export function PlaylistCover({
  firstSong,
  size = 80,
  coverArt,
  className = "",
}: PlaylistCoverProps) {
  const { colors } = useTheme();

  const { cover } = useCover(firstSong?.id, firstSong?.filePath);

  const finalCover = coverArt || cover;

  return (
    <View
      className={`rounded-2xl overflow-hidden items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.cardMuted,
      }}
    >
      {finalCover ? (
        <Image
          source={{ uri: finalCover }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <ListMusicIcon
          size={size * 0.25}
          color={colors.icon}
          strokeWidth={1.5}
        />
      )}
    </View>
  );
}
