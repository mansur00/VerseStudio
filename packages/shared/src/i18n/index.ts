import { en, Translations } from './en';
import { bn } from './bn';

export { en, bn };
export type { Translations };

export const translations: Record<'en' | 'bn', Translations> = {
  en,
  bn,
};

export function getTranslation(lang: 'en' | 'bn' = 'en'): Translations {
  return translations[lang] || translations.en;
}
