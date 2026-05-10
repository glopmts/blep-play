import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Globe, Moon, Smartphone, Sun } from "lucide-react-native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { SUPPORTED_LANGUAGES } from "../../../../i18next/languages";

type ColorScheme = "system" | "dark" | "light";

const THEME_OPTIONS: { key: ColorScheme; label: string; Icon: any }[] = [
  { key: "system", label: "Sistema", Icon: Smartphone },
  { key: "dark", label: "Dark", Icon: Moon },
  { key: "light", label: "Light", Icon: Sun },
];

function LanguagesContent() {
  const { colors } = useTheme();
  const { i18n: i18nHook } = useTranslation();

  const handleSelect = async (code: string) => {
    await i18nHook.changeLanguage(code);
    await AsyncStorage.setItem("@lang", code);
  };

  return (
    <View className="flex-col gap-2 pt-2">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = i18nHook.language === lang.code;

        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => handleSelect(lang.code)}
            className="flex-row items-center gap-4 p-4 rounded-xl"
            style={{
              backgroundColor: isActive
                ? colors.iconActive + "22"
                : colors.border,
            }}
          >
            <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
            <Text
              className="text text-lg flex-1"
              style={{ color: isActive ? colors.iconActive : colors.text }}
            >
              {lang.label}
            </Text>
            {/* Indicador visual de selecionado */}
            {isActive && (
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.iconActive }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const AppConfigPreferenc = () => {
  const { colors, isDark, colorScheme, setColorScheme } = useTheme();
  const { openSheet } = useBottomSheet();
  const { t, i18n: i18nHook } = useTranslation();

  const handleLanguages = useCallback(() => {
    openSheet({
      snapPoints: ["40%"],
      content: <LanguagesContent />,
    });
  }, [openSheet]);

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <View className="flex-1 p-4">
        <BackButton
          position="relative"
          style={{ paddingTop: 8, paddingHorizontal: 2 }}
        />

        <View className="mt-7 px-3">
          <Text
            className="text text-2xl font-bold"
            style={{ color: colors.text }}
          >
            {t("settings.preferences.title")}
          </Text>
        </View>

        <View className="mt-7 flex-col gap-6">
          {/* ── Tema ── */}
          <View
            className="flex-col gap-4 p-4"
            style={{
              backgroundColor: colors.border,
              borderRadius: colors.rounded.rounded_2xl,
            }}
          >
            <Text
              className="text text-lg font-semibold"
              style={{ color: colors.text }}
            >
              {t("settings.preferences.theme")}
            </Text>

            <View className="flex-row gap-4">
              {THEME_OPTIONS.map(({ key, label, Icon }) => {
                const isActive = colorScheme === key;
                return (
                  <View
                    key={key}
                    className="flex-col gap-2 items-center flex-1"
                  >
                    <TouchableOpacity
                      onPress={() => setColorScheme(key)} // ← implemente no ThemeContext
                      className="w-full h-20 rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: isActive
                          ? colors.iconActive + "33"
                          : colors.indicator_sheet,
                        borderWidth: isActive ? 2 : 0,
                        borderColor: isActive
                          ? colors.iconActive
                          : "transparent",
                      }}
                    >
                      <Icon
                        size={28}
                        color={isActive ? colors.iconActive : colors.text}
                      />
                    </TouchableOpacity>
                    <Text
                      className="text-sm"
                      style={{
                        color: isActive ? colors.iconActive : colors.text_gray,
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Idioma ── */}
          <View className="flex-col gap-3">
            <View className="flex-row gap-3 items-center">
              <Globe size={20} color={colors.icon} />
              <Text
                className="text text-lg font-semibold"
                style={{ color: colors.text }}
              >
                {t("settings.preferences.language")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleLanguages}
              className="flex-row items-center justify-between p-4 rounded-xl"
              style={{ backgroundColor: colors.border }}
            >
              {/* Mostra idioma atual */}
              {(() => {
                const current = SUPPORTED_LANGUAGES.find(
                  (l) => l.code === i18nHook.language,
                );
                return (
                  <>
                    <Text style={{ color: colors.text, fontSize: 16 }}>
                      {current?.flag} {"  "}
                      {current?.label}
                    </Text>
                    <Globe size={18} color={colors.text_gray} />
                  </>
                );
              })()}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LayoutWithHeader>
  );
};

export default AppConfigPreferenc;
