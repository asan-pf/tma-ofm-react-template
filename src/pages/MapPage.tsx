import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import {
  MapPin,
  Heart,
  HeartOff,
  Plus,
  User,
  Star,
  Navigation2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Location {
  id: number;
  user_id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: "permanent" | "temporary";
  category: "grocery" | "restaurant-bar" | "other";
  is_approved: boolean;
  created_at: string;
  is_favorited?: boolean;
  rating?: number;
}

interface AddLocationData {
  lat: number;
  lng: number;
  name: string;
  description: string;
  type: "permanent" | "temporary";
  category: "grocery" | "restaurant-bar" | "other";
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

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type TabType = "explore" | "favorites";

export function MapPage() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [locations, setLocations] = useState<Location[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<Location[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addLocationData, setAddLocationData] = useState<AddLocationData>({
    lat: 0,
    lng: 0,
    name: "",
    description: "",
    type: "permanent",
    category: "other",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { latitude, longitude, error: locationError } = useGeolocation();
  const launchParams = retrieveLaunchParams();
  const telegramUser = (launchParams?.initDataUnsafe as any)?.user;

  const mapCenter = {
    lat: latitude || 40.7128,
    lng: longitude || -74.006,
  };

  useEffect(() => {
    loadLocations();
    if (telegramUser) {
      loadFavorites();
    }
  }, [telegramUser]);

  const loadLocations = async () => {
    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(`${BACKEND_URL}/api/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!telegramUser) return;

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(
        `${BACKEND_URL}/api/users/${telegramUser.id}/favorites`
      );
      if (response.ok) {
        const data = await response.json();
        setFavoriteLocations(data);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setAddLocationData((prev) => ({ ...prev, lat, lng }));
    setShowAddLocationModal(true);
  };

  const handleAddLocation = async () => {
    if (!telegramUser || !addLocationData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      const response = await fetch(`${BACKEND_URL}/api/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: telegramUser.id.toString(),
          name: addLocationData.name,
          description: addLocationData.description,
          latitude: addLocationData.lat,
          longitude: addLocationData.lng,
          type: addLocationData.type,
          category: addLocationData.category,
        }),
      });

      if (response.ok) {
        setShowAddLocationModal(false);
        setPendingLocation(null);
        setAddLocationData({
          lat: 0,
          lng: 0,
          name: "",
          description: "",
          type: "permanent",
          category: "other",
        });
        loadLocations(); // Refresh locations
      } else {
        throw new Error("Failed to add location");
      }
    } catch (error) {
      console.error("Error adding location:", error);
      alert("Failed to add location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = async (locationId: number) => {
    if (!telegramUser) return;

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const isFavorited = favoriteLocations.some(
        (fav) => fav.id === locationId
      );

      if (isFavorited) {
        const response = await fetch(
          `${BACKEND_URL}/api/users/${telegramUser.id}/favorites/${locationId}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          setFavoriteLocations((prev) =>
            prev.filter((fav) => fav.id !== locationId)
          );
        }
      } else {
        const response = await fetch(
          `${BACKEND_URL}/api/users/${telegramUser.id}/favorites`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locationId }),
          }
        );
        if (response.ok) {
          loadFavorites(); // Refresh favorites
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const displayedLocations =
    activeTab === "explore" ? locations : favoriteLocations;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Top Header with Tabs */}
      <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "explore"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Explore
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "favorites"
                  ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Favorites
            </button>
          </div>

          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fullscreen Map */}
      <div className="flex-1 relative">
        <LeafletMapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {activeTab === "explore" && (
            <MapClickHandler onLocationSelect={handleMapClick} />
          )}

          {/* User location marker */}
          {latitude && longitude && (
            <Marker position={[latitude, longitude]}>
              <Popup>
                <div className="text-center">
                  <Navigation2 className="w-4 h-4 inline text-blue-600 mr-1" />
                  <span className="font-medium">Your Location</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Location markers */}
          {displayedLocations.map((location) => {
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
                  <div className="min-w-[200px] p-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {location.name}
                      </h3>
                      <Button
                        onClick={() => toggleFavorite(location.id)}
                        variant="outline"
                        size="sm"
                        className="p-1 h-6 w-6"
                      >
                        {isFavorited ? (
                          <Heart className="h-3 w-3 text-red-500 fill-current" />
                        ) : (
                          <HeartOff className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    {location.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {location.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          location.category === "grocery"
                            ? "bg-green-100 text-green-700"
                            : location.category === "restaurant-bar"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {location.category.replace("-", " ")}
                      </span>
                      <span className="text-gray-500">{location.type}</span>
                    </div>
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

        {/* Instructions overlay for explore mode */}
        {activeTab === "explore" && !showAddLocationModal && (
          <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Tap anywhere on the map to add a location
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddLocationModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Location
              </h2>
              <Button
                onClick={() => {
                  setShowAddLocationModal(false);
                  setPendingLocation(null);
                }}
                variant="outline"
                size="sm"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Name *
                </label>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={addLocationData.category}
                    onChange={(e) =>
                      setAddLocationData((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="grocery">Grocery</option>
                    <option value="restaurant-bar">Restaurant/Bar</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={addLocationData.type}
                    onChange={(e) =>
                      setAddLocationData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Coordinates:</strong> {addLocationData.lat.toFixed(6)}
                  , {addLocationData.lng.toFixed(6)}
                </p>
              </div>

              <Button
                onClick={handleAddLocation}
                disabled={!addLocationData.name.trim() || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Adding Location...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
