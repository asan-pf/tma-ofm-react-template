import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { LocationDetailModal } from "@/components/LocationDetailModal";
// import { POIDetailModal } from "@/components/POIDetailModal";
import { MapHeader } from "@/components/Map/MapHeader";
import { MapView } from "@/components/Map/MapView";
import { FavoritesView } from "@/components/Map/FavoritesView";
import { SavedLocationsView } from "@/components/Map/SavedLocationsView";
import { MapControls } from "@/components/Map/MapControls";
import { MapCrosshair } from "@/components/Map/MapCrosshair";
import { SearchModal } from "@/components/Map/SearchModal";
import { AddLocationModal } from "@/components/Map/AddLocationModal";
import { AddChoiceModal } from "@/components/Map/AddChoiceModal";
import { SavedLocationsModal } from "@/components/SavedLocationsModal";
// Global POI imports commented out to focus on local POIs
// import { POI } from "@/utils/poiService";
import "leaflet/dist/leaflet.css";

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

type TabType = "explore" | "favorites" | "saved";
type SearchTabType = "db" | "global";

export function MapPage() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [searchTab, setSearchTab] = useState<SearchTabType>("db");
  const [locations, setLocations] = useState<Location[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<Location[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [showSavedLocationsModal, setShowSavedLocationsModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  // Global POI functionality commented out to focus on local POIs
  // const [showPOIDetail, setShowPOIDetail] = useState(false);
  // const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  // const [favoritePOIs, setFavoritePOIs] = useState<POI[]>([]);
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

  const [dynamicMapCenter, setDynamicMapCenter] = useState({
    lat: latitude || 48.8566,
    lng: longitude || 2.3522,
  });
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  // Only auto-navigate to user location on first load, not on every location update
  useEffect(() => {
    if (latitude && longitude && !hasInitializedLocation && !isLoading) {
      setDynamicMapCenter({ lat: latitude, lng: longitude });
      setHasInitializedLocation(true);
    }
  }, [latitude, longitude, isLoading, hasInitializedLocation]);

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
        setLocations(data.length > 0 ? data : getSampleLocations());
      } else {
        // API not available, use sample data
        setLocations(getSampleLocations());
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      // API not available, use sample data
      setLocations(getSampleLocations());
    } finally {
      setIsLoading(false);
    }
  };

  const getSampleLocations = (): Location[] => [
    {
      id: 1,
      name: "Sample Grocery Store",
      description: "A demo grocery store location for testing",
      latitude: latitude || 48.8566,
      longitude: longitude || 2.3522,
      category: "grocery" as const,
      created_at: new Date().toISOString(),
      is_favorited: false,
    },
    {
      id: 2,
      name: "Demo Restaurant",
      description: "A sample restaurant location",
      latitude: (latitude || 48.8566) + 0.01,
      longitude: (longitude || 2.3522) + 0.01,
      category: "restaurant-bar" as const,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_favorited: true,
    },
    {
      id: 3,
      name: "Test Shop",
      description: "Another sample location",
      latitude: (latitude || 48.8566) - 0.01,
      longitude: (longitude || 2.3522) - 0.01,
      category: "other" as const,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      is_favorited: false,
    },
  ];

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

  const handleAddLocation = async () => {
    const effectiveUser = telegramUser || {
      id: 123456789,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
    };

    if (!addLocationData.name.trim()) return;

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
        loadLocations();
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
          { method: "DELETE" }
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
          loadFavorites();
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleLocationClick = (location: Location) => {
    // Navigate to location on map
    setDynamicMapCenter({ lat: location.latitude, lng: location.longitude });
    if (mapRef) {
      mapRef.setView([location.latitude, location.longitude], 16);
    }
    // Show location detail modal
    setSelectedLocation(location);
    setShowLocationDetail(true);
  };


  // Global POI handlers commented out to focus on local POIs
  /*
  const handleGlobalPOIClick = (poi: POI) => {
    // Navigate to the POI location on the map
    setDynamicMapCenter({ lat: poi.latitude, lng: poi.longitude });
    if (mapRef) {
      mapRef.setView([poi.latitude, poi.longitude], 16);
    }
    // Show the POI detail modal
    setSelectedPOI(poi);
    setShowPOIDetail(true);
  };

  const toggleFavoritePOI = (poi: POI) => {
    const isFavorited = favoritePOIs.some(fav => fav.id === poi.id);
    if (isFavorited) {
      setFavoritePOIs(prev => prev.filter(fav => fav.id !== poi.id));
    } else {
      setFavoritePOIs(prev => [...prev, poi]);
    }
  };
  */

  const handleSearchLocationSelect = (location: Location) => {
    setDynamicMapCenter({ lat: location.latitude, lng: location.longitude });
    if (mapRef) {
      mapRef.setView([location.latitude, location.longitude], 16);
    }
    setSelectedLocation(location);
    setShowLocationDetail(true);
    setShowSearchModal(false);
  };

  const handleGlobalLocationSelect = (
    lat: number,
    lng: number,
    _name: string
  ) => {
    // Just navigate to the location on the map without opening add modal
    setDynamicMapCenter({ lat, lng });
    if (mapRef) {
      mapRef.setView([lat, lng], 16);
    }
    setShowSearchModal(false);
  };

  const handleAddLocationModeToggle = () => {
    if (isAddLocationMode) {
      setIsAddLocationMode(false);
      setPendingLocation(null);
    } else {
      setShowAddChoiceModal(true);
    }
  };

  const handleLocationChoice = () => {
    setShowAddChoiceModal(false);
    setIsAddLocationMode(true);
    setPendingLocation(null);
  };

  const handleEventChoice = () => {
    setShowAddChoiceModal(false);
    setIsAddLocationMode(true);
    setPendingLocation(null);
  };

  const handleSavedLocationClick = (location: Location) => {
    setDynamicMapCenter({ lat: location.latitude, lng: location.longitude });
    if (mapRef) {
      mapRef.setView([location.latitude, location.longitude], 16);
    }
    setSelectedLocation(location);
    setShowLocationDetail(true);
  };

  const handleMapCenterAdd = () => {
    if (mapRef && isAddLocationMode) {
      const center = mapRef.getCenter();
      setPendingLocation({ lat: center.lat, lng: center.lng });
      setAddLocationData((prev) => ({
        ...prev,
        lat: center.lat,
        lng: center.lng,
        name: "",
      }));
      setShowAddLocationModal(true);
      setIsAddLocationMode(false);
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
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .leaflet-popup-content-wrapper {
            background: var(--tg-theme-bg-color) !important;
            color: var(--tg-theme-text-color) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          }
          
          .leaflet-popup-tip {
            background: var(--tg-theme-bg-color) !important;
          }
          
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
        <MapHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onProfileClick={() => navigate("/profile")}
          onSearchClick={() => setShowSearchModal(true)}
        />

        <div className="flex-1 relative">
          {activeTab === "explore" ? (
            <>
              <MapView
                center={dynamicMapCenter}
                locations={locations}
                favoriteLocations={favoriteLocations}
                pendingLocation={pendingLocation}
                userLocation={
                  latitude && longitude
                    ? { lat: latitude, lng: longitude }
                    : null
                }
                setMapRef={setMapRef}
                onLocationClick={handleLocationClick}
                onToggleFavorite={toggleFavorite}
                // Global POI props commented out to focus on local POIs
                // onGlobalPOIClick={handleGlobalPOIClick}
                // selectedPOI={selectedPOI}
                showPOIs={false} // Disabled global POIs to focus on local ones
                hideBadges={true} // Always hide badges now since we have the saved tab
              />

              <MapCrosshair isVisible={isAddLocationMode} />

              {!showLocationDetail && !showAddLocationModal && !showAddChoiceModal && !showSearchModal && !showSavedLocationsModal && (
                <MapControls
                  isAddLocationMode={isAddLocationMode}
                  onAddLocationToggle={handleAddLocationModeToggle}
                  onMapCenterAdd={handleMapCenterAdd}
                  onCurrentLocationClick={() => {
                    if (latitude && longitude) {
                      setDynamicMapCenter({ lat: latitude, lng: longitude });
                    }
                  }}
                  hasCurrentLocation={!!(latitude && longitude)}
                />
              )}
            </>
          ) : activeTab === "favorites" ? (
            <FavoritesView
              favoriteLocations={favoriteLocations}
              onLocationClick={handleLocationClick}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <SavedLocationsView
              locations={locations}
              onLocationClick={handleLocationClick}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </div>

        <AddChoiceModal
          isOpen={showAddChoiceModal}
          onClose={() => setShowAddChoiceModal(false)}
          onLocationChoice={handleLocationChoice}
          onEventChoice={handleEventChoice}
        />

        <AddLocationModal
          isOpen={showAddLocationModal}
          onClose={() => {
            setShowAddLocationModal(false);
            setPendingLocation(null);
          }}
          addLocationData={addLocationData}
          setAddLocationData={setAddLocationData}
          onSubmit={handleAddLocation}
          isSubmitting={isSubmitting}
        />

        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          searchTab={searchTab}
          setSearchTab={setSearchTab}
          onDatabaseLocationSelect={handleSearchLocationSelect}
          onGlobalLocationSelect={handleGlobalLocationSelect}
          currentLocation={
            latitude && longitude ? { lat: latitude, lng: longitude } : null
          }
        />

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
            }}
            onToggleFavorite={toggleFavorite}
            isFavorited={favoriteLocations.some(
              (fav) => fav.id === selectedLocation.id
            )}
          />
        )}

        {/* Global POI Detail Modal commented out to focus on local POIs
        {selectedPOI && (
          <POIDetailModal
            poi={selectedPOI}
            isOpen={showPOIDetail}
            onClose={() => {
              setShowPOIDetail(false);
              setSelectedPOI(null);
            }}
            onLocationClick={(lat, lng) => {
              setDynamicMapCenter({ lat, lng });
              if (mapRef) {
                mapRef.setView([lat, lng], 16);
              }
              setShowPOIDetail(false);
            }}
            onToggleFavorite={toggleFavoritePOI}
            isFavorited={favoritePOIs.some(
              (fav) => fav.id === selectedPOI.id
            )}
          />
        )}
        */}

        <SavedLocationsModal
          locations={locations}
          isOpen={showSavedLocationsModal}
          onClose={() => setShowSavedLocationsModal(false)}
          onLocationClick={handleSavedLocationClick}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    </>
  );
}
