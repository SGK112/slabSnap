import { en } from './en';
import { es } from './es';

export type Language = 'en' | 'es';

export type TranslationKeys = typeof en;

const translations: Record<Language, TranslationKeys> = {
  en,
  es,
};

export const getTranslation = (lang: Language): TranslationKeys => {
  return translations[lang] || translations.en;
};

export const languages = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' },
};
