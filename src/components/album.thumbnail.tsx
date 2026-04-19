import { Image } from "expo-image";
import { Music } from "lucide-react-native";
import { memo, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { CARD_WIDTH, IMAGE_SIZE } from "../utils/image-types";

interface AlbumThumbnailProps {
  coverArt?: string | null;
  isDark: boolean;
  loadingCovers: boolean;
  type?: "card" | "list";
}

const Placeholder = ({ isDark, size }: { isDark: boolean; size: number }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "#27272a" : "#e4e4e7",
    }}
  >
    <Music size={size} color={isDark ? "#d4d4d8" : "#27272a"} />
  </View>
);

const AlbumThumbnail = memo(
  ({ coverArt, isDark, type = "card", loadingCovers }: AlbumThumbnailProps) => {
    // Estabiliza a source — evita recriar objeto a cada render
    const source = useMemo(
      () => (coverArt ? { uri: coverArt } : null),
      [coverArt],
    );

    if (type === "list") {
      return (
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: isDark ? "#27272a" : "#e4e4e7",
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
              <ActivityIndicator
                size="small"
                color={isDark ? "#fff" : "#3b82f6"}
              />
            </View>
          ) : source ? (
            <Image
              source={source}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk" // ← cache agressivo
              recyclingKey={coverArt!} // ← reutiliza célula na FlatList
            />
          ) : (
            <Placeholder isDark={isDark} size={40} />
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
          backgroundColor: isDark ? "#3f3f46" : "#e4e4e7",
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
          <Placeholder isDark={isDark} size={30} />
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
