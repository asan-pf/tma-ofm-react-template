import { MapPin } from "lucide-react";

interface MapCrosshairProps {
  isVisible: boolean;
}

export function MapCrosshair({ isVisible }: MapCrosshairProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* Center Crosshair */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            position: "relative",
          }}
        >
          {/* Crosshair */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "20px",
              height: "2px",
              backgroundColor: "var(--tg-theme-button-color)",
              transform: "translate(-50%, -50%)",
              borderRadius: "1px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "2px",
              height: "20px",
              backgroundColor: "var(--tg-theme-button-color)",
              transform: "translate(-50%, -50%)",
              borderRadius: "1px",
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "6px",
              height: "6px",
              backgroundColor: "var(--tg-theme-button-color)",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              border: "2px solid white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          right: "20px",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "var(--tg-theme-bg-color)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid var(--tg-theme-section-separator-color)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <MapPin
              size={20}
              style={{ color: "var(--tg-theme-button-color)" }}
            />
            <div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "var(--tg-theme-text-color)",
                  marginBottom: "4px",
                }}
              >
                Position the crosshair and tap the pin button
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--tg-theme-hint-color)",
                }}
              >
                Move the map to place your location precisely
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
