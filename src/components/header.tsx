import { Image } from "expo-image";
import { Text, View } from "react-native";

const Header = () => {
  return (
    <View className="w-full p-5">
      <View className="flex items-center justify-between flex-row">
        <View className="flex flex-col gap-3">
          <Text className="font-semibold text-3xl text-white">Home</Text>
          <Text className="flex flex-wrap text-zinc-400 text-xl">
            Controle suas musicas em unico lugar!
          </Text>
        </View>
        <Image
          source={require("../../assets/images/icon.png")}
          className="object-cover rounded-md"
          style={{
            width: 75,
            height: 75,
          }}
        />
      </View>
    </View>
  );
};

export default Header;
