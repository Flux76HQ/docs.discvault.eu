export const siteOrigin = 'https://docs.discvault.eu';
export const socialImageUrl = `${siteOrigin}/brand/discvault-icon.png`;

export const siteLocales = [
  { code: 'en', path: '', languageTag: 'en-US', ogLocale: 'en_US', label: 'English' },
  { code: 'cs', path: 'cs', languageTag: 'cs-CZ', ogLocale: 'cs_CZ', label: 'Čeština' },
  { code: 'da', path: 'da', languageTag: 'da-DK', ogLocale: 'da_DK', label: 'Dansk' },
  { code: 'de', path: 'de', languageTag: 'de-DE', ogLocale: 'de_DE', label: 'Deutsch' },
  { code: 'el', path: 'el', languageTag: 'el-GR', ogLocale: 'el_GR', label: 'Ελληνικά' },
  { code: 'es', path: 'es', languageTag: 'es-ES', ogLocale: 'es_ES', label: 'Español' },
  { code: 'fi', path: 'fi', languageTag: 'fi-FI', ogLocale: 'fi_FI', label: 'Suomi' },
  { code: 'fr', path: 'fr', languageTag: 'fr-FR', ogLocale: 'fr_FR', label: 'Français' },
  { code: 'hu', path: 'hu', languageTag: 'hu-HU', ogLocale: 'hu_HU', label: 'Magyar' },
  { code: 'it', path: 'it', languageTag: 'it-IT', ogLocale: 'it_IT', label: 'Italiano' },
  { code: 'ja', path: 'ja', languageTag: 'ja-JP', ogLocale: 'ja_JP', label: '日本語' },
  { code: 'ko', path: 'ko', languageTag: 'ko-KR', ogLocale: 'ko_KR', label: '한국어' },
  { code: 'nl', path: 'nl', languageTag: 'nl-NL', ogLocale: 'nl_NL', label: 'Nederlands' },
  { code: 'no', path: 'no', languageTag: 'nb-NO', ogLocale: 'nb_NO', label: 'Norsk' },
  { code: 'pl', path: 'pl', languageTag: 'pl-PL', ogLocale: 'pl_PL', label: 'Polski' },
  { code: 'pt', path: 'pt', languageTag: 'pt-PT', ogLocale: 'pt_PT', label: 'Português' },
  { code: 'sv', path: 'sv', languageTag: 'sv-SE', ogLocale: 'sv_SE', label: 'Svenska' },
  { code: 'tr', path: 'tr', languageTag: 'tr-TR', ogLocale: 'tr_TR', label: 'Türkçe' },
  { code: 'uk', path: 'uk', languageTag: 'uk-UA', ogLocale: 'uk_UA', label: 'Українська' },
  { code: 'zh', path: 'zh', languageTag: 'zh-CN', ogLocale: 'zh_CN', label: '中文' },
] as const;

export type SiteLocale = (typeof siteLocales)[number];

export function siteLocaleForPath(pathname: string): SiteLocale {
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  return siteLocales.find((locale) => locale.path === firstSegment) ?? siteLocales[0];
}
