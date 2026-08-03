import { en } from "./dictionaries/en";
import { pl } from "./dictionaries/pl";
import type { Locale } from "./types";

export type { Locale, Dictionary } from "./types";
export { LOCALES } from "./types";

const DICTIONARIES: Record<Locale, typeof en> = { en, pl };

export const getDictionary = (locale: Locale) => DICTIONARIES[locale];
