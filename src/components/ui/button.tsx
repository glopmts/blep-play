import { useTheme } from "@/hooks/useTheme";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "outline"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonRadius = "md" | "2xl" | "3xl" | "full";

interface ButtonProps {
  onPress?: () => void;
  onLongPress?: () => void;
  label?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  disabled?: boolean;
  isLoading?: boolean;
  flex?: number;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  onLongPress,
  label,
  icon,
  iconPosition = "right",
  variant = "primary",
  size = "md",
  radius = "2xl",
  disabled = false,
  isLoading = false,
  flex,
  fullWidth = false,
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const backgroundColors: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    outline: "transparent",
    ghost: "transparent",
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: "#0A0A0C",
    secondary: "#ffffff",
    danger: "#ffffff",
    success: "#ffffff",
    warning: "#0A0A0C",
    outline: colors.text,
    ghost: colors.text,
  };

  const borderColors: Record<ButtonVariant, string> = {
    primary: "transparent",
    secondary: "transparent",
    danger: "transparent",
    success: "transparent",
    warning: "transparent",
    outline: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
    ghost: "transparent",
  };

  const paddings: Record<ButtonSize, { vertical: number; horizontal: number }> =
    {
      sm: { vertical: 8, horizontal: 14 },
      md: { vertical: 13, horizontal: 18 },
      lg: { vertical: 17, horizontal: 24 },
    };

  const fontSizes: Record<ButtonSize, number> = {
    sm: 13,
    md: 15,
    lg: 17,
  };

  const iconSizes: Record<ButtonSize, number> = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const radiusMap: Record<ButtonRadius, number | string> = {
    md: colors.rounded.rounded_md,
    "2xl": colors.rounded.rounded_2xl,
    "3xl": colors.rounded.rounded_3xl,
    full: 999,
  };

  const bg = backgroundColors[variant];
  const textColor = textColors[variant];
  const borderColor = borderColors[variant];
  const pad = paddings[size];
  const fontSize = fontSizes[size];
  const borderRadius = radiusMap[radius] as number;
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" ? 1 : 0,
          borderRadius,
          paddingVertical: pad.vertical,
          paddingHorizontal: pad.horizontal,
          opacity: isDisabled ? 0.5 : 1,
          flex: flex ?? undefined,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" || variant === "warning"
              ? "#0A0A0C"
              : "#ffffff"
          }
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <View style={{ marginRight: label ? 6 : 0 }}>{icon}</View>
          )}
          {label && (
            <Text
              style={{
                color: textColor,
                fontSize,
                fontWeight: "600",
              }}
            >
              {label}
            </Text>
          )}
          {icon && iconPosition === "right" && (
            <View style={{ marginLeft: label ? 6 : 0 }}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
