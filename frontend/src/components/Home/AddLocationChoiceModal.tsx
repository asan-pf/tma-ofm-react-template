import { MapPin, Calendar } from "lucide-react";

interface AddLocationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChoice: () => void;
  onEventChoice: () => void;
}

export function AddLocationChoiceModal({
  isOpen,
  onClose,
  onLocationChoice,
  onEventChoice,
}: AddLocationChoiceModalProps) {
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
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--tg-theme-bg-color, white)",
          borderRadius: "16px",
          padding: "24px",
          width: "100%",
          maxWidth: "320px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          transform: "scale(1)",
          transition: "all 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--tg-theme-text-color, #333)",
              marginBottom: "8px",
            }}
          >
            What would you like to add?
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--tg-theme-hint-color, #666)",
            }}
          >
            Choose the type of item you want to create
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <button
            onClick={onLocationChoice}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              background: "var(--tg-theme-button-color, #0088cc)",
              color: "var(--tg-theme-button-text-color, white)",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontWeight: "600" }}>New Location</div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.8,
                  marginTop: "2px",
                }}
              >
                Add a permanent place
              </div>
            </div>
          </button>

          <button
            onClick={onEventChoice}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              background: "var(--tg-theme-secondary-bg-color, #f1f3f4)",
              color: "var(--tg-theme-text-color, #333)",
              border: "1px solid var(--tg-theme-section-separator-color, #e1e1e1)",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--tg-theme-button-color, #0088cc)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontWeight: "600" }}>New Event</div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.7,
                  marginTop: "2px",
                }}
              >
                Add a temporary event
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            color: "var(--tg-theme-link-color, #0088cc)",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            marginTop: "16px",
            transition: "all 0.2s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = "var(--tg-theme-section-separator-color, #f1f1f1)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
