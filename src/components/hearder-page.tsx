import { Folder } from "lucide-react-native";
import type { ComponentType } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../types/colors";

export function HeaderPage({
  isDark,
  title,
  titleAction,
  icon: Icon,
  isAction,
  colors,
  onPress,
}: {
  isDark: boolean;
  isAction?: boolean;
  title?: string;
  titleAction?: string;
  onPress?: () => void;
  colors?: Colors;
  icon?: ComponentType<{ size: number; color: string }>;
}) {
  const IconComponent = Icon || Folder;

  return (
    <View className="pt-12 pb-4 px-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <IconComponent size={24} color={isDark ? "#d4d4d8" : "#27272a"} />
          <Text className="title text-xl font-bold text-black dark:text-white">
            {title || "Álbuns do Dispositivo"}
          </Text>
        </View>
        {isAction && (
          <TouchableOpacity onPress={onPress}>
            <Text
              className="text text-xl"
              style={{
                color: colors?.primary_strong,
              }}
            >
              {titleAction || "Infor"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
