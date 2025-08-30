import { EnhancedMap } from "./EnhancedMap";
import { POI } from "@/utils/poiService";

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
  onPOIClick?: (poi: POI) => void;
  selectedPOI?: POI | null;
  showPOIs?: boolean;
  hideBadges?: boolean;
}


export function MapView({
  center,
  locations,
  userLocation,
  onLocationClick,
  onPOIClick,
  selectedPOI,
  showPOIs = true,
  hideBadges = false,
}: MapViewProps) {
  // Convert user location for EnhancedMap
  const mapCenter = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : center;
  
  return (
    <EnhancedMap
      latitude={mapCenter.lat}
      longitude={mapCenter.lng}
      zoom={13}
      height="100%"
      locations={locations}
      showUserLocation={!!userLocation}
      onMarkerClick={onLocationClick}
      onPOIClick={onPOIClick}
      selectedLocationId={undefined} // You can add this to props if needed
      selectedPOI={selectedPOI}
      showPOIs={showPOIs}
      hideBadges={hideBadges}
    />
  );
}
