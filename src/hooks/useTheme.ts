import { useColorScheme } from "nativewind";

const CORLORS = [];

export interface Colors {
  background: string;
  surface: string;
  card: string;
  cardMuted: string;
  text: string;
  textMuted: string;
  border: string;
  indicator: string;
  icon: string;
  iconActive: string;
  primary: string;
  primary_strong: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  rounded: {
    rounded_md: number;
    rounded_2xl: number;
    rounded_3xl: number;
    rounded_full: string;
  };
}

export function useTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    colorScheme,
    toggleColorScheme,
    setColorScheme,
    // cores prontas para usar em props de libs externas
    colors: {
      background: "#0A0A0C",
      surface: isDark ? "#1A1C22" : "#F3F4F6",
      textSecondary: isDark ? "#F3F4F6" : "#1A1C22",
      card: isDark ? "#27272A" : "#ffffff",
      cardMuted: isDark ? "#3f3f46" : "#f4f4f5",
      text: isDark ? "#F2F2F2" : "#18181b",
      textMuted: isDark ? "#9A9AA0" : "rgba(0,0,0,0.5)",
      border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      indicator: isDark ? "#52525b" : "#d4d4d8",
      icon: isDark ? "#a1a1aa" : "#71717a",
      iconActive: isDark ? "#ffffff" : "#18181b",

      // Novas cores para o botão
      primary: "#A6FF4D",
      primary_strong: "#8CFF3F",
      secondary: isDark ? "#8b5cf6" : "#7c3aed",
      success: isDark ? "#10b981" : "#059669",
      danger: isDark ? "#ef4444" : "#dc2626",
      warning: isDark ? "#f59e0b" : "#d97706",
      rounded: {
        rounded_md: 6,
        rounded_2xl: 16,
        rounded_3xl: 24,
        rounded_full: "100%",
      },
    },
  };
}
