export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
