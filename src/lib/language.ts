import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'ar';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        set({ language });
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', language);
        // Refresh the page to ensure all components update properly
        window.location.reload();
      },
    }),
    {
      name: 'language-store',
    }
  )
);

interface Translations {
  movies: string;
  tvShows: string;
  changeLanguage: string;
  search: string;
  trending: string;
  popular: string;
  topRated: string;
  upcoming: string;
  cast: string;
  similar: string;
  overview: string;
  releaseDate: string;
  rating: string;
  status: string;
  runtime: string;
  genres: string;
  production: string;
  votes: string;
  budget: string;
  revenue: string;
  biography: string;
  birthday: string;
  placeOfBirth: string;
  gender: string;
  acting: string;
  crew: string;
  videos: string;
  seasons: string;
  episodes: string;
  officialWebsite: string;
  minutes: string;
  as: string;
  viewDetails: string;
  searchResults: string;
  loadMore: string;
  noResultsFound: string;
  tryDifferentKeywords: string;
  discoverEntertainment: string;
  searchForFavorites: string;
  searching: string;
  home: string;
  siteName: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    movies: 'Movies',
    tvShows: 'TV Shows',
    changeLanguage: 'عربي',
    search: 'Search',
    trending: 'Trending',
    popular: 'Popular',
    topRated: 'Top Rated',
    upcoming: 'Upcoming',
    cast: 'Cast',
    similar: 'Similar',
    overview: 'Overview',
    releaseDate: 'Release Date',
    rating: 'Rating',
    status: 'Status',
    runtime: 'Runtime',
    genres: 'Genres',
    production: 'Production',
    votes: 'Votes',
    budget: 'Budget',
    revenue: 'Revenue',
    biography: 'Biography',
    birthday: 'Birthday',
    placeOfBirth: 'Place of Birth',
    gender: 'Gender',
    acting: 'Acting',
    crew: 'Crew',
    videos: 'Videos',
    seasons: 'Seasons',
    episodes: 'Episodes',
    officialWebsite: 'Official Website',
    minutes: 'minutes',
    as: 'as',
    viewDetails: 'View Details',
    searchResults: 'Search Results',
    loadMore: 'Load More',
    noResultsFound: 'No results found',
    tryDifferentKeywords: 'Try using different keywords',
    discoverEntertainment: 'Discover Entertainment',
    searchForFavorites: 'Search for your favorite movies and TV shows',
    searching: 'Searching...',
    home: 'Home',
    siteName: 'Reelify'
  },
  ar: {
    movies: 'أفلام',
    tvShows: 'مسلسلات',
    changeLanguage: 'English',
    search: 'بحث',
    trending: 'الرائج',
    popular: 'الأكثر شعبية',
    topRated: 'الأعلى تقييماً',
    upcoming: 'القادمة',
    cast: 'طاقم العمل',
    similar: 'مشابهة',
    overview: 'نظرة عامة',
    releaseDate: 'تاريخ الإصدار',
    rating: 'التقييم',
    status: 'الحالة',
    runtime: 'مدة العرض',
    genres: 'التصنيفات',
    production: 'الإنتاج',
    votes: 'الأصوات',
    budget: 'الميزانية',
    revenue: 'الإيرادات',
    biography: 'السيرة الذاتية',
    birthday: 'تاريخ الميلاد',
    placeOfBirth: 'مكان الميلاد',
    gender: 'الجنس',
    acting: 'التمثيل',
    crew: 'طاقم العمل',
    videos: 'الفيديوهات',
    seasons: 'المواسم',
    episodes: 'الحلقات',
    officialWebsite: 'الموقع الرسمي',
    minutes: 'دقيقة',
    as: 'بدور',
    viewDetails: 'عرض التفاصيل',
    searchResults: 'نتائج البحث',
    loadMore: 'عرض المزيد',
    noResultsFound: 'لا توجد نتائج',
    tryDifferentKeywords: 'جرب استخدام كلمات مختلفة',
    discoverEntertainment: 'اكتشف عالم الترفيه',
    searchForFavorites: 'ابحث عن أفلامك ومسلسلاتك المفضلة',
    searching: 'جاري البحث...',
    home: 'الرئيسية',
    siteName: 'ريليفاي'
  }
};
