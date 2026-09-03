import type { Language } from "./language";

/* Arabic with Latin digits on the Gregorian calendar.
 *  - nu-latn: Arabic-Indic numerals are correct Arabic, but every major Arabic
 *    film site sets ratings, years and runtimes in Latin digits, and mixing
 *    them with TMDB's own numbers reads as a bug.
 *  - ca-gregory: plain "ar-SA" defaults to the Islamic calendar, which turned
 *    a 2024 release date into "19 Rabi' II 1446". */
const localeOf = (lang: Language) =>
  lang === "ar" ? "ar-u-nu-latn-ca-gregory" : "en-US";

export const formatDate = (value: string | null | undefined, lang: Language) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(localeOf(lang), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
};

export const formatNumber = (value: number, lang: Language) =>
  new Intl.NumberFormat(localeOf(lang)).format(value);

export const formatCompact = (value: number, lang: Language) =>
  new Intl.NumberFormat(localeOf(lang), { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const formatCurrency = (value: number, lang: Language) =>
  new Intl.NumberFormat(localeOf(lang), {
    style: "currency",
    currency: "USD",
    // "US$120M" in Arabic; the narrow symbol keeps it "$120M"
    currencyDisplay: "narrowSymbol",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);

/** 166 → "2h 46m" (en) / "2س 46د" (ar) */
export const formatRuntime = (minutes: number | null | undefined, lang: Language) => {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hUnit = lang === "ar" ? "س" : "h";
  const mUnit = lang === "ar" ? "د" : "m";
  return [h ? `${h}${hUnit}` : null, m ? `${m}${mUnit}` : null].filter(Boolean).join(" ");
};

export const formatRating = (value: number | null | undefined) =>
  value && value > 0 ? value.toFixed(1) : null;

export const yearFrom = (value: string | null | undefined) =>
  value && value.length >= 4 ? value.slice(0, 4) : null;

/** TMDB returns status as an untranslated English enum on every locale. */
const STATUS_AR: Record<string, string> = {
  Released: "صدر",
  "Post Production": "مرحلة ما بعد الإنتاج",
  "In Production": "قيد الإنتاج",
  Planned: "مخطط له",
  Rumored: "شائعة",
  Canceled: "أُلغي",
  Ended: "انتهى",
  "Returning Series": "مستمر",
  Pilot: "حلقة تجريبية",
};

export const formatStatus = (status: string | undefined, lang: Language) =>
  !status ? null : lang === "ar" ? (STATUS_AR[status] ?? status) : status;

export const formatGender = (gender: number | undefined, lang: Language) => {
  const map: Record<number, [string, string]> = {
    1: ["Female", "أنثى"],
    2: ["Male", "ذكر"],
    3: ["Non-binary", "غير ثنائي"],
  };
  const entry = gender ? map[gender] : undefined;
  return entry ? (lang === "ar" ? entry[1] : entry[0]) : null;
};
