import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { View } from "react-native";

const Playlists = () => {
  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <View className="flex-1"></View>
    </LayoutWithHeader>
  );
};

export default Playlists;
