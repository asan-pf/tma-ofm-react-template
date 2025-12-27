import { Navigation2 } from "lucide-react";

interface HomeControlsProps {
  onCurrentLocationClick: () => void;
  hasCurrentLocation: boolean;
}

export function HomeControls({
  onCurrentLocationClick,
  hasCurrentLocation,
}: HomeControlsProps) {
  if (!hasCurrentLocation) {
    return null;
  }

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
        aria-label="Jump to my location"
      >
        <Navigation2 size={20} />
      </button>
    </div>
  );
}
