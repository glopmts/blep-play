import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/hooks/useTheme";
import { View } from "react-native";

const Configurations = () => {
  const { isDark } = useTheme();
  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <BackButton isDark={isDark} />
      <View></View>
    </LayoutWithHeader>
  );
};

export default Configurations;
