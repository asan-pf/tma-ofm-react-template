import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { initDataState, useSignal } from "@telegram-apps/sdk-react";
import { LocationDetailModal } from "@/components/LocationDetailModal";
// import { POIDetailModal } from "@/components/POIDetailModal";
import { HomeHeader } from "@/components/Home/HomeHeader";
import { HomeMap } from "@/components/Home/HomeMap";
import { FavoriteLocationsList } from "@/components/Home/FavoriteLocationsList";
import { SavedLocationsList } from "@/components/Home/SavedLocationsList";
import { HomeControls } from "@/components/Home/HomeControls";
import { LocationSearchModal } from "@/components/Home/LocationSearchModal";
import { AddLocationModal } from "@/components/Home/AddLocationModal";
import { SavedLocationsModal } from "@/components/SavedLocationsModal";
import { TapLocationSheet } from "@/components/Home/TapLocationSheet";
import { CategoryFilters } from "@/components/Home/CategoryFilters";
import { UserService, type UserProfile } from "@/utils/userService";
// Global POI imports commented out to focus on local POIs
// import { POI } from "@/utils/poiService";
import "leaflet/dist/leaflet.css";

interface Location {
  id: number;
  user_id?: number;
  name: string;
  description: string;
  image_url?: string;
  website_url?: string;
  schedules?: string;
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
  image_url: string;
  website_url: string;
  schedules: string;
  type: "permanent" | "temporary";
  category: "grocery" | "restaurant-bar" | "other";
}

type TabType = "explore" | "favorites" | "saved";
type SearchTabType = "db" | "global";
type NormalizedTelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

const DEV_FALLBACK_TELEGRAM_USER: NormalizedTelegramUser = {
  id: 123456789,
  first_name: "Test",
  last_name: "User",
  username: "testuser",
};

const shouldUseDevFallbackUser =
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_DEV_FALLBACK_USER === "true";

const normalizeTelegramUser = (user: any): NormalizedTelegramUser | null => {
  if (!user) {
    return null;
  }

  return {
    id: Number(user.id),
    first_name: user.first_name ?? "User",
    last_name: user.last_name ?? undefined,
    username: user.username ?? undefined,
  };
};

export function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [searchTab, setSearchTab] = useState<SearchTabType>("db");
  const [locations, setLocations] = useState<Location[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<Location[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [showSavedLocationsModal, setShowSavedLocationsModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  // Global POI functionality commented out to focus on local POIs
  // const [showPOIDetail, setShowPOIDetail] = useState(false);
  // const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  // const [favoritePOIs, setFavoritePOIs] = useState<POI[]>([]);
  const [mapRef, setMapRef] = useState<any>(null);
  const [pendingMapFocus, setPendingMapFocus] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapTapLocation, setMapTapLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [addLocationData, setAddLocationData] = useState<AddLocationData>({
    lat: 0,
    lng: 0,
    name: "",
    description: "",
    image_url: "",
    website_url: "",
    schedules: "",
    type: "permanent",
    category: "other",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTapLocationSheet, setShowTapLocationSheet] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [toast, setToast] = useState<
    { message: string; type: "info" | "success" | "error" } | null
  >(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastColors: Record<"info" | "success" | "error", string> = {
    info: "rgba(59, 130, 246, 0.95)",
    success: "rgba(34, 197, 94, 0.95)",
    error: "rgba(239, 68, 68, 0.95)",
  };

  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();
  const initData = useSignal(initDataState);
  const telegramInitUser =
    initData?.user ??
    (typeof window !== "undefined"
      ? (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
      : null) ??
    (shouldUseDevFallbackUser ? DEV_FALLBACK_TELEGRAM_USER : null);
  const telegramUser = normalizeTelegramUser(telegramInitUser);

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
    } else {
      setFavoriteLocations([]);
    }
  }, [telegramUser?.id]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      setToast({ message, type });
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, 2500);
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const ensureUserProfile = async () => {
      if (!telegramUser) {
        if (isMounted) {
          setUserProfile(null);
        }
        return;
      }

      try {
        const profile = await UserService.getOrCreateUser(telegramUser);
        if (isMounted) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error ensuring user profile:", error);
      }
    };

    ensureUserProfile();

    return () => {
      isMounted = false;
    };
  }, [telegramUser]);

  useEffect(() => {
    if (mapRef && pendingMapFocus) {
      try {
        mapRef.setView([pendingMapFocus.lat, pendingMapFocus.lng], 16);
      } catch (error) {
        console.error("Error focusing map:", error);
      } finally {
        setPendingMapFocus(null);
      }
    }
  }, [mapRef, pendingMapFocus]);

  const exitPlacementMode = useCallback(() => {
    setIsPlacementMode(false);
    setShowTapHint(false);
    setShowTapLocationSheet(false);
    setMapTapLocation(null);
  }, []);

  const handleCategoryToggle = useCallback((category: string) => {
    if (category === "all") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories((prev) => {
        if (prev.includes(category)) {
          return prev.filter((c) => c !== category);
        } else {
          return [...prev, category];
        }
      });
    }
  }, []);

  const filteredLocations = useMemo(() => {
    if (selectedCategories.length === 0) {
      return locations;
    }
    return locations.filter((location) =>
      selectedCategories.includes(location.category)
    );
  }, [locations, selectedCategories]);

  useEffect(() => {
    if (activeTab !== "explore") {
      exitPlacementMode();
    }
  }, [activeTab, exitPlacementMode]);

  useEffect(() => {
    setLocations((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const favoriteIds = new Set(favoriteLocations.map((fav) => fav.id));
      let changed = false;

      const next = prev.map((location) => {
        const nextIsFavorite = favoriteIds.has(location.id);
        if (location.is_favorited !== nextIsFavorite) {
          changed = true;
          return { ...location, is_favorited: nextIsFavorite };
        }
        return location;
      });

      return changed ? next : prev;
    });
  }, [favoriteLocations]);

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
      const userProfile = await UserService.getOrCreateUser(telegramUser);
      if (!userProfile) {
        console.warn("Unable to ensure user profile before loading favorites");
        return;
      }

      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(
        `${BACKEND_URL}/api/users/${telegramUser.id}/favorites`
      );
      if (response.ok) {
        const data = await response.json();
        setFavoriteLocations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const handleAddLocation = async () => {
    if (!telegramUser) {
      alert("Please open this mini app from Telegram to add a location.");
      return;
    }

    if (!addLocationData.name.trim()) return;

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
          imageUrl: addLocationData.image_url || null,
          websiteUrl: addLocationData.website_url || null,
          schedules: addLocationData.schedules || null,
          latitude: addLocationData.lat,
          longitude: addLocationData.lng,
          type: addLocationData.type,
          category: addLocationData.category,
        }),
      });

      if (response.ok) {
        setShowAddLocationModal(false);
        exitPlacementMode();
        setMapTapLocation(null);
        setAddLocationData({
          lat: 0,
          lng: 0,
          name: "",
          description: "",
          image_url: "",
          website_url: "",
          schedules: "",
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

  const centerMapAtCoordinates = (coords: { lat: number; lng: number }) => {
    setDynamicMapCenter(coords);

    const container = mapRef?.getContainer?.();
    if (mapRef && container) {
      try {
        mapRef.setView([coords.lat, coords.lng], 16);
        setPendingMapFocus(null);
      } catch (error) {
        console.error("Error focusing map:", error);
        setPendingMapFocus(coords);
      }
    } else {
      setPendingMapFocus(coords);
    }
  };

  const focusLocationOnMap = (
    location: Location,
    options: { showDetail?: boolean; closeSavedModal?: boolean } = {}
  ) => {
    const { showDetail = true, closeSavedModal = false } = options;
    const coords = { lat: location.latitude, lng: location.longitude };

    centerMapAtCoordinates(coords);

    if (activeTab !== "explore") {
      setActiveTab("explore");
    }

    if (closeSavedModal) {
      setShowSavedLocationsModal(false);
    }

    if (showDetail) {
      setSelectedLocation(location);
      setShowLocationDetail(true);
    } else {
      setSelectedLocation(null);
      setShowLocationDetail(false);
    }
  };

  const toggleFavorite = async (locationId: number) => {
    if (!telegramUser) {
      showToast("Open this mini app in Telegram to save favorites.", "error");
      return;
    }

    showToast("Saving to favorites...", "info");

    try {
      const userProfile = await UserService.getOrCreateUser(telegramUser);
      if (!userProfile) {
        console.warn("Unable to ensure user profile before toggling favorites");
        showToast("Could not verify your profile. Try again.", "error");
        return;
      }

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
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === locationId ? { ...loc, is_favorited: false } : loc
            )
          );
          showToast("Removed from favorites", "success");
        } else {
          showToast("Unable to remove favorite", "error");
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
          const matchingLocation = locations.find(
            (location) => location.id === locationId
          );

          if (matchingLocation) {
            setFavoriteLocations((prev) => {
              if (prev.some((fav) => fav.id === locationId)) {
                return prev;
              }
              return [...prev, matchingLocation];
            });
          }

          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === locationId ? { ...loc, is_favorited: true } : loc
            )
          );

          loadFavorites();
          showToast("Saved to favorites", "success");
        } else {
          showToast("Unable to save favorite", "error");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("Failed to update favorites. Please retry.", "error");
    }
  };

  const handleLocationClick = (location: Location) => {
    focusLocationOnMap(location);
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
    focusLocationOnMap(location);
    setShowLocationSearchModal(false);
  };

  const handleGlobalLocationSelect = (
    lat: number,
    lng: number,
    _name: string
  ) => {
    const coords = { lat, lng };
    centerMapAtCoordinates(coords);

    if (activeTab !== "explore") {
      setActiveTab("explore");
    }

    setSelectedLocation(null);
    setShowLocationDetail(false);
    setShowLocationSearchModal(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (
      !isPlacementMode ||
      showAddLocationModal ||
      showLocationSearchModal ||
      showLocationDetail ||
      showTapLocationSheet
    ) {
      return;
    }

    setShowTapHint(false);
    setMapTapLocation({ lat, lng });
    setShowTapLocationSheet(true);
  };

  const handleMapTapAdd = () => {
    if (!mapTapLocation) return;

    setAddLocationData((prev) => ({
      ...prev,
      lat: mapTapLocation.lat,
      lng: mapTapLocation.lng,
    }));
    setIsPlacementMode(false);
    setShowAddLocationModal(true);
    setShowTapLocationSheet(false);
    setMapTapLocation(null);
  };

  const handleSavedLocationClick = (location: Location) => {
    focusLocationOnMap(location, { closeSavedModal: true });
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
        <HomeHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onProfileClick={() => navigate("/profile")}
          onSearchClick={() => setShowLocationSearchModal(true)}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
        />

        <div className="flex-1 relative">
          {activeTab === "explore" ? (
            <>
              <HomeMap
                center={dynamicMapCenter}
                locations={filteredLocations}
                favoriteLocations={favoriteLocations}
                userLocation={
                  latitude && longitude
                    ? { lat: latitude, lng: longitude }
                    : null
                }
                setMapRef={setMapRef}
                onLocationClick={handleLocationClick}
                onMapClick={handleMapClick}
                onToggleFavorite={toggleFavorite}
                // Global POI props commented out to focus on local POIs
                // onGlobalPOIClick={handleGlobalPOIClick}
                // selectedPOI={selectedPOI}
                showPOIs={false} // Disabled global POIs to focus on local ones
                hideBadges={true} // Always hide badges now since we have the saved tab
              />

              {!showLocationDetail &&
                !showAddLocationModal &&
                !showLocationSearchModal &&
                !showSavedLocationsModal && (
                  <HomeControls
                    onCurrentLocationClick={() => {
                      if (latitude && longitude) {
                        setDynamicMapCenter({ lat: latitude, lng: longitude });
                      }
                    }}
                    hasCurrentLocation={!!(latitude && longitude)}
                  />
                )}

              {showTapHint && (
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(15,23,42,0.85)",
                    color: "white",
                    padding: "12px 16px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 500,
                    zIndex: 1100,
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                  }}
                >
                  Tap anywhere on the map to place your location
                </div>
              )}
            </>
          ) : activeTab === "favorites" ? (
            <FavoriteLocationsList
              favoriteLocations={favoriteLocations}
              onLocationClick={handleLocationClick}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <SavedLocationsList
              locations={locations}
              onLocationClick={handleLocationClick}
              onToggleFavorite={toggleFavorite}
              onAddLocationRequest={() => {
                setActiveTab("explore");
                setIsPlacementMode(true);
                setShowTapHint(true);
                setShowTapLocationSheet(false);
                setMapTapLocation(null);
              }}
            />
          )}
        </div>

        <AddLocationModal
          isOpen={showAddLocationModal}
          onClose={() => {
            setShowAddLocationModal(false);
            setMapTapLocation(null);
            exitPlacementMode();
          }}
          addLocationData={addLocationData}
          setAddLocationData={setAddLocationData}
          onSubmit={handleAddLocation}
          isSubmitting={isSubmitting}
        />

        <LocationSearchModal
          isOpen={showLocationSearchModal}
          onClose={() => setShowLocationSearchModal(false)}
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

        <TapLocationSheet
          isOpen={showTapLocationSheet}
          coordinates={mapTapLocation}
          onAddLocation={handleMapTapAdd}
          onClose={exitPlacementMode}
        />
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: toastColors[toast.type],
            color: "white",
            padding: "12px 20px",
            borderRadius: "9999px",
            boxShadow: "0 15px 30px rgba(0,0,0,0.25)",
            fontWeight: 600,
            fontSize: "14px",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
