import { MapPin, X } from "lucide-react";

interface MapTapActionSheetProps {
  isOpen: boolean;
  coordinates: { lat: number; lng: number } | null;
  onAddLocation: () => void;
  onClose: () => void;
}

export function MapTapActionSheet({
  isOpen,
  coordinates,
  onAddLocation,
  onClose,
}: MapTapActionSheetProps) {
  if (!isOpen || !coordinates) {
    return null;
  }

  const { lat, lng } = coordinates;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        zIndex: 1200,
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--tg-theme-bg-color, #0f172a)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "20px 24px",
          boxShadow: "0 -10px 35px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "var(--tg-theme-button-color, #2563eb)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Selected point</div>
              <div style={{ fontSize: 13, color: "var(--tg-theme-hint-color, #94a3b8)" }}>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              padding: 8,
              cursor: "pointer",
              color: "var(--tg-theme-hint-color, #94a3b8)",
            }}
            aria-label="Close add location menu"
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: 14,
            color: "var(--tg-theme-hint-color, #94a3b8)",
            marginBottom: 20,
          }}
        >
          Tap the button below to create a location for this point.
        </p>

        <button
          onClick={onAddLocation}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 16,
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: "var(--tg-theme-button-color, #2563eb)",
            color: "var(--tg-theme-button-text-color, #fff)",
            cursor: "pointer",
            transition: "opacity 0.2s ease",
          }}
        >
          Add location here
        </button>
      </div>
    </div>
  );
}
