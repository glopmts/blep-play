import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/types/colors";
import { CARD_WIDTH, IMAGE_SIZE } from "@/utils/image-types";
import { Image } from "expo-image";
import { Music } from "lucide-react-native";
import { memo, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

interface AlbumThumbnailProps {
  coverArt?: string | null;
  isDark?: boolean;
  loadingCovers?: boolean;
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
  ({ coverArt, type = "card", loadingCovers }: AlbumThumbnailProps) => {
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
          ) : coverArt ? (
            <Image
              source={{ uri: coverArt }}
              style={{ width: "100%", height: "100%" }} // <-- Mudança aqui
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={coverArt!}
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
);

AlbumThumbnail.displayName = "AlbumThumbnail";
export default AlbumThumbnail;
