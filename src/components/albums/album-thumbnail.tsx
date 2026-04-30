import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/types/colors";
import { CARD_WIDTH, IMAGE_SIZE } from "@/utils/image-types";
import { Image } from "expo-image";
import { Music, Music2 } from "lucide-react-native";
import { memo, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

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

interface AlbumThumbnailProps {
  coverArt?: string | null;
  isDark?: boolean;
  loadingCovers?: boolean;
  isCurrentlyPlaying?: boolean;
  type?: "card" | "list";
  albumId?: string;
}

const AlbumThumbnail = memo(
  ({
    coverArt,
    type = "card",
    loadingCovers,
    isCurrentlyPlaying, // ← Receber a prop
  }: AlbumThumbnailProps) => {
    const source = useMemo(
      () => (coverArt ? { uri: coverArt } : null),
      [coverArt],
    );

    const { colors } = useTheme();

    if (type === "list") {
      return (
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.card,
            position: "relative",
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
          ) : coverArt ? (
            <Image
              source={{ uri: coverArt }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={coverArt!}
            />
          ) : (
            <Placeholder colors={colors} size={40} />
          )}

          {isCurrentlyPlaying && (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 20,
                padding: 4,
              }}
            >
              <Music2 size={16} color={colors.success || "#22c55e"} />
            </View>
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
          position: "relative",
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

        {isCurrentlyPlaying && (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.7)",
              borderRadius: 20,
              padding: 6,
              zIndex: 10,
            }}
          >
            <Music2 size={20} color={colors.success || "#22c55e"} />
          </View>
        )}
      </View>
    );
  },
);
AlbumThumbnail.displayName = "AlbumThumbnail";
export default AlbumThumbnail;
