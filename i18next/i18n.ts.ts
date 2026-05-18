import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import pt from "./locales/pt";

const deviceLang = getLocales()[0].languageCode ?? "en";

export const initI18n = async () => {
  if (i18n.isInitialized) return;

  const savedLang = await AsyncStorage.getItem("@lang");

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: savedLang ?? deviceLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });
};

export default i18n;
