import { useState } from "react";
import {
  Modal,
  List,
  Section,
  Cell,
  Input,
  Button,
} from "@telegram-apps/telegram-ui";
import {
  MapPin,
  Search,
  Heart,
  Navigation,
  Filter,
  X,
} from "lucide-react";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
  is_favorited?: boolean;
  rating?: number;
}

interface SavedLocationsModalProps {
  locations: Location[];
  isOpen: boolean;
  onClose: () => void;
  onLocationClick: (location: Location) => void;
  onToggleFavorite?: (locationId: number) => void;
}

export function SavedLocationsModal({
  locations,
  isOpen,
  onClose,
  onLocationClick,
  onToggleFavorite,
}: SavedLocationsModalProps) {
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
    <Modal
      header={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: "var(--tg-theme-button-color, #0088cc)",
                borderRadius: "12px",
                padding: "8px",
                fontSize: "18px",
                color: "white",
              }}
              aria-hidden="true"
            >
              📍
            </div>
            <div>
              <h2
                id="saved-locations-title"
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "var(--tg-theme-text-color)",
                  margin: 0,
                }}
              >
                Saved Locations
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--tg-theme-hint-color)",
                }}
                aria-live="polite"
              >
                {filteredLocations.length} of {locations.length} locations
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--tg-theme-hint-color)",
            }}
            aria-label="Close saved locations modal"
          >
            <X size={20} />
          </Button>
        </div>
      }
      open={isOpen}
      onOpenChange={onClose}
      aria-labelledby="saved-locations-title"
      aria-describedby="saved-locations-content"
    >
      <div id="saved-locations-content" style={{ padding: "16px", maxHeight: "70vh", overflow: "auto" }}>
        {/* Search Bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <Input
              header="Search locations"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "40px",
              }}
              aria-label="Search saved locations"
            />
            <Search
              size={20}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--tg-theme-hint-color)",
              }}
            />
          </div>
        </div>

        {/* Filter Button */}
        <div style={{ marginBottom: "16px" }}>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters 
                ? "var(--tg-theme-button-color, #0088cc)" 
                : "var(--tg-theme-secondary-bg-color, #f1f3f4)",
              color: showFilters 
                ? "white" 
                : "var(--tg-theme-text-color)",
              border: "none",
              borderRadius: "12px",
              padding: "8px 16px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            aria-expanded={showFilters}
            aria-controls="category-filters"
            aria-label={`${showFilters ? 'Hide' : 'Show'} category filters`}
          >
            <Filter size={16} />
            Filter by Category
          </Button>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div id="category-filters" style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
              role="group"
              aria-label="Category filter options"
            >
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  style={{
                    background: selectedCategory === category.value
                      ? "var(--tg-theme-button-color, #0088cc)"
                      : "var(--tg-theme-secondary-bg-color, #f1f3f4)",
                    color: selectedCategory === category.value
                      ? "white"
                      : "var(--tg-theme-text-color)",
                    border: "none",
                    borderRadius: "20px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  aria-pressed={selectedCategory === category.value}
                  aria-label={`Filter by ${category.label} category`}
                >
                  <span>{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {filteredLocations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
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
          <List>
            <Section>
              {filteredLocations.map((location) => (
                <Cell
                  key={location.id}
                  onClick={() => {
                    onLocationClick(location);
                    onClose();
                  }}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    marginBottom: "8px",
                    background: "var(--tg-theme-secondary-bg-color, #f8f9fa)",
                    border: "1px solid var(--tg-theme-section-separator-color)",
                    cursor: "pointer",
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
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "var(--tg-theme-text-color)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {location.name}
                        </div>
                        {onToggleFavorite && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(location.id);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: location.is_favorited
                                ? "#ef4444"
                                : "var(--tg-theme-hint-color)",
                              cursor: "pointer",
                              padding: "4px",
                              marginLeft: "8px",
                            }}
                          >
                            <Heart
                              size={16}
                              fill={location.is_favorited ? "currentColor" : "none"}
                            />
                          </button>
                        )}
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
                            color: "var(--tg-theme-button-color, #0088cc)",
                          }}
                        >
                          <Navigation size={12} />
                          <span>Navigate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Cell>
              ))}
            </Section>
          </List>
        )}
      </div>
    </Modal>
  );
}