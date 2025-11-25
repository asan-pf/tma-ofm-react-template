import { useState } from "react";
import {
  MapPin,
  Search,
  Filter,
  Navigation,
} from "lucide-react";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
}

interface SavedLocationsViewProps {
  locations: Location[];
  onLocationClick: (location: Location) => void;
  onToggleFavorite: (locationId: number) => void;
  onAddLocationRequest?: () => void;
  canAddLocation?: boolean;
}

export function SavedLocationsView({
  locations,
  onLocationClick,
  onAddLocationRequest,
  canAddLocation = true,
}: SavedLocationsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "grocery":
        return "🛒";
      case "restaurant-bar":
        return "🍽️";
      default:
        return "🏪";
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "grocery":
        return "#10B981";
      case "restaurant-bar":
        return "#F59E0B";
      default:
        return "#8B5CF6";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter locations based on search query and category
  const filteredLocations = locations.filter((location) => {
    const matchesSearch = 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || location.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All", icon: "🏷️" },
    { value: "grocery", label: "Grocery", icon: "🛒" },
    { value: "restaurant-bar", label: "Food & Drink", icon: "🍽️" },
    { value: "other", label: "Other", icon: "🏪" },
  ];

  return (
    <div
      style={{
        height: "100%",
        background: "var(--tg-theme-bg-color)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 16px 16px",
          borderBottom: "1px solid var(--tg-theme-section-separator-color)",
          background: "var(--tg-theme-secondary-bg-color)",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "var(--tg-theme-text-color)",
            margin: "0 0 8px 0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "var(--tg-theme-button-color)",
              borderRadius: "12px",
              padding: "8px",
              fontSize: "18px",
              color: "white",
            }}
          >
            📍
          </div>
          Saved Locations
        </h1>
        <p
          style={{
            color: "var(--tg-theme-hint-color)",
            fontSize: "14px",
            margin: 0,
          }}
        >
          {filteredLocations.length} of {locations.length} locations
        </p>

        {onAddLocationRequest && (
          <div
            style={{
              marginTop: 16,
              padding: "16px",
              borderRadius: 16,
              background: "var(--tg-theme-bg-color)",
              border: "1px dashed var(--tg-theme-section-separator-color)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>Share your favorite place</div>
            <div style={{ fontSize: 13, color: "var(--tg-theme-hint-color)" }}>
              Tap anywhere on the map after clicking the button below to start the form.
            </div>
            <button
              type="button"
              onClick={onAddLocationRequest}
              disabled={!canAddLocation}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: canAddLocation
                  ? "var(--tg-theme-button-color)"
                  : "var(--tg-theme-section-separator-color)",
                color: canAddLocation
                  ? "var(--tg-theme-button-text-color, #fff)"
                  : "var(--tg-theme-hint-color)",
                fontWeight: 600,
                cursor: canAddLocation ? "pointer" : "not-allowed",
              }}
            >
              {canAddLocation ? "Add location" : "Location limit reached"}
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div style={{ padding: "16px" }}>
        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 48px",
              border: "2px solid var(--tg-theme-section-separator-color)",
              borderRadius: "12px",
              background: "var(--tg-theme-bg-color)",
              color: "var(--tg-theme-text-color)",
              fontSize: "16px",
              outline: "none",
            }}
          />
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--tg-theme-hint-color)",
            }}
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters 
              ? "var(--tg-theme-button-color)" 
              : "var(--tg-theme-secondary-bg-color)",
            color: showFilters 
              ? "white" 
              : "var(--tg-theme-text-color)",
            border: "1px solid var(--tg-theme-section-separator-color)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            marginBottom: showFilters ? "16px" : "0",
          }}
        >
          <Filter size={16} />
          Filter by Category
        </button>

        {/* Category Filters */}
        {showFilters && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                style={{
                  background: selectedCategory === category.value
                    ? "var(--tg-theme-button-color)"
                    : "var(--tg-theme-secondary-bg-color)",
                  color: selectedCategory === category.value
                    ? "white"
                    : "var(--tg-theme-text-color)",
                  border: "1px solid var(--tg-theme-section-separator-color)",
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px 16px" }}>
        {filteredLocations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 16px",
              color: "var(--tg-theme-hint-color)",
            }}
          >
            <MapPin
              size={48}
              style={{
                margin: "0 auto 16px",
                opacity: 0.5,
                display: "block",
              }}
            />
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>
              No locations found
            </div>
            <div style={{ fontSize: "14px" }}>
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding some locations to the map"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                onClick={() => onLocationClick(location)}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "var(--tg-theme-secondary-bg-color)",
                  border: "1px solid var(--tg-theme-section-separator-color)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  {/* Category Icon */}
                  <div
                    style={{
                      background: getCategoryColor(location.category),
                      borderRadius: "10px",
                      padding: "8px",
                      fontSize: "16px",
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(location.category)}
                  </div>

                  {/* Location Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--tg-theme-text-color)",
                        marginBottom: "4px",
                      }}
                    >
                      {location.name}
                    </div>

                    {location.description && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--tg-theme-hint-color)",
                          marginBottom: "8px",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {location.description}
                      </div>
                    )}

                    {/* Bottom Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "var(--tg-theme-hint-color)",
                      }}
                    >
                      <div>Added {formatDate(location.created_at)}</div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--tg-theme-button-color)",
                        }}
                      >
                        <Navigation size={12} />
                        <span>Navigate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
