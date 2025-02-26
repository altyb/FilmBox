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
    rating: 'Rating'
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
    rating: 'التقييم'
  }
};
