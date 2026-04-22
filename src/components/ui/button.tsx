import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface ButtonProps extends TouchableOpacityProps {
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
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
        return {
          backgroundColor: colors.primary,
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
        };
      case "medium":
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
        };
      case "large":
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderRadius: 10,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;

    switch (variant) {
      case "primary":
      case "secondary":
        return "#ffffff";
      case "outline":
      case "ghost":
        return isDark ? colors.text : colors.text;
      default:
        return "#ffffff";
    }
  };

  const getTextSize = (): string => {
    switch (size) {
      case "small":
        return "text-sm";
      case "medium":
        return "text-base";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const getSpinnerColor = (): string => {
    if (variant === "primary" || variant === "secondary") {
      return "#ffffff";
    }
    return isDark ? colors.text : colors.text;
  };

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled || isLoading ? 0.6 : 1,
        },
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && { width: "100%" },
        style as ViewStyle,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size={size === "small" ? 16 : 20}
          color={getSpinnerColor()}
        />
      ) : (
        <>
          {leftIcon && leftIcon}
          <Text
            className={`font-semibold ${getTextSize()}`}
            style={{ color: getTextColor() }}
          >
            {children}
          </Text>
          {rightIcon && rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
