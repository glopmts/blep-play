import { useColorScheme } from "nativewind";

const CORLORS = [];

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
      card: isDark ? "#27272a" : "#ffffff",
      cardMuted: isDark ? "#3f3f46" : "#f4f4f5",
      text: isDark ? "#ffffff" : "#18181b",
      textMuted: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      indicator: isDark ? "#52525b" : "#d4d4d8",
      icon: isDark ? "#a1a1aa" : "#71717a",
      iconActive: isDark ? "#ffffff" : "#18181b",

      // Novas cores para o botão
      primary: isDark ? "#3b82f6" : "#2563eb", // Blue
      secondary: isDark ? "#8b5cf6" : "#7c3aed", // Purple
      success: isDark ? "#10b981" : "#059669", // Green
      danger: isDark ? "#ef4444" : "#dc2626", // Red
      warning: isDark ? "#f59e0b" : "#d97706", // Amber
    },
  };
}
