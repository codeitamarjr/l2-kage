import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/**
 * The site's two languages: English and Brazilian Portuguese. The server picks one per visitor (App\Http\Middleware\
 * SetLocale: the EN | PT switch, else the browser's language) and shares it as the "locale" prop. Text is written
 * in both languages side by side where it is used: t('Map', 'Mapa'), or { en, pt } objects in data files.
 */
export type Locale = 'en' | 'pt_BR';

export type Localized<T = string> = { en: T; pt: T };

export function useLocale(): Locale {
    return usePage<SharedProps>().props.locale === 'pt_BR' ? 'pt_BR' : 'en';
}

/** The text in the visitor's language: t('Map', 'Mapa'). Works with JSX too. */
export function useT() {
    const locale = useLocale();

    return <T>(en: T, pt: T): T => (locale === 'pt_BR' ? pt : en);
}

export const pick = <T>(locale: Locale, text: Localized<T>): T => (locale === 'pt_BR' ? text.pt : text.en);

/** For toLocaleString and Intl: "en-US" or "pt-BR". */
export const languageTag = (locale: Locale): string => (locale === 'pt_BR' ? 'pt-BR' : 'en-US');

/** Playable race names as the server sends them (English) -> Portuguese. */
export const RACE_NAMES_PT: Record<string, string> = {
    Human: 'Humano',
    Elf: 'Elfo',
    'Dark Elf': 'Elfo Negro',
    Orc: 'Orc',
    Dwarf: 'Anão',
    Kamael: 'Kamael',
    Sylph: 'Sylph',
    'High Elf': 'Alto Elfo',
    Unknown: 'Desconhecida',
};

export const raceName = (locale: Locale, race: string): string => (locale === 'pt_BR' ? (RACE_NAMES_PT[race] ?? race) : race);
