import { Plus, MapPin, Navigation2, X } from "lucide-react";

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
        right: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
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

      {/* Cancel Button - Only show in add location mode */}
      {isAddLocationMode && (
        <button
          onClick={onAddLocationToggle}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#ef4444", // Red color for cancel
            color: "white",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          <X size={20} />
        </button>
      )}

      {/* Add Location Button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <button
          onClick={isAddLocationMode ? onMapCenterAdd : onAddLocationToggle}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: isAddLocationMode ? "#22c55e" : "var(--tg-theme-button-color)",
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
        {isAddLocationMode && (
          <button
            onClick={onMapCenterAdd}
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              textAlign: "center",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Tap to Add Here
          </button>
        )}
      </div>
    </div>
  );
}
