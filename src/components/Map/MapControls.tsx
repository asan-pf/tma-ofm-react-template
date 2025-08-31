import { Plus, MapPin, Navigation2 } from "lucide-react";

interface MapControlsProps {
  isAddLocationMode: boolean;
  onAddLocationToggle: () => void;
  onMapCenterAdd: () => void;
  onCurrentLocationClick: () => void;
  hasCurrentLocation: boolean;
}

export function MapControls({
  isAddLocationMode,
  onAddLocationToggle,
  onMapCenterAdd,
  onCurrentLocationClick,
  hasCurrentLocation,
}: MapControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 1000,
      }}
    >
      {/* Find My Location Button */}
      {hasCurrentLocation && (
        <button
          onClick={onCurrentLocationClick}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--tg-theme-bg-color)",
            color: "var(--tg-theme-accent-text-color)",
            border: "1px solid var(--tg-theme-section-separator-color)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          <Navigation2 size={20} />
        </button>
      )}

      {/* Add Location Button */}
      <button
        onClick={isAddLocationMode ? onMapCenterAdd : onAddLocationToggle}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: isAddLocationMode
            ? "var(--tg-theme-destructive-text-color)"
            : "var(--tg-theme-button-color)",
          color: "white",
          border: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
      >
        {isAddLocationMode ? <MapPin size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
