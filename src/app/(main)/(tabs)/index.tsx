import { AlbumScreen } from "@/components/album/album-card";
import Header from "@/components/header";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { View } from "react-native";

const Home = () => {
  return (
    <LayoutWithHeader>
      <Header />

      <View className="flex-1">
        <AlbumScreen />
      </View>
    </LayoutWithHeader>
  );
};

export default Home;
