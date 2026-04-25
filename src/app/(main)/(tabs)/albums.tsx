import { AlbumsList } from "@/components/album/album-artist-list";
import { AlbumScreen } from "@/components/album/album-card";
import Header from "@/components/header";
import { HeaderPage } from "@/components/hearder-page";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { Album } from "lucide-react-native";
import { View } from "react-native";

const Albums = () => {
  const { isDark } = useTheme();

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />
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
