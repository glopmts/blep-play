import { AlbumsList } from "@/components/album/album-artist-list";
import { AlbumScreen } from "@/components/album/album-card";
import { HeaderPage } from "@/components/hearder-page";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { Album } from "lucide-react-native";
import { View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

const Albums = () => {
  const { isDark, colors } = useTheme();

  return (
    <LayoutWithHeader>
      <View style={{ flex: 1 }}>
        {/* Cabeçalho fora do FlatList */}
        <HeaderPage isDark={isDark} title="Pastas Dispositivo" />
        <AlbumScreen />

        {/* Apenas a lista de álbuns */}
        <HeaderPage isDark={isDark} title="Albums por Artistas" icon={Album} />
        <AlbumsList />
      </View>
    </LayoutWithHeader>
  );
};

export default Albums;
