import { Folder } from "lucide-react-native";
import { Text, useColorScheme, View } from "react-native";
import { AlbumsList } from "../../components/album-artist-list";
import { AlbumScreen } from "../../components/album-card";
import { LayoutWithHeader } from "../../components/LayoutWithHeader";

function HeaderPage({ isDark, title }: { isDark: boolean; title?: string }) {
  return (
    <View className="pt-12 pb-4 px-4">
      <View className="flex-row items-center gap-2">
        <Folder size={24} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="title">{title || "Álbuns do Dispositivo"}</Text>
      </View>
    </View>
  );
}

const Albums = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <LayoutWithHeader>
      <View className="flex-1">
        <View>
          <HeaderPage isDark={isDark} title="Pastas Dispositivo" />
          <AlbumScreen />
        </View>

        <View>
          <AlbumsList />
        </View>
      </View>
    </LayoutWithHeader>
  );
};

export default Albums;
