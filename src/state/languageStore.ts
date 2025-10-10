import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, getTranslation, TranslationKeys } from '../utils/i18n';

interface LanguageState {
  language: Language;
  translations: TranslationKeys;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      translations: getTranslation('en'),
      setLanguage: (lang: Language) => {
        set({
          language: lang,
          translations: getTranslation(lang),
        });
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
