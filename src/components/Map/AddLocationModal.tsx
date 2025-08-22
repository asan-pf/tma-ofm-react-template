import { Plus, X } from "lucide-react";
import { Title, Subheadline, Caption } from "@telegram-apps/telegram-ui";

interface AddLocationData {
  lat: number;
  lng: number;
  name: string;
  description: string;
  type: "permanent" | "temporary";
  category: "grocery" | "restaurant-bar" | "other";
}

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  addLocationData: AddLocationData;
  setAddLocationData: (
    data: AddLocationData | ((prev: AddLocationData) => AddLocationData)
  ) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AddLocationModal({
  isOpen,
  onClose,
  addLocationData,
  setAddLocationData,
  onSubmit,
  isSubmitting,
}: AddLocationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "#334155",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.5)",
          animation: "slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          transform: "translateY(0)",
        }}
      >
        <div
          style={{
            backgroundColor: "#334155",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: "relative",
          }}
        >
          {/* Modal Handle */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 8px 0",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                backgroundColor: "#64748b",
                borderRadius: 2,
              }}
            />
          </div>

          <div style={{ padding: "0 24px 24px 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Title level="1" style={{ color: "#f1f5f9" }}>
                Add Location
              </Title>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#cbd5e1",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <Subheadline style={{ marginBottom: 8, color: "#e2e8f0" }}>
                  Location Name *
                </Subheadline>
                <input
                  type="text"
                  value={addLocationData.name}
                  onChange={(e) =>
                    setAddLocationData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter location name"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #475569",
                    borderRadius: "12px",
                    backgroundColor: "#475569",
                    color: "#f1f5f9",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <Subheadline style={{ marginBottom: 8, color: "#e2e8f0" }}>
                  Description
                </Subheadline>
                <textarea
                  value={addLocationData.description}
                  onChange={(e) =>
                    setAddLocationData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe this location"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #475569",
                    borderRadius: "12px",
                    backgroundColor: "#475569",
                    color: "#f1f5f9",
                    fontSize: "16px",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <Subheadline style={{ marginBottom: 8, color: "#e2e8f0" }}>
                    Category
                  </Subheadline>
                  <select
                    value={addLocationData.category}
                    onChange={(e) =>
                      setAddLocationData((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #475569",
                      borderRadius: "12px",
                      backgroundColor: "#475569",
                      color: "#f1f5f9",
                      fontSize: "16px",
                      outline: "none",
                    }}
                  >
                    <option value="grocery">Grocery</option>
                    <option value="restaurant-bar">Restaurant/Bar</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Subheadline style={{ marginBottom: 8, color: "#e2e8f0" }}>
                    Type
                  </Subheadline>
                  <select
                    value={addLocationData.type}
                    onChange={(e) =>
                      setAddLocationData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #475569",
                      borderRadius: "12px",
                      backgroundColor: "#475569",
                      color: "#f1f5f9",
                      fontSize: "16px",
                      outline: "none",
                    }}
                  >
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  backgroundColor: "#475569",
                  borderRadius: 12,
                  border: "1px solid #64748b",
                }}
              >
                <Caption
                  style={{
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "#e2e8f0",
                  }}
                >
                  Coordinates:
                </Caption>
                <Caption style={{ color: "#cbd5e1" }}>
                  {addLocationData.lat.toFixed(6)},{" "}
                  {addLocationData.lng.toFixed(6)}
                </Caption>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmit();
                }}
                disabled={!addLocationData.name.trim() || isSubmitting}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: isSubmitting ? "#64748b" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {isSubmitting ? (
                  "Adding Location..."
                ) : (
                  <>
                    <Plus size={16} />
                    Add Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
