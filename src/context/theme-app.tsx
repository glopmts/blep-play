import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { darkTheme, lightTheme, ThemeColors } from "../types/theme-types";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemColorScheme, setSystemColorScheme] =
    useState<ColorSchemeName | null>(Appearance.getColorScheme() ?? null);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const isDark = React.useMemo(() => {
    if (themeMode === "dark") return true;
    if (themeMode === "light") return false;
    return systemColorScheme === "dark";
  }, [themeMode, systemColorScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
