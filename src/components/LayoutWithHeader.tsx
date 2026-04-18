import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import {
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LayoutVariant = "view" | "safeArea";

interface LayoutWithHeaderProps {
  children: ReactNode;
  variant?: LayoutVariant;
  title?: string;
  showBackButton?: boolean;
  rightComponent?: ReactNode;
  headerClassName?: string;
  header?: boolean;
  contentClassName?: string;
  viewPaddingTop?: string;
  statusBarStyle?: "light" | "dark" | "auto";
  statusBarOpen?: boolean;
}

export const LayoutWithHeader = ({
  children,
  variant = "safeArea",
  title,
  showBackButton = false,
  statusBarOpen = true,
  header = true,
  rightComponent,
  headerClassName = "",
  viewPaddingTop = "pt-12",
  contentClassName = "",
  statusBarStyle = "auto",
}: LayoutWithHeaderProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const Container = variant === "safeArea" ? SafeAreaView : View;

  const getStatusBarStyle = () => {
    if (statusBarStyle === "auto") {
      return isDark ? "light-content" : "dark-content";
    }
    return statusBarStyle === "light" ? "light-content" : "dark-content";
  };

  return (
    <>
      {statusBarOpen && (
        <StatusBar
          barStyle={getStatusBarStyle()}
          backgroundColor={isDark ? "#18181b" : "#ffffff"}
          translucent={variant === "view"}
        />
      )}
      <Container
        className={`flex-1 ${isDark ? "bg-zinc-900" : "bg-white"} ${
          variant === "view" ? viewPaddingTop : ""
        }`}
      >
        {/* Header */}
        {header && (
          <View
            className={`flex-row items-center justify-between px-4 py-3 border-b ${
              isDark
                ? "border-zinc-800 bg-zinc-900"
                : "border-gray-200 bg-white"
            } ${headerClassName}`}
          >
            <View className="flex-row items-center flex-1">
              {showBackButton && (
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mr-3 p-1"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={isDark ? "#ffffff" : "#000000"}
                  />
                </TouchableOpacity>
              )}
              {title && (
                <Text
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
            </View>
            {rightComponent && <View>{rightComponent}</View>}
          </View>
        )}

        {/* Content */}
        <View className={`flex-1 ${contentClassName}`}>{children}</View>
      </Container>
    </>
  );
};
