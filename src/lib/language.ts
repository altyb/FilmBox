import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "ar";

const en = {
  brand: "Reelify",
  tagline: "A projection booth for everything worth watching",

  home: "Home",
  movies: "Films",
  tvShows: "Series",
  search: "Search",
  watchlist: "My Reel",
  people: "People",

  toggleTheme: "Toggle theme",
  toggleLanguage: "Switch to Arabic",
  menu: "Menu",
  close: "Close",

  nowShowing: "Now showing",
  trendingFilms: "Trending films",
  trendingSeries: "Trending series",
  popular: "Popular",
  topRated: "Top rated",
  upcoming: "Upcoming",
  nowPlaying: "In cinemas",
  onTheAir: "On the air",
  airingToday: "Airing today",
  viewAll: "View all",

  filters: "Filters",
  genre: "Genre",
  allGenres: "All genres",
  sortBy: "Sort",
  year: "Year",
  anyYear: "Any year",
  minRating: "Min. rating",
  any: "Any",
  clearFilters: "Clear",
  results: "results",
  loadMore: "Load more",
  loading: "Loading",
  endOfList: "That's the whole reel",

  sortPopular: "Most popular",
  sortRating: "Highest rated",
  sortNewest: "Newest first",
  sortRevenue: "Biggest earners",
  sortTitle: "A – Z",

  overview: "Synopsis",
  cast: "Cast",
  crew: "Crew",
  director: "Director",
  creator: "Creator",
  writer: "Writer",
  watchTrailer: "Watch trailer",
  noTrailer: "No trailer available",
  trailer: "Trailer",
  moreLikeThis: "More like this",
  recommended: "Recommended",
  seasons: "Seasons",
  season: "Season",
  episodes: "episodes",
  episode: "Episode",
  runtime: "Runtime",
  status: "Status",
  released: "Released",
  firstAired: "First aired",
  budget: "Budget",
  revenue: "Revenue",
  originalLanguage: "Original language",
  studios: "Studios",
  network: "Network",
  homepage: "Official site",
  whereToWatch: "Where to watch",
  stream: "Stream",
  rent: "Rent",
  buy: "Buy",
  providersRegion: "Availability shown for",
  addToList: "Add to my reel",
  inList: "On my reel",
  stills: "Stills",
  rating: "Rating",
  votes: "votes",
  minutes: "min",
  as: "as",
  untranslated: "No Arabic synopsis on TMDB — showing the English one.",

  biography: "Biography",
  born: "Born",
  died: "Died",
  knownFor: "Known for",
  filmography: "Filmography",
  actingCredits: "Acting",
  crewCredits: "Crew",
  noBiography: "No biography on file.",

  searchPlaceholder: "Search films, series, people…",
  searchHint: "Press / to search",
  all: "All",
  searching: "Searching…",
  resultsFor: "Results for",
  startTyping: "Start typing to search the archive",
  noResults: "Nothing in the archive matches that",
  tryDifferent: "Try a different title, name or spelling.",

  emptyList: "Your reel is empty",
  emptyListHint: "Add films and series and they'll be waiting here.",
  remove: "Remove",

  somethingWentWrong: "The projector jammed",
  errorHint: "We couldn't reach TMDB. Check your connection and try again.",
  retry: "Try again",
  notFound: "This reel doesn't exist",
  notFoundHint: "The page you asked for isn't in the archive.",
  backHome: "Back to the lobby",

  poweredBy: "Film and series data from",
  scrollLeft: "Scroll left",
  scrollRight: "Scroll right",
} as const;

type Dict = typeof en;

const ar: Record<keyof Dict, string> = {
  brand: "ريلِفاي",
  tagline: "غرفة عرض لكل ما يستحق المشاهدة",

  home: "الرئيسية",
  movies: "أفلام",
  tvShows: "مسلسلات",
  search: "بحث",
  watchlist: "قائمتي",
  people: "أشخاص",

  toggleTheme: "تبديل المظهر",
  toggleLanguage: "التبديل إلى الإنجليزية",
  menu: "القائمة",
  close: "إغلاق",

  nowShowing: "يُعرض الآن",
  trendingFilms: "أفلام رائجة",
  trendingSeries: "مسلسلات رائجة",
  popular: "الأكثر مشاهدة",
  topRated: "الأعلى تقييماً",
  upcoming: "قريباً",
  nowPlaying: "في الصالات",
  onTheAir: "قيد العرض",
  airingToday: "تُعرض اليوم",
  viewAll: "عرض الكل",

  filters: "تصفية",
  genre: "التصنيف",
  allGenres: "كل التصنيفات",
  sortBy: "الترتيب",
  year: "السنة",
  anyYear: "كل السنوات",
  minRating: "أقل تقييم",
  any: "الكل",
  clearFilters: "مسح",
  results: "نتيجة",
  loadMore: "عرض المزيد",
  loading: "جاري التحميل",
  endOfList: "انتهت القائمة",

  sortPopular: "الأكثر رواجاً",
  sortRating: "الأعلى تقييماً",
  sortNewest: "الأحدث أولاً",
  sortRevenue: "الأعلى إيراداً",
  sortTitle: "أ – ي",

  overview: "القصة",
  cast: "طاقم التمثيل",
  crew: "فريق العمل",
  director: "إخراج",
  creator: "من ابتكار",
  writer: "كتابة",
  watchTrailer: "مشاهدة الإعلان",
  noTrailer: "لا يوجد إعلان متاح",
  trailer: "الإعلان",
  moreLikeThis: "أعمال مشابهة",
  recommended: "مقترح لك",
  seasons: "المواسم",
  season: "الموسم",
  episodes: "حلقة",
  episode: "الحلقة",
  runtime: "المدة",
  status: "الحالة",
  released: "تاريخ العرض",
  firstAired: "أول عرض",
  budget: "الميزانية",
  revenue: "الإيرادات",
  originalLanguage: "اللغة الأصلية",
  studios: "شركات الإنتاج",
  network: "الشبكة",
  homepage: "الموقع الرسمي",
  whereToWatch: "أين تشاهده",
  stream: "بث",
  rent: "تأجير",
  buy: "شراء",
  providersRegion: "التوفر معروض لـ",
  addToList: "أضف إلى قائمتي",
  inList: "في قائمتي",
  stills: "لقطات",
  rating: "التقييم",
  votes: "صوت",
  minutes: "دقيقة",
  as: "بدور",
  untranslated: "لا توجد قصة بالعربية على TMDB — هذه النسخة الإنجليزية.",

  biography: "السيرة الذاتية",
  born: "الميلاد",
  died: "الوفاة",
  knownFor: "اشتهر بـ",
  filmography: "الأعمال",
  actingCredits: "تمثيل",
  crewCredits: "فريق العمل",
  noBiography: "لا توجد سيرة ذاتية.",

  searchPlaceholder: "ابحث عن أفلام أو مسلسلات أو أشخاص…",
  searchHint: "اضغط / للبحث",
  all: "الكل",
  searching: "جاري البحث…",
  resultsFor: "نتائج البحث عن",
  startTyping: "ابدأ الكتابة للبحث في الأرشيف",
  noResults: "لا توجد نتائج مطابقة",
  tryDifferent: "جرّب عنواناً أو اسماً أو تهجئة مختلفة.",

  emptyList: "قائمتك فارغة",
  emptyListHint: "أضف الأفلام والمسلسلات وستجدها هنا.",
  remove: "إزالة",

  somethingWentWrong: "تعطّل جهاز العرض",
  errorHint: "تعذّر الوصول إلى TMDB. تحقق من اتصالك وحاول مجدداً.",
  retry: "إعادة المحاولة",
  notFound: "هذه الصفحة غير موجودة",
  notFoundHint: "الصفحة المطلوبة ليست في الأرشيف.",
  backHome: "العودة إلى الرئيسية",

  poweredBy: "بيانات الأفلام والمسلسلات من",
  scrollLeft: "تمرير لليسار",
  scrollRight: "تمرير لليمين",
};

export const translations: Record<Language, Record<keyof Dict, string>> = { en, ar };

interface LanguageState {
  language: Language;
  setLanguage: (l: Language) => void;
}

export const applyDocumentLanguage = (language: Language) => {
  const el = document.documentElement;
  el.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  el.setAttribute("lang", language);
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      /* No page reload. Every query key carries the language, so React Query
       * refetches on its own — the old store called window.location.reload(). */
      setLanguage: (language) => {
        applyDocumentLanguage(language);
        set({ language });
      },
    }),
    {
      name: "reelify-language",
      onRehydrateStorage: () => (state) => {
        if (state) applyDocumentLanguage(state.language);
      },
    },
  ),
);

/** The one hook every component uses: `const { t, lang, isRtl } = useT()`. */
export const useT = () => {
  const language = useLanguageStore((s) => s.language);
  return {
    t: translations[language],
    lang: language,
    isRtl: language === "ar",
  };
};
