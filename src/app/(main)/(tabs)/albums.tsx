import { AlbumsList } from "@/components/album/album-artist-list";
import { AlbumScreen } from "@/components/album/album-card";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { Folder } from "lucide-react-native";
import { Text, useColorScheme, View } from "react-native";

function HeaderPage({ isDark, title }: { isDark: boolean; title?: string }) {
  return (
    <View className="pt-12 pb-4 px-4">
      <View className="flex-row items-center gap-2">
        <Folder size={24} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="title text-xl font-bold text-black dark:text-white">
          {title || "Álbuns do Dispositivo"}
        </Text>
      </View>
    </View>
  );
}

const Albums = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <LayoutWithHeader>
      <View style={{ flex: 1 }}>
        {/* Cabeçalho fora do FlatList */}
        <HeaderPage isDark={isDark} title="Pastas Dispositivo" />
        <AlbumScreen />

        {/* Apenas a lista de álbuns */}
        <HeaderPage isDark={isDark} title="Albums por Artistas" />
        <AlbumsList />
      </View>
    </LayoutWithHeader>
  );
};

export default Albums;
