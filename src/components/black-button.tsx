import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, Pressable, View } from "react-native";

export function BackButton({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={{
        padding: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 50,
        position: "absolute",
        zIndex: 100,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={(pressed) => ({
          opacity: pressed ? 0.5 : 1,
          backgroundColor: isDark ? "#27272a" : "#ffffff",
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={isDark ? "#ffffff" : "#27272a"}
        />
      </Pressable>
    </View>
  );
}
