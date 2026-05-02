import { useEffect, useRef } from "react";
import { Animated, Dimensions, FlatList, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

interface SkeletonLoadingAlbumProps {
  horizontal?: boolean;
  numberOfItems?: number;
  numColumns?: number;
}

const SkeletonLoadingAlbum = ({
  horizontal = false,
  numberOfItems = 6,
  numColumns = 1,
}: SkeletonLoadingAlbumProps) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const { isDark, colors } = useTheme();

  const backgroundColor = isDark ? "#374151" : "#E5E7EB"; // cinza escuro para dark mode, cinza claro para light mode
  const shimmerColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(255, 255, 255, 0.2)"; // brilho mais sutil para dark mode

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // Calcula a largura do item baseado no número de colunas
  const getItemWidth = () => {
    const containerPadding = 32; // px-4 (16px em cada lado)
    const itemSpacing = 16; // espaço entre itens
    const availableWidth = width - containerPadding;

    if (horizontal) {
      return 128; // largura fixa para horizontal
    }

    // Para grid vertical
    return (availableWidth - itemSpacing * (numColumns - 1)) / numColumns;
  };

  const itemWidth = getItemWidth();

  const SkeletonItem = ({ index }: { index: number }) => {
    // Ajusta a margem baseado no layout
    const isLastInRow = (index + 1) % numColumns === 0;
    const marginRight = horizontal || !isLastInRow ? 16 : 0;

    return (
      <View
        style={{
          width: horizontal ? 128 : itemWidth,
          marginRight: marginRight,
          marginBottom: 16,
          flex: 1,
        }}
      >
        {/* Capa do álbum - altura igual à largura para manter quadrado */}
        <View
          style={{
            width: "100%",
            height: horizontal ? 128 : itemWidth,
            backgroundColor: backgroundColor,
            borderRadius: 8,
            marginBottom: 8,
            overflow: "hidden",
            position: "relative",
          }}
          className="bg-gray-300 dark:bg-zinc-800"
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateX }],
            }}
            className="bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          />
        </View>

        {/* Título */}
        <View
          style={{
            width: "80%",
            height: 12,
            backgroundColor: backgroundColor,
            borderRadius: 4,
            marginBottom: 4,
            overflow: "hidden",
            position: "relative",
          }}
          className="bg-gray-300 dark:bg-gray-700"
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateX }],
            }}
            className="bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          />
        </View>

        {/* Artista */}
        <View
          style={{
            width: "60%",
            height: 8,
            backgroundColor: backgroundColor,
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
          className="bg-gray-300 dark:bg-zinc-800"
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateX }],
            }}
            className="bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          />
        </View>
      </View>
    );
  };

  // Se for horizontal, usa ScrollView
  if (horizontal) {
    return (
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {Array.from({ length: numberOfItems }).map((_, index) => (
          <SkeletonItem key={index} index={index} />
        ))}
      </Animated.ScrollView>
    );
  }

  // Se for grid vertical, usa FlatList com numColumns
  return (
    <FlatList
      data={Array.from({ length: numberOfItems })}
      keyExtractor={(_, index) => index.toString()}
      numColumns={numColumns}
      renderItem={({ index }) => <SkeletonItem index={index} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      columnWrapperStyle={
        numColumns > 1 ? { justifyContent: "space-between" } : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

export default SkeletonLoadingAlbum;
