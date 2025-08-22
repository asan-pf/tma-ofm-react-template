import { useEffect } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import {
  Navigation2,
  Plus,
  Heart,
  HeartOff,
  MessageCircle,
} from "lucide-react";
import L from "leaflet";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type?: "permanent" | "temporary";
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
}

interface MapViewProps {
  center: { lat: number; lng: number };
  locations: Location[];
  favoriteLocations: Location[];
  pendingLocation: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
  setMapRef: (map: any) => void;
  onLocationClick: (location: Location) => void;
  onToggleFavorite: (locationId: number) => void;
}

// Custom marker icons for different categories
const createCustomIcon = (category: string, isFavorite: boolean = false) => {
  const color =
    category === "grocery"
      ? "#22c55e"
      : category === "restaurant-bar"
      ? "#f59e0b"
      : "#6366f1";

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      ${
        isFavorite
          ? '<span style="color: white; font-size: 12px;">♥</span>'
          : ""
      }
    </div>`,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

// Component to setup map reference
function MapSetup({ setMapRef }: { setMapRef: (map: any) => void }) {
  const map = useMapEvents({});

  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);

  return null;
}

export function MapView({
  center,
  locations,
  favoriteLocations,
  pendingLocation,
  userLocation,
  setMapRef,
  onLocationClick,
  onToggleFavorite,
}: MapViewProps) {
  return (
    <LeafletMapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapSetup setMapRef={setMapRef} />

      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>
            <div className="text-center">
              <Navigation2 className="w-4 h-4 inline text-blue-600 mr-1" />
              <span className="font-medium">Your Location</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Location markers */}
      {locations.map((location) => {
        const isFavorited = favoriteLocations.some(
          (fav) => fav.id === location.id
        );
        return (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createCustomIcon(location.category, isFavorited)}
          >
            <Popup>
              <div
                style={{
                  minWidth: "240px",
                  padding: "8px",
                  background: "var(--tg-theme-bg-color)",
                  color: "var(--tg-theme-text-color)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: "600",
                      fontSize: "16px",
                      margin: 0,
                    }}
                  >
                    {location.name}
                  </h3>
                  <button
                    onClick={() => onToggleFavorite(location.id)}
                    style={{
                      background: "none",
                      border:
                        "1px solid var(--tg-theme-section-separator-color)",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: isFavorited
                        ? "#ef4444"
                        : "var(--tg-theme-hint-color)",
                    }}
                  >
                    {isFavorited ? (
                      <Heart size={14} fill="currentColor" />
                    ) : (
                      <HeartOff size={14} />
                    )}
                  </button>
                </div>

                {location.description && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--tg-theme-hint-color)",
                      marginBottom: "8px",
                      lineHeight: "1.3",
                    }}
                  >
                    {location.description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background:
                        location.category === "grocery"
                          ? "#dcfce7"
                          : location.category === "restaurant-bar"
                          ? "#fef3c7"
                          : "#e0e7ff",
                      color:
                        location.category === "grocery"
                          ? "#166534"
                          : location.category === "restaurant-bar"
                          ? "#92400e"
                          : "#3730a3",
                    }}
                  >
                    {location.category.replace("-", " ")}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--tg-theme-hint-color)",
                    }}
                  >
                    {location.type}
                  </span>
                </div>

                <button
                  onClick={() => onLocationClick(location)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--tg-theme-button-color)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <MessageCircle size={14} />
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Pending location marker */}
      {pendingLocation && (
        <Marker position={[pendingLocation.lat, pendingLocation.lng]}>
          <Popup>
            <div className="text-center">
              <Plus className="w-4 h-4 inline text-green-600 mr-1" />
              <span className="font-medium">New Location</span>
            </div>
          </Popup>
        </Marker>
      )}
    </LeafletMapContainer>
  );
}
