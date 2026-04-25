import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ButtonProps extends PressableProps {
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = ({
  isLoading,
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) => {
  const { isDark, colors } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return { backgroundColor: colors.primary };
      case "secondary":
        return { backgroundColor: colors.secondary };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "ghost":
        return { backgroundColor: colors.border };
      case "danger":
        return {
          backgroundColor: colors.danger_v2,
          borderWidth: 1,
          borderColor: colors.danger_border,
        };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 };
      case "medium":
        return { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14 };
      case "large":
        return { paddingHorizontal: 22, paddingVertical: 16, borderRadius: 16 };
      default:
        return { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14 };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case "primary":
        return "#0A0A0C";
      case "secondary":
        return "#ffffff";
      case "danger":
        return colors.danger_title;
      case "outline":
      case "ghost":
        return colors.text;
      default:
        return "#0A0A0C";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return 13;
      case "medium":
        return 15;
      case "large":
        return 17;
      default:
        return 15;
    }
  };

  const getSpinnerColor = (): string => {
    if (variant === "primary") return "#0A0A0C";
    if (variant === "secondary") return "#ffffff";
    if (variant === "danger") return colors.danger_title;
    return colors.text;
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 22;
      default:
        return 20;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: leftIcon || rightIcon ? "space-between" : "center",
          gap: 10,
          opacity: disabled || isLoading ? 0.5 : pressed ? 0.75 : 1,
        },
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && { width: "100%" },
        style as ViewStyle,
      ]}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size={getIconSize()} color={getSpinnerColor()} />
      ) : (
        <>
          {leftIcon || rightIcon ? (
            <>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                {leftIcon && leftIcon}
                <Text
                  style={{
                    color: getTextColor(),
                    fontSize: getTextSize(),
                    fontWeight: "500",
                  }}
                >
                  {children}
                </Text>
              </View>
              {rightIcon && rightIcon}
            </>
          ) : (
            <Text
              style={{
                color: getTextColor(),
                fontSize: getTextSize(),
                fontWeight: "500",
              }}
            >
              {children}
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
};

export default Button;
