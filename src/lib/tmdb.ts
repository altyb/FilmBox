import axios from 'axios';
import { useLanguageStore } from './language';

const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxNjY1NWNhZmVjNDNmNzU2YmQxYTU2OGJiYmQ0NjdhOCIsIm5iZiI6MTczMjQyNDE1Ni4wNzgsInN1YiI6IjY3NDJiMWRjZjNmMjkxOTEyZTk1M2MzMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ._NQM2KGJu6zikmRdh62hKo8vN9ZZByNPh7LJTVtGujo';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const getLanguageParam = () => {
  const language = useLanguageStore.getState().language;
  return language === 'ar' ? 'ar-SA' : 'en-US';
};

export const tmdbApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
  params: {
    language: getLanguageParam(),
  },
});

export const getImageUrl = (path: string, size: string = 'original') => {
  if (!path) return '/placeholder.svg';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  runtime?: number;
  genres?: { id: number; name: string }[];
}

export interface TvShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  profile_path: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export const fetchTrending = async (mediaType: 'movie' | 'tv' = 'movie') => {
  const response = await tmdbApi.get(`/trending/${mediaType}/day`);
  return response.data.results;
};

export const fetchPopular = async (mediaType: 'movie' | 'tv' = 'movie') => {
  const response = await tmdbApi.get(`/${mediaType}/popular`);
  return response.data.results;
};

export const fetchMediaDetails = async (id: string, mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/${mediaType}/${id}`);
  return response.data;
};

export const fetchMediaCredits = async (id: string, mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/${mediaType}/${id}/credits`);
  return response.data;
};

export const fetchMediaVideos = async (id: string, mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/${mediaType}/${id}/videos`);
  return response.data.results;
};

export const fetchSimilarMedia = async (id: string, mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/${mediaType}/${id}/similar`);
  return response.data.results;
};

export interface Actor {
  id: number;
  name: string;
  biography: string;
  profile_path: string;
  birthday: string;
  place_of_birth: string;
  known_for_department: string;
}

export interface ActorCredits {
  cast: Array<Movie | TvShow>;
}

export const fetchActorDetails = async (id: string) => {
  const response = await tmdbApi.get(`/person/${id}`);
  return response.data;
};

export const fetchActorCredits = async (id: string) => {
  const response = await tmdbApi.get(`/person/${id}/combined_credits`);
  return response.data;
};

export const fetchFromTMDB = async (path: string, params: any) => {
  const response = await tmdbApi.get(path, { params });
  return response.data;
};

export const searchMedia = async (query: string, page: number = 1) => {
  const { results, total_pages } = await fetchFromTMDB("/search/multi", {
    query,
    include_adult: false,
    page,
  });
  
  // Only return movies and tv shows with their media_type
  return {
    results: results
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any) => ({
        ...item,
        // Ensure title is properly mapped for both movies and tv shows
        title: item.media_type === "movie" ? item.title : item.name
      })),
    total_pages
  };
};
