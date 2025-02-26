
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchActorDetails, fetchActorCredits, getImageUrl } from "@/lib/tmdb";
import { MediaGrid } from "@/components/MediaGrid";

const ActorDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data: actor, isLoading: isLoadingActor } = useQuery({
    queryKey: ["actorDetails", id],
    queryFn: () => fetchActorDetails(id!),
  });

  const { data: credits, isLoading: isLoadingCredits } = useQuery({
    queryKey: ["actorCredits", id],
    queryFn: () => fetchActorCredits(id!),
  });

  if (isLoadingActor || isLoadingCredits) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!actor || !credits) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
            <img
              src={getImageUrl(actor.profile_path, "w500")}
              alt={actor.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{actor.name}</h1>
              <div className="mt-2 text-muted-foreground">
                {actor.known_for_department}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Biography</h2>
              <p className="mt-2 text-lg text-muted-foreground">{actor.biography}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {actor.birthday && (
                <div>
                  <h3 className="font-medium">Birthday</h3>
                  <p className="text-muted-foreground">
                    {new Date(actor.birthday).toLocaleDateString()}
                  </p>
                </div>
              )}
              {actor.place_of_birth && (
                <div>
                  <h3 className="font-medium">Place of Birth</h3>
                  <p className="text-muted-foreground">{actor.place_of_birth}</p>
                </div>
              )}
            </div>

            {credits.cast && credits.cast.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Known For</h2>
                <MediaGrid 
                  items={credits.cast.slice(0, 10)} 
                  type={credits.cast[0].title ? "movie" : "tv"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorDetails;
