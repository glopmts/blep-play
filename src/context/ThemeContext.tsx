import { useColorScheme } from "nativewind";
import React, { createContext, ReactNode, useContext } from "react";
import { Colors } from "../types/colors";

interface ThemeContextType {
  isDark: boolean;
  colors: Colors;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors: Colors = {
    background: isDark ? "#0A0A0C" : "#ffffff",
    surface: isDark ? "#1A1C22" : "#F3F4F6",
    card: isDark ? "#2C2C2A" : "#ffffff",
    input: isDark ? "#27272a" : "#f4f4f5",
    cardMuted: isDark ? "#3f3f46" : "#f4f4f5",
    text_gray: isDark ? "#9ca3af" : "#6b7280",
    text: isDark ? "#F2F2F2" : "#18181b",
    textMuted: isDark ? "#9A9AA0" : "rgba(0,0,0,0.5)",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    indicator: isDark ? "#52525b" : "#d4d4d8",
    icon: isDark ? "#a1a1aa" : "#71717a",
    iconActive: isDark ? "#A6FF4D" : "#18181b",
    primary: "#A6FF4D",
    primary_strong: "#8CFF3F",
    secondary: isDark ? "#8b5cf6" : "#7c3aed",
    success: isDark ? "#10b981" : "#059669",
    danger: isDark ? "#ef4444" : "#dc2626",
    danger_v2: isDark ? "#450a0a" : "#fee2e2",
    danger_border: isDark ? "#7f1a1a" : "#fecaca",
    danger_title: isDark ? "#f87171" : "#dc2626",
    warning: isDark ? "#f59e0b" : "#d97706",
    rounded: {
      rounded_md: 6,
      rounded_2xl: 16,
      rounded_3xl: 24,
      rounded_full: "100%",
    },
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
