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
  Navigation2,
  X,
  Search,
  MessageCircle,
} from "lucide-react";
import {
  Button,
  Caption,
  Subheadline,
  Title,
} from "@telegram-apps/telegram-ui";
import { useGeolocation } from "@/hooks/useGeolocation";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { DatabaseLocationSearch } from "@/components/DatabaseLocationSearch";
import { LocationSearch } from "@/components/LocationSearch";
import { LocationDetailModal } from "@/components/LocationDetailModal";
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
  user_id?: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type?: "permanent" | "temporary";
  category: "grocery" | "restaurant-bar" | "other";
  is_approved?: boolean;
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
type SearchTabType = "db" | "global";

export function MapPage() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [searchTab, setSearchTab] = useState<SearchTabType>("db");
  const [locations, setLocations] = useState<Location[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<Location[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [isAddLocationMode, setIsAddLocationMode] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
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
  const { latitude, longitude } = useGeolocation();
  const launchParams = retrieveLaunchParams();
  const telegramUser = (launchParams?.initDataUnsafe as any)?.user;

  // Debug user data
  console.log("Launch params:", launchParams);
  console.log("Telegram user:", telegramUser);

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
    console.log("Add location button clicked!", {
      telegramUser,
      name: addLocationData.name,
      data: addLocationData,
    });

    // Create a fallback user for development/testing
    const effectiveUser = telegramUser || {
      id: 123456789,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
    };

    if (!addLocationData.name.trim()) {
      console.log("Validation failed - no name provided");
      return;
    }

    console.log("Using effective user:", effectiveUser);

    setIsSubmitting(true);
    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      const response = await fetch(`${BACKEND_URL}/api/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: effectiveUser.id.toString(),
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

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationDetail(true);
  };

  const handleSearchLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationDetail(true);
    setShowSearchModal(false);
  };

  const handleGlobalLocationSelect = (
    lat: number,
    lng: number,
    name: string
  ) => {
    setPendingLocation({ lat, lng });
    setAddLocationData((prev) => ({ ...prev, lat, lng, name }));
    setShowAddLocationModal(true);
    setShowSearchModal(false);
  };

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
    <>
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          /* Ensure proper contrast for Telegram */
          .leaflet-popup-content-wrapper {
            background: var(--tg-theme-bg-color) !important;
            color: var(--tg-theme-text-color) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          }
          
          .leaflet-popup-tip {
            background: var(--tg-theme-bg-color) !important;
          }
          
          /* Better mobile touch targets */
          .leaflet-control-zoom a {
            width: 36px !important;
            height: 36px !important;
            line-height: 36px !important;
            font-size: 18px !important;
          }
        `}
      </style>
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--tg-color-bg)",
        }}
      >
        {/* Improved Top Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "var(--tg-theme-bg-color)",
            borderBottom: "1px solid var(--tg-theme-section-separator-color)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {/* Main Navigation Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px 8px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                background: "var(--tg-theme-section-bg-color)",
                borderRadius: "12px",
                padding: "4px",
                border: "1px solid var(--tg-theme-section-separator-color)",
              }}
            >
              <button
                onClick={() => setActiveTab("explore")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    activeTab === "explore"
                      ? "var(--tg-theme-button-color)"
                      : "transparent",
                  color:
                    activeTab === "explore"
                      ? "#FFFFFF"
                      : "var(--tg-theme-text-color)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <MapPin size={16} />
                Explore
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    activeTab === "favorites"
                      ? "var(--tg-theme-button-color)"
                      : "transparent",
                  color:
                    activeTab === "favorites"
                      ? "#FFFFFF"
                      : "var(--tg-theme-text-color)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Heart size={16} />
                Favorites
              </button>
            </div>

            <button
              onClick={() => navigate("/profile")}
              style={{
                background: "var(--tg-theme-section-bg-color)",
                border: "1px solid var(--tg-theme-section-separator-color)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--tg-theme-text-color)",
                transition: "all 0.2s ease",
              }}
            >
              <User size={16} />
            </button>
          </div>

          {/* Search Bar for Explore Tab */}
          {activeTab === "explore" && (
            <div
              style={{
                padding: "0 16px 12px 16px",
              }}
            >
              <button
                onClick={() => setShowSearchModal(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "var(--tg-theme-section-bg-color)",
                  border: "1px solid var(--tg-theme-section-separator-color)",
                  borderRadius: "24px",
                  color: "var(--tg-theme-hint-color)",
                  fontSize: "16px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Search size={18} />
                <span>Search locations...</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
          {activeTab === "explore" ? (
            // Map View for Explore Tab
            <>
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

                <MapClickHandler onLocationSelect={handleMapClick} />

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
                              onClick={() => toggleFavorite(location.id)}
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
                            onClick={() => handleLocationClick(location)}
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

              {/* Instructions overlay for explore mode */}
              {!showAddLocationModal && (
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
            </>
          ) : (
            // List View for Favorites Tab
            <div
              style={{
                height: "100%",
                backgroundColor: "var(--tg-color-bg)",
                overflow: "auto",
              }}
            >
              {favoriteLocations.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <Heart
                      size={48}
                      style={{
                        color: "var(--tg-color-hint-color)",
                        margin: "0 auto 1rem auto",
                        display: "block",
                      }}
                    />
                    <Title level="2" style={{ marginBottom: "0.5rem" }}>
                      No Favorites Yet
                    </Title>
                    <Caption>
                      Explore locations and add them to your favorites to see
                      them here.
                    </Caption>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "1rem" }}>
                  <div style={{ marginBottom: "1rem", padding: "0 0.5rem" }}>
                    <Title level="2" style={{ marginBottom: "0.5rem" }}>
                      Your Favorites ({favoriteLocations.length})
                    </Title>
                    <Caption style={{ color: "var(--tg-theme-hint-color)" }}>
                      Tap any location to view details, ratings, and comments
                    </Caption>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {favoriteLocations.map((location) => {
                      const getCategoryColor = (category: string) => {
                        switch (category) {
                          case "grocery":
                            return "#22c55e";
                          case "restaurant-bar":
                            return "#f59e0b";
                          default:
                            return "#6366f1";
                        }
                      };

                      const getCategoryIcon = (category: string) => {
                        switch (category) {
                          case "grocery":
                            return "🛒";
                          case "restaurant-bar":
                            return "🍽️";
                          default:
                            return "🏪";
                        }
                      };

                      return (
                        <div
                          key={location.id}
                          style={{
                            backgroundColor: "var(--tg-color-bg-secondary)",
                            borderRadius: "12px",
                            padding: "1rem",
                            border: "1px solid var(--tg-color-separator)",
                            cursor: "pointer",
                          }}
                          onClick={() => handleLocationClick(location)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: getCategoryColor(
                                  location.category
                                ),
                                borderRadius: "8px",
                                padding: "8px",
                                minWidth: "40px",
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                              }}
                            >
                              {getCategoryIcon(location.category)}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <Subheadline style={{ fontWeight: "600" }}>
                                  {location.name}
                                </Subheadline>

                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation(); //adding to Prevent triggering the location click
                                    toggleFavorite(location.id);
                                  }}
                                  mode="plain"
                                  size="s"
                                  style={{ padding: "4px", minWidth: "unset" }}
                                >
                                  <Heart
                                    size={16}
                                    style={{ color: "#ef4444" }}
                                    fill="currentColor"
                                  />
                                </Button>
                              </div>

                              {location.description && (
                                <Caption
                                  style={{
                                    marginBottom: "0.5rem",
                                    display: "block",
                                  }}
                                >
                                  {location.description}
                                </Caption>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: getCategoryColor(
                                      location.category
                                    ),
                                    color: "white",
                                    fontSize: "12px",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {location.category.replace("-", " ")}
                                </span>

                                <span
                                  style={{
                                    backgroundColor:
                                      "var(--tg-color-separator)",
                                    color: "var(--tg-color-text-secondary)",
                                    fontSize: "12px",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  {location.type}
                                </span>

                                <Caption
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--tg-color-hint-color)",
                                  }}
                                >
                                  {location.latitude.toFixed(4)},{" "}
                                  {location.longitude.toFixed(4)}
                                </Caption>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Location Modal */}
        {showAddLocationModal && (
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
                      onClick={() => {
                        setShowAddLocationModal(false);
                        setPendingLocation(null);
                      }}
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
                      <Subheadline
                        style={{ marginBottom: 8, color: "#e2e8f0" }}
                      >
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
                      <Subheadline
                        style={{ marginBottom: 8, color: "#e2e8f0" }}
                      >
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
                        <Subheadline
                          style={{ marginBottom: 8, color: "#e2e8f0" }}
                        >
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
                        <Subheadline
                          style={{ marginBottom: 8, color: "#e2e8f0" }}
                        >
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
                        console.log("Button clicked! Event details:", e);
                        handleAddLocation();
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
        )}

        {/* Search Modal */}
        {showSearchModal && (
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
            onClick={() => setShowSearchModal(false)}
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
                  borderBottom:
                    "1px solid var(--tg-theme-section-separator-color)",
                }}
              >
                <Title level="2">Search Locations</Title>
                <button
                  onClick={() => setShowSearchModal(false)}
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
                      searchTab === "db"
                        ? "#FFFFFF"
                        : "var(--tg-theme-text-color)",
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
                    onLocationSelect={handleSearchLocationSelect}
                    placeholder="Search stored locations..."
                    currentLocation={
                      latitude && longitude
                        ? { lat: latitude, lng: longitude }
                        : null
                    }
                    showCurrentLocation={true}
                  />
                ) : (
                  <LocationSearch
                    onLocationSelect={handleGlobalLocationSelect}
                    placeholder="Search places worldwide..."
                    currentLocation={
                      latitude && longitude
                        ? { lat: latitude, lng: longitude }
                        : null
                    }
                    showCurrentLocation={true}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Location Detail Modal */}
        {showLocationDetail && selectedLocation && (
          <LocationDetailModal
            location={selectedLocation}
            isOpen={showLocationDetail}
            onClose={() => {
              setShowLocationDetail(false);
              setSelectedLocation(null);
            }}
            onLocationClick={(_lat, _lng) => {
              setShowLocationDetail(false);
              // You could add map center functionality here if needed
            }}
          />
        )}
      </div>
    </>
  );
}
