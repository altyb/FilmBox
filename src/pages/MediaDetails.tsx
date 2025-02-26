import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbApi } from "@/lib/tmdb";
import { useLanguageStore } from "@/lib/language";
import { 
  Star, 
  Film, 
  Tv, 
  User2, 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Heart, 
  Award,
  Building2,
  Globe2,
  ExternalLink,
  DollarSign,
  Users,
  Play
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface MediaDetailsProps {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  tagline?: string;
  overview: string;
  poster_path: string | null;
  profile_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  genres?: { id: number; name: string }[];
  production_companies?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  production_countries?: {
    iso_3166_1: string;
    name: string;
  }[];
  spoken_languages?: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  budget?: number;
  revenue?: number;
  homepage?: string;
  in_production?: boolean;
  languages?: string[];
  networks?: {
    id: number;
    name: string;
    logo_path: string | null;
  }[];
  origin_country?: string[];
  seasons?: {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
    air_date: string;
  }[];
  known_for_department?: string;
  biography?: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  gender?: number;
  also_known_as?: string[];
  known_for?: {
    title?: string;
    name?: string;
    media_type: "movie" | "tv";
  }[];
}

interface Credit {
  id: number;
  name: string;
  character?: string;
  job?: string;
  department?: string;
  profile_path: string | null;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export const MediaDetails = () => {
  const { type, id } = useParams();
  const { language } = useLanguageStore();

  const { data: details } = useQuery<MediaDetailsProps>({
    queryKey: ["media", type, id, language],
    queryFn: async () => {
      const response = await tmdbApi.get(`/${type}/${id}`, {
        params: { language },
      });
      return response.data;
    },
  });

  const { data: credits } = useQuery({
    queryKey: ["credits", type, id, language],
    queryFn: async () => {
      const response = await tmdbApi.get(`/${type}/${id}/${type === "person" ? "combined_credits" : "credits"}`, {
        params: { language },
      });
      return response.data;
    },
    enabled: true,
  });

  const { data: videos } = useQuery({
    queryKey: ["videos", type, id, language],
    queryFn: async () => {
      const response = await tmdbApi.get(`/${type}/${id}/videos`, {
        params: { language },
      });
      return response.data;
    },
    enabled: type !== "person",
  });

  if (!details) return null;

  const isPerson = type === "person";
  const title = details.title || details.name;
  const imagePath = isPerson ? details.profile_path : details.poster_path;
  const backdropPath = details.backdrop_path;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGender = (gender: number) => {
    switch (gender) {
      case 1: return "Female";
      case 2: return "Male";
      case 3: return "Non-binary";
      default: return "Not specified";
    }
  };

  const sortedMovies = isPerson ? credits?.cast?.sort((a, b) => {
    const dateA = new Date(a.release_date || a.first_air_date || "").getTime();
    const dateB = new Date(b.release_date || b.first_air_date || "").getTime();
    return dateB - dateA;
  }) : null;

  const sortedCrew = isPerson ? credits?.crew?.sort((a, b) => {
    const dateA = new Date(a.release_date || a.first_air_date || "").getTime();
    const dateB = new Date(b.release_date || b.first_air_date || "").getTime();
    return dateB - dateA;
  }) : null;

  return (
    <div className="min-h-screen">
      {/* Backdrop Image */}
      {!isPerson && backdropPath && (
        <div className="absolute inset-0 h-[50vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
          <img
            src={`https://image.tmdb.org/t/p/original${backdropPath}`}
            alt={title}
            className="h-full w-full object-cover opacity-30"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-32 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column */}
          <div className="w-full md:w-1/3 space-y-6">
            {/* Poster/Profile Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="shrink-0"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
                {imagePath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${imagePath}`}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {isPerson ? (
                      <User2 className="h-20 w-20 text-foreground/20" />
                    ) : (
                      type === "movie" ? (
                        <Film className="h-20 w-20 text-foreground/20" />
                      ) : (
                        <Tv className="h-20 w-20 text-foreground/20" />
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              {details.vote_average !== undefined && (
                <div className="rounded-lg border bg-card p-4 text-center">
                  <Star className="mx-auto h-6 w-6 text-yellow-500" />
                  <div className="mt-2 text-2xl font-bold">{details.vote_average.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              )}
              {details.vote_count && (
                <div className="rounded-lg border bg-card p-4 text-center">
                  <Users className="mx-auto h-6 w-6 text-primary" />
                  <div className="mt-2 text-2xl font-bold">{formatNumber(details.vote_count)}</div>
                  <div className="text-sm text-muted-foreground">Votes</div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              {details.status && (
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">{details.status}</div>
                </div>
              )}
              {(details.release_date || details.first_air_date) && (
                <div>
                  <div className="text-sm text-muted-foreground">Release Date</div>
                  <div className="font-medium">
                    {new Date(details.release_date || details.first_air_date || "").toLocaleDateString()}
                  </div>
                </div>
              )}
              {(details.runtime || details.episode_run_time?.[0]) && (
                <div>
                  <div className="text-sm text-muted-foreground">Runtime</div>
                  <div className="font-medium">
                    {details.runtime || details.episode_run_time?.[0]} minutes
                  </div>
                </div>
              )}
              {details.genres && (
                <div>
                  <div className="text-sm text-muted-foreground">Genres</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {details.genres.map(genre => (
                      <span key={genre.id} className="rounded-full bg-primary/10 px-2 py-1 text-xs">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {type === "tv" && (
                <>
                  {details.number_of_seasons && (
                    <div>
                      <div className="text-sm text-muted-foreground">Seasons</div>
                      <div className="font-medium">{details.number_of_seasons}</div>
                    </div>
                  )}
                  {details.number_of_episodes && (
                    <div>
                      <div className="text-sm text-muted-foreground">Episodes</div>
                      <div className="font-medium">{details.number_of_episodes}</div>
                    </div>
                  )}
                </>
              )}
              {type === "movie" && (
                <>
                  {details.budget !== undefined && details.budget > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground">Budget</div>
                      <div className="font-medium">{formatCurrency(details.budget)}</div>
                    </div>
                  )}
                  {details.revenue !== undefined && details.revenue > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                      <div className="font-medium">{formatCurrency(details.revenue)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-8">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-4xl font-bold">{title}</h1>
              {isPerson && details.known_for_department && (
                <p className="mt-2 text-xl text-muted-foreground">
                  {details.known_for_department}
                </p>
              )}
            </div>

            {/* Biography/Overview */}
            {(details.biography || details.overview) && (
              <div>
                <h2 className="text-2xl font-semibold mb-3">
                  {isPerson ? "Biography" : "Overview"}
                </h2>
                <p className="text-lg leading-relaxed text-foreground/80">
                  {details.biography || details.overview}
                </p>
              </div>
            )}

            {isPerson ? (
              <>
                {/* Personal Info */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {details.birthday && (
                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Birthday</div>
                      <div className="font-medium">
                        {new Date(details.birthday).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {details.place_of_birth && (
                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Place of Birth</div>
                      <div className="font-medium">{details.place_of_birth}</div>
                    </div>
                  )}
                  {details.gender && (
                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-medium">{getGender(details.gender)}</div>
                    </div>
                  )}
                  {details.popularity && (
                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Popularity</div>
                      <div className="font-medium">{details.popularity.toFixed(1)}</div>
                    </div>
                  )}
                </div>

                {/* Acting Credits */}
                {sortedMovies && sortedMovies.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Acting</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {sortedMovies.slice(0, 6).map((credit) => (
                        <Link
                          key={`${credit.id}-${credit.media_type}`}
                          to={`/${credit.media_type}/${credit.id}`}
                          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                        >
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                            {credit.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                {credit.media_type === "movie" ? (
                                  <Film className="h-6 w-6 text-foreground/30" />
                                ) : (
                                  <Tv className="h-6 w-6 text-foreground/30" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {credit.title || credit.name}
                            </div>
                            {credit.character && (
                              <div className="text-sm text-muted-foreground">
                                as {credit.character}
                              </div>
                            )}
                            <div className="mt-1 text-sm text-muted-foreground">
                              {new Date(credit.release_date || credit.first_air_date || "").getFullYear()}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crew Credits */}
                {sortedCrew && sortedCrew.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Crew</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {sortedCrew.slice(0, 6).map((credit) => (
                        <Link
                          key={`${credit.id}-${credit.media_type}-crew`}
                          to={`/${credit.media_type}/${credit.id}`}
                          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                        >
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                            {credit.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                {credit.media_type === "movie" ? (
                                  <Film className="h-6 w-6 text-foreground/30" />
                                ) : (
                                  <Tv className="h-6 w-6 text-foreground/30" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {credit.title || credit.name}
                            </div>
                            {credit.job && (
                              <div className="text-sm text-muted-foreground">
                                {credit.job}
                              </div>
                            )}
                            <div className="mt-1 text-sm text-muted-foreground">
                              {new Date(credit.release_date || credit.first_air_date || "").getFullYear()}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Videos */}
                {videos?.results && videos.results.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Videos</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {videos.results.slice(0, 4).map(video => (
                        <div key={video.id} className="aspect-video">
                          <iframe
                            className="h-full w-full rounded-lg"
                            src={`https://www.youtube.com/embed/${video.key}`}
                            title={video.name}
                            allowFullScreen
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cast */}
                {credits?.cast && credits.cast.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Cast</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {credits.cast.slice(0, 6).map(person => (
                        <Link
                          key={person.id}
                          to={`/person/${person.id}`}
                          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                        >
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                            {person.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                alt={person.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <User2 className="h-6 w-6 text-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{person.name}</div>
                            {person.character && (
                              <div className="text-sm text-muted-foreground">
                                as {person.character}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Production Info */}
                {details.production_companies && details.production_companies.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Production</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {details.production_companies.map(company => (
                        <div key={company.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                          {company.logo_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                              alt={company.name}
                              className="h-8 w-auto object-contain"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-foreground/30" />
                          )}
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">{company.origin_country}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TV Show Seasons */}
                {type === "tv" && details.seasons && details.seasons.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Seasons</h2>
                    <div className="space-y-4">
                      {details.seasons.map(season => (
                        <div
                          key={season.id}
                          className="flex gap-4 rounded-lg border bg-card p-4"
                        >
                          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md">
                            {season.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${season.poster_path}`}
                                alt={season.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <Tv className="h-8 w-8 text-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{season.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {season.episode_count} Episodes
                              {season.air_date && (
                                <> • {new Date(season.air_date).getFullYear()}</>
                              )}
                            </div>
                            {season.overview && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {season.overview}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                {details.homepage && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    <a
                      href={details.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Official Website
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetails;
