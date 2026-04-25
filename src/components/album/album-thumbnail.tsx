import { Image } from "expo-image";
import { Music } from "lucide-react-native";
import { memo, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Colors } from "../../types/colors";
import { CARD_WIDTH, IMAGE_SIZE } from "../../utils/image-types";

interface AlbumThumbnailProps {
  coverArt?: string | null;
  isDark?: boolean;
  loadingCovers: boolean;
  type?: "card" | "list";
  albumId?: string;
}

const Placeholder = ({ colors, size }: { colors: Colors; size: number }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    }}
  >
    <Music size={size} color={colors.primary} />
  </View>
);

const AlbumThumbnail = memo(
  ({
    coverArt,
    type = "card",
    loadingCovers,
    albumId,
  }: AlbumThumbnailProps) => {
    // Estabiliza a source — evita recriar objeto a cada render
    const source = useMemo(
      () => (coverArt ? { uri: coverArt } : null),
      [coverArt],
    );
    const { colors, isDark } = useTheme();

    if (type === "list") {
      return (
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.card,
          }}
        >
          {loadingCovers && !coverArt ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="small" color={colors.iconActive} />
            </View>
          ) : source ? (
            <Image
              source={source}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk" // ← cache agressivo
              recyclingKey={albumId} // ← reutiliza célula na FlatList
            />
          ) : (
            <Placeholder colors={colors} size={40} />
          )}
        </View>
      );
    }

    return (
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_WIDTH,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.card,
        }}
      >
        {source ? (
          <Image
            source={source}
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={coverArt!}
          />
        ) : (
          <Placeholder colors={colors} size={30} />
        )}
      </View>
    );
  },
  // Re-renderiza só se a capa ou o tema mudarem
  (prev, next) =>
    prev.coverArt === next.coverArt &&
    prev.isDark === next.isDark &&
    prev.loadingCovers === next.loadingCovers,
);

AlbumThumbnail.displayName = "AlbumThumbnail";
export default AlbumThumbnail;
