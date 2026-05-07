import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import pt from "./locales/pt";

export const lng = getLocales()[0].languageCode ?? "en";

const resources = {
  en,
  pt,
};

i18n.use(initReactI18next).init({
  resources,
  lng,

  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
