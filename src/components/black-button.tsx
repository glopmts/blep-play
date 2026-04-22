import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, Pressable, TouchableOpacity, View } from "react-native";

type BackButtonProps = {
  isDark: boolean;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  handleSongPress?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
  isBottomOption?: boolean;
};

export function BackButton({
  children,
  isBottomOption,
  loading,
  isDark,
  handleSongPress,
  position = "absolute",
}: BackButtonProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 50,
        position: position,
        zIndex: 100,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(main)/(tabs)")
        }
        className="dark:bg-zinc-700/50 bg-zinc-300 w-14 h-14 rounded-full items-center justify-center"
      >
        <Ionicons
          name="chevron-back"
          size={29}
          color={isDark ? "#ffffff" : "#27272a"}
        />
      </Pressable>

      {isBottomOption && (
        <TouchableOpacity
          className="z-30 dark:bg-zinc-700/50 bg-zinc-300 w-14 h-14 rounded-full items-center justify-center"
          onPress={handleSongPress}
          disabled={loading}
          activeOpacity={0.85}
        >
          {children}
        </TouchableOpacity>
      )}
    </View>
  );
}
