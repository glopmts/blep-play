import { Folder } from "lucide-react-native";
import type { ComponentType } from "react";
import { Text, View } from "react-native";

export function HeaderPage({
  isDark,
  title,
  icon: Icon,
}: {
  isDark: boolean;
  title?: string;
  icon?: ComponentType<{ size: number; color: string }>;
}) {
  const IconComponent = Icon || Folder;

  return (
    <View className="pt-12 pb-4 px-4">
      <View className="flex-row items-center gap-2">
        <IconComponent size={24} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="title text-xl font-bold text-black dark:text-white">
          {title || "Álbuns do Dispositivo"}
        </Text>
      </View>
    </View>
  );
}
