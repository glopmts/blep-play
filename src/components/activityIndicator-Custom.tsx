import { Image } from "expo-image";
import { FC } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../types/colors";

type IndicadoProps = {
  isImage?: boolean;
  colorsIcon?: Colors;
  text?: string;
};

const ActivityIndicatorCustom: FC<IndicadoProps> = ({
  colorsIcon,
  isImage = false,
  text = "",
}) => {
  const { colors } = useTheme();

  return (
    <View
      className="flex-1 items-center justify-center gap-10"
      style={{
        backgroundColor: colors.background_surface,
      }}
    >
      {isImage && (
        <Image
          source={require("../../assets/images/icon.png")}
          className="w-20 h-20 object-cover rounded-md"
          style={{
            width: 150,
            height: 150,
          }}
        />
      )}
      <ActivityIndicator
        size={36}
        color={colorsIcon ? colors.iconActive : ""}
      />
      {text && <Text className="text text-xl">{text}</Text>}
    </View>
  );
};

export default ActivityIndicatorCustom;
