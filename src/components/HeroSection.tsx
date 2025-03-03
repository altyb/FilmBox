import { Movie, TvShow, getImageUrl } from "@/lib/tmdb";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface HeroSectionProps {
  media: Movie | TvShow | (Movie | TvShow)[];
  type: "movie" | "tv";
}

export const HeroSection = ({ media, type }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mediaItems = Array.isArray(media) ? media : [media];
  
  useEffect(() => {
    if (mediaItems.length <= 1) return;
    
    const interval = setInterval(() => {
      // Start fade out
      setIsTransitioning(true);
      
      // After fade out completes, change the slide and start fade in
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
        setIsTransitioning(false);
      }, 500); // Half a second for fade out
      
    }, 5000); // Change to 5 seconds
    
    return () => clearInterval(interval);
  }, [mediaItems.length]);
  
  const currentMedia = mediaItems[currentIndex];
  const title = type === "movie" 
    ? (currentMedia as Movie).title 
    : (currentMedia as TvShow).name;
  const releaseDate = type === "movie" 
    ? (currentMedia as Movie).release_date 
    : (currentMedia as TvShow).first_air_date;

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    
    // Start fade out
    setIsTransitioning(true);
    
    // After fade out completes, change the slide and start fade in
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <div className="relative h-[60vh] w-full overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={getImageUrl(currentMedia.backdrop_path, "original")}
          alt={title}
          className="h-full w-full object-cover"
          key={currentMedia.id}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-8 z-10">
        <div className="mx-auto max-w-7xl">
          <h1 className={`text-4xl font-bold text-foreground md:text-5xl lg:text-6xl transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {title}
          </h1>
          <div className={`mt-4 flex items-center gap-4 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-medium text-foreground">
                {currentMedia.vote_average.toFixed(1)}
              </span>
            </div>
            <span className="text-lg text-foreground/80">
              {new Date(releaseDate).getFullYear()}
            </span>
          </div>
          <p className={`mt-4 max-w-2xl text-lg text-foreground/80 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {currentMedia.overview}
          </p>
          <Link
            to={`/${type}/${currentMedia.id}`}
            className={`mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            View Details
          </Link>
          
          {mediaItems.length > 1 && (
            <div className="mt-6 flex gap-2">
              {mediaItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index === currentIndex ? "bg-primary" : "bg-foreground/30"
                  }`}
                  aria-label={`Show item ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
