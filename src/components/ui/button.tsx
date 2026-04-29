import { useTheme } from "@/context/ThemeContext";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

interface ButtonProps extends PressableProps {
  isLoading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
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
  const { colors } = useTheme();

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

  const getTextSize = (): number => {
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

  const getIconSize = (): number => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 22;
      default:
        return 20;
    }
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getTextSize(),
    fontWeight: "500",
  };

  // Função para extrair texto puro do children
  const getTextFromChildren = (node: ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) {
      return node.map(getTextFromChildren).join("");
    }
    if (typeof node === "object" && node !== null && "props" in node) {
      return getTextFromChildren((node as any).props.children);
    }
    return "";
  };

  // Verifica se o children é apenas texto
  const isPlainText = (node: ReactNode): boolean => {
    if (typeof node === "string" || typeof node === "number") return true;
    if (Array.isArray(node)) return node.length === 1 && isPlainText(node[0]);
    return false;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator size={getIconSize()} color={getSpinnerColor()} />
      );
    }

    const hasIcons = leftIcon || rightIcon;
    const isTextOnly = isPlainText(children);

    // Se tem ícones e o children é texto puro, usa a estrutura com ícones
    if (hasIcons && isTextOnly) {
      return (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {leftIcon && leftIcon}
            <Text style={textStyle}>{children}</Text>
          </View>
          {rightIcon && rightIcon}
        </>
      );
    }

    // Se tem ícones mas o children é complexo, renderiza tudo junto
    if (hasIcons && !isTextOnly) {
      return (
        <>
          {leftIcon && leftIcon}
          <View style={{ flex: 1 }}>{children}</View>
          {rightIcon && rightIcon}
        </>
      );
    }

    // Se o children é texto puro, renderiza com Text
    if (isTextOnly) {
      return <Text style={textStyle}>{children}</Text>;
    }

    // Se o children é complexo, renderiza diretamente
    return children;
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
      {renderContent()}
    </Pressable>
  );
};

export default Button;
