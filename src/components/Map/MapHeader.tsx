import { MapPin, Heart, User, Search } from "lucide-react";

interface MapHeaderProps {
  activeTab: "explore" | "favorites";
  setActiveTab: (tab: "explore" | "favorites") => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
}

export function MapHeader({
  activeTab,
  setActiveTab,
  onProfileClick,
  onSearchClick,
}: MapHeaderProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "var(--tg-theme-bg-color)",
        borderBottom: "1px solid var(--tg-theme-section-separator-color)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Main Navigation Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 8px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "var(--tg-theme-section-bg-color)",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid var(--tg-theme-section-separator-color)",
          }}
        >
          <button
            onClick={() => setActiveTab("explore")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background:
                activeTab === "explore"
                  ? "var(--tg-theme-button-color)"
                  : "transparent",
              color:
                activeTab === "explore"
                  ? "#FFFFFF"
                  : "var(--tg-theme-text-color)",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <MapPin size={16} />
            Explore
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background:
                activeTab === "favorites"
                  ? "var(--tg-theme-button-color)"
                  : "transparent",
              color:
                activeTab === "favorites"
                  ? "#FFFFFF"
                  : "var(--tg-theme-text-color)",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Heart size={16} />
            Favorites
          </button>
        </div>

        <button
          onClick={onProfileClick}
          style={{
            background: "var(--tg-theme-section-bg-color)",
            border: "1px solid var(--tg-theme-section-separator-color)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--tg-theme-text-color)",
            transition: "all 0.2s ease",
          }}
        >
          <User size={16} />
        </button>
      </div>

      {/* Search Bar for Explore Tab */}
      {activeTab === "explore" && (
        <div
          style={{
            padding: "0 16px 12px 16px",
          }}
        >
          <button
            onClick={onSearchClick}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 20px",
              background: "var(--tg-theme-bg-color)",
              border: "2px solid var(--tg-theme-section-separator-color)",
              borderRadius: "28px",
              color: "var(--tg-theme-hint-color)",
              fontSize: "16px",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}
          >
            <Search size={20} />
            <span>Search for places, locations...</span>
          </button>

        </div>
      )}
    </div>
  );
}
