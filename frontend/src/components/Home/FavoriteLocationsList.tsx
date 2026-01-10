import { Heart } from "lucide-react";
import {
  Caption,
  Subheadline,
  Title,
} from "@telegram-apps/telegram-ui";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
}

interface FavoriteLocationsListProps {
  favoriteLocations: Location[];
  onLocationClick: (location: Location) => void;
  onToggleFavorite: (locationId: number) => void;
}

export function FavoriteLocationsList({
  favoriteLocations,
  onLocationClick,
  onToggleFavorite,
}: FavoriteLocationsListProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "grocery":
        return "#22c55e";
      case "restaurant-bar":
        return "#f59e0b";
      default:
        return "#6366f1";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "grocery":
        return "🛒";
      case "restaurant-bar":
        return "🍽️";
      default:
        return "🏪";
    }
  };

  return (
    <div
      style={{
        height: "100%",
        backgroundColor: "var(--tg-color-bg)",
        overflow: "auto",
      }}
    >
      {favoriteLocations.length === 0 ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Heart
              size={48}
              style={{
                color: "var(--tg-color-hint-color)",
                margin: "0 auto 1rem auto",
                display: "block",
              }}
            />
            <Title level="2" style={{ marginBottom: "0.5rem" }}>
              No Favorites Yet
            </Title>
            <Caption>
              Explore locations and add them to your favorites to see them here.
            </Caption>
          </div>
        </div>
      ) : (
        <div style={{ padding: "1rem" }}>
          <div style={{ marginBottom: "1rem", padding: "0 0.5rem" }}>
            <Title level="2" style={{ marginBottom: "0.5rem" }}>
              Your Favorites ({favoriteLocations.length})
            </Title>
            <Caption style={{ color: "var(--tg-theme-hint-color)" }}>
              Tap any location to view details, ratings, and comments
            </Caption>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {favoriteLocations.map((location) => (
              <div
                key={location.id}
                style={{
                  backgroundColor: "var(--tg-color-bg-secondary)",
                  borderRadius: "12px",
                  padding: "1rem",
                  border: "1px solid var(--tg-color-separator)",
                  cursor: "pointer",
                }}
                onClick={() => onLocationClick(location)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: getCategoryColor(location.category),
                      borderRadius: "8px",
                      padding: "8px",
                      minWidth: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                    }}
                  >
                    {getCategoryIcon(location.category)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <Subheadline style={{ fontWeight: "600" }}>
                        {location.name}
                      </Subheadline>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('FavoriteLocationsList: Removing favorite for location:', location.id);
                          onToggleFavorite(location.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "4px",
                          cursor: "pointer",
                          fontSize: "16px",
                          pointerEvents: "auto",
                          touchAction: "manipulation",
                        }}
                        title="Remove from favorites"
                      >
                        ❤️
                      </button>
                    </div>

                    {location.description && (
                      <Caption
                        style={{
                          marginBottom: "0.5rem",
                          display: "block",
                        }}
                      >
                        {location.description}
                      </Caption>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: getCategoryColor(location.category),
                          color: "white",
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontWeight: "500",
                        }}
                      >
                        {location.category.replace("-", " ")}
                      </span>

                      <Caption
                        style={{
                          fontSize: "12px",
                          color: "var(--tg-color-hint-color)",
                        }}
                      >
                        {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                      </Caption>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
