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
} from "lucide-react";
import {
  Button,
  Caption,
  Subheadline,
  Title,
} from "@telegram-apps/telegram-ui";
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
            }
            to {
              transform: translateY(0);
            }
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
        {/* Top Header with Tabs */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                size="s"
                mode={activeTab === "explore" ? "filled" : "outline"}
                onClick={() => setActiveTab("explore")}
              >
                <MapPin size={16} style={{ marginRight: 8 }} />
                Explore
              </Button>
              <Button
                size="s"
                mode={activeTab === "favorites" ? "filled" : "outline"}
                onClick={() => setActiveTab("favorites")}
              >
                <Heart size={16} style={{ marginRight: 8 }} />
                Favorites
              </Button>
            </div>

            <button
              onClick={() => navigate("/profile")}
              style={{
                background: "none",
                border: "1px solid var(--tg-color-separator)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--tg-color-text-secondary)",
              }}
            >
              <User size={16} />
            </button>
          </div>
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
                        <div className="min-w-[200px] p-2">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                              {location.name}
                            </h3>
                            <Button
                              onClick={() => toggleFavorite(location.id)}
                              mode="outline"
                              size="s"
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
            <div style={{ 
              height: "100%", 
              backgroundColor: "var(--tg-color-bg)", 
              overflow: "auto" 
            }}>
              {favoriteLocations.length === 0 ? (
                <div style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <Heart 
                      size={48} 
                      style={{ 
                        color: "var(--tg-color-hint-color)", 
                        margin: "0 auto 1rem auto", 
                        display: "block" 
                      }} 
                    />
                    <Title level="2" style={{ marginBottom: "0.5rem" }}>
                      No Favorites Yet
                    </Title>
                    <Caption>
                      Explore locations and add them to your favorites to see them here.
                    </Caption>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "1rem" }}>
                  <Title level="2" style={{ marginBottom: "1rem", padding: "0 0.5rem" }}>
                    Your Favorites ({favoriteLocations.length})
                  </Title>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {favoriteLocations.map((location) => {
                      const getCategoryColor = (category: string) => {
                        switch (category) {
                          case 'grocery': return '#22c55e';
                          case 'restaurant-bar': return '#f59e0b';
                          default: return '#6366f1';
                        }
                      };

                      const getCategoryIcon = (category: string) => {
                        switch (category) {
                          case 'grocery': return '🛒';
                          case 'restaurant-bar': return '🍽️';
                          default: return '🏪';
                        }
                      };

                      return (
                        <div
                          key={location.id}
                          style={{
                            backgroundColor: "var(--tg-color-bg-secondary)",
                            borderRadius: "12px",
                            padding: "1rem",
                            border: "1px solid var(--tg-color-separator)"
                          }}
                        >
                          <div style={{ 
                            display: "flex", 
                            alignItems: "flex-start", 
                            gap: "0.75rem" 
                          }}>
                            <div style={{
                              backgroundColor: getCategoryColor(location.category),
                              borderRadius: "8px",
                              padding: "8px",
                              minWidth: "40px",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px"
                            }}>
                              {getCategoryIcon(location.category)}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                display: "flex", 
                                alignItems: "flex-start", 
                                justifyContent: "space-between",
                                marginBottom: "0.5rem"
                              }}>
                                <Subheadline style={{ fontWeight: "600" }}>
                                  {location.name}
                                </Subheadline>
                                
                                <Button
                                  onClick={() => toggleFavorite(location.id)}
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
                                <Caption style={{ 
                                  marginBottom: "0.5rem",
                                  display: "block"
                                }}>
                                  {location.description}
                                </Caption>
                              )}
                              
                              <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.5rem",
                                flexWrap: "wrap"
                              }}>
                                <span style={{
                                  backgroundColor: getCategoryColor(location.category),
                                  color: "white",
                                  fontSize: "12px",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontWeight: "500"
                                }}>
                                  {location.category.replace("-", " ")}
                                </span>
                                
                                <span style={{
                                  backgroundColor: "var(--tg-color-separator)",
                                  color: "var(--tg-color-text-secondary)",
                                  fontSize: "12px",
                                  padding: "2px 8px",
                                  borderRadius: "6px"
                                }}>
                                  {location.type}
                                </span>
                                
                                <Caption style={{ 
                                  fontSize: "12px",
                                  color: "var(--tg-color-hint-color)"
                                }}>
                                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
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
                    <Title level="1" style={{ color: "#f1f5f9" }}>Add Location</Title>
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
                      <Caption style={{ fontWeight: 600, marginBottom: 4, color: "#e2e8f0" }}>
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
                        backgroundColor: isSubmitting
                          ? "#64748b"
                          : "#3b82f6",
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
      </div>
    </>
  );
}
