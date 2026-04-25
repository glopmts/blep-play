import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Platform,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

type BackButtonProps = {
  /** Posição CSS do container. "absolute" flutua sobre o conteúdo; "relative" empurra o layout. */
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  /** Exibe um botão extra no lado direito (ex: opções, menu, etc.) */
  rightAction?: React.ReactNode;
  /** Handler do botão extra direito */
  onRightActionPress?: () => void;
  /** Desabilita o botão extra direito */
  rightActionDisabled?: boolean;
  /** @deprecated use rightAction + onRightActionPress */
  children?: React.ReactNode;
  /** @deprecated use rightAction */
  isBottomOption?: boolean;
  /** @deprecated use onRightActionPress */
  handleSongPress?: () => void;
  /** @deprecated */
  loading?: boolean;
  /** @deprecated não tem efeito */
  isDark?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BackButton({
  position = "absolute",
  rightAction,
  onRightActionPress,
  rightActionDisabled,
  // legado
  children,
  isBottomOption,
  handleSongPress,
  loading,
  style,
}: BackButtonProps) {
  const { isDark, colors } = useTheme();

  const showRight = rightAction ?? (isBottomOption ? children : undefined);
  const rightHandler = onRightActionPress ?? handleSongPress;
  const rightDisabled = rightActionDisabled ?? loading;

  return (
    <View
      style={[
        {
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 60 : 50,
          position: position,
          zIndex: 100,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(main)/(tabs)")
        }
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.card,
          opacity: 0.7,
        }}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={isDark ? colors.text : colors.text}
        />
      </TouchableOpacity>

      {showRight && (
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.07)",
          }}
          onPress={rightHandler}
          disabled={rightDisabled}
          activeOpacity={0.7}
        >
          {showRight}
        </TouchableOpacity>
      )}
    </View>
  );
}
