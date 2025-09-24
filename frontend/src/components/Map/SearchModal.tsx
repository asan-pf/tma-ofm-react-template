import { X } from "lucide-react";
import { Title } from "@telegram-apps/telegram-ui";
import { DatabaseLocationSearch } from "@/components/DatabaseLocationSearch";
import { LocationSearch } from "@/components/LocationSearch";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTab: "db" | "global";
  setSearchTab: (tab: "db" | "global") => void;
  onDatabaseLocationSelect: (location: Location) => void;
  onGlobalLocationSelect: (lat: number, lng: number, name: string) => void;
  currentLocation: { lat: number; lng: number } | null;
}

export function SearchModal({
  isOpen,
  onClose,
  searchTab,
  setSearchTab,
  onDatabaseLocationSelect,
  onGlobalLocationSelect,
  currentLocation,
}: SearchModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          height: "fit-content",
          maxHeight: "calc(100vh - 40px)",
          backgroundColor: "var(--tg-theme-bg-color)",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 0 20px",
            borderBottom: "1px solid var(--tg-theme-section-separator-color)",
          }}
        >
          <Title level="2">Search Locations</Title>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              color: "var(--tg-theme-hint-color)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Tab Selector */}
        <div
          style={{
            display: "flex",
            margin: "16px",
            background: "var(--tg-theme-section-bg-color)",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid var(--tg-theme-section-separator-color)",
          }}
        >
          <button
            onClick={() => setSearchTab("db")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background:
                searchTab === "db"
                  ? "var(--tg-theme-button-color)"
                  : "transparent",
              color:
                searchTab === "db" ? "#FFFFFF" : "var(--tg-theme-text-color)",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            OFM Locations
          </button>
          <button
            onClick={() => setSearchTab("global")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background:
                searchTab === "global"
                  ? "var(--tg-theme-button-color)"
                  : "transparent",
              color:
                searchTab === "global"
                  ? "#FFFFFF"
                  : "var(--tg-theme-text-color)",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Global Search
          </button>
        </div>

        {/* Search Content */}
        <div
          style={{
            flex: 1,
            padding: "0 16px 20px 16px",
            overflow: "auto",
            minHeight: "300px",
          }}
        >
          {searchTab === "db" ? (
            <DatabaseLocationSearch
              onLocationSelect={onDatabaseLocationSelect}
              placeholder="Search stored locations..."
              currentLocation={currentLocation}
              showCurrentLocation={true}
            />
          ) : (
            <LocationSearch
              onLocationSelect={onGlobalLocationSelect}
              placeholder="Search places worldwide..."
              currentLocation={currentLocation}
              showCurrentLocation={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
