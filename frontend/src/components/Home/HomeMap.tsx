import { useEffect } from "react";
import { LeafletMap } from "./LeafletMap";
// Global POI imports commented out to focus on local POIs
// import { POI } from "@/utils/poiService";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
}

interface HomeMapProps {
  center: { lat: number; lng: number };
  locations: Location[];
  favoriteLocations: Location[];
  userLocation: { lat: number; lng: number } | null;
  setMapRef: (map: any) => void;
  onLocationClick: (location: Location) => void;
  onToggleFavorite: (locationId: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  // Global POI props commented out to focus on local POIs
  // onGlobalPOIClick?: (poi: POI) => void;
  // selectedPOI?: POI | null;
  showPOIs?: boolean;
  hideBadges?: boolean;
  onSavedLocationsBadgeClick?: () => void;
}


export function HomeMap({
  center,
  locations,
  userLocation,
  setMapRef,
  onLocationClick,
  onMapClick,
  // Global POI props commented out to focus on local POIs
  // onGlobalPOIClick,
  // selectedPOI,
  showPOIs = true,
  hideBadges = false,
  onSavedLocationsBadgeClick,
}: HomeMapProps) {
  // Always use the center prop - this allows user to freely navigate
  // The parent component (HomePage) handles initial GPS positioning
  const mapCenter = center;

  useEffect(() => {
    return () => {
      setMapRef(null);
    };
  }, [setMapRef]);
  
  return (
    <LeafletMap
      latitude={mapCenter.lat}
      longitude={mapCenter.lng}
      zoom={13}
      height="100%"
      locations={locations}
      showUserLocation={!!userLocation}
      userLocation={userLocation}
      onMarkerClick={onLocationClick}
      onMapClick={onMapClick}
      // Global POI props commented out to focus on local POIs
      // onGlobalPOIClick={onGlobalPOIClick}
      selectedLocationId={undefined} // You can add this to props if needed
      // selectedPOI={selectedPOI}
      showPOIs={showPOIs}
      hideBadges={hideBadges}
      onSavedLocationsBadgeClick={onSavedLocationsBadgeClick}
      setMapRef={setMapRef}
    />
  );
}
