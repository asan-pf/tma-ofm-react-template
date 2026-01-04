import { MapPin, Heart, User, Search, Bookmark } from "lucide-react";
import { CategoryFilters } from "./CategoryFilters";

interface HomeHeaderProps {
  activeTab: "explore" | "favorites" | "saved";
  setActiveTab: (tab: "explore" | "favorites" | "saved") => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
  selectedCategories?: string[];
  onCategoryToggle?: (category: string) => void;
}

export function HomeHeader({
  activeTab,
  setActiveTab,
  onProfileClick,
  onSearchClick,
  selectedCategories = [],
  onCategoryToggle = () => {},
}: HomeHeaderProps) {
  const tabButton = (tab: HomeHeaderProps["activeTab"], label: string, Icon: typeof MapPin) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`map-header-tab${isActive ? " is-active" : ""}`}
      >
        <Icon size={16} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="map-header">
      <div className="map-header-bar">
        <div className="map-header-tabs">
          {tabButton("explore", "Explore", MapPin)}
          {tabButton("favorites", "Favorites", Heart)}
          {tabButton("saved", "Saved", Bookmark)}
        </div>

        <button
          onClick={onProfileClick}
          className="map-header-profile-btn"
          aria-label="Open profile"
        >
          <User size={16} />
        </button>
      </div>

      {activeTab === "explore" && (
        <>
          <div className="map-header-search-row">
            <button
              onClick={onSearchClick}
              className="map-header-search"
              aria-label="Search locations"
            >
              <Search size={20} />
              <span>Search for places, locations...</span>
            </button>
          </div>
          <CategoryFilters
            selectedCategories={selectedCategories}
            onCategoryToggle={onCategoryToggle}
          />
        </>
      )}
    </div>
  );
}
