import { LeafletMap } from "./LeafletMap";
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
  onGlobalPOIClick?: (poi: POI) => void;
  onNavigateToLocation?: (lat: number, lng: number, zoom?: number) => void;
  selectedPOI?: POI | null;
  showPOIs?: boolean;
  hideBadges?: boolean;
  onSavedLocationsBadgeClick?: () => void;
}


export function MapView({
  center,
  locations,
  userLocation,
  onLocationClick,
  onPOIClick,
  onGlobalPOIClick,
  onNavigateToLocation,
  selectedPOI,
  showPOIs = true,
  hideBadges = false,
  onSavedLocationsBadgeClick,
}: MapViewProps) {
  // Convert user location for LeafletMap
  const mapCenter = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : center;
  
  return (
    <LeafletMap
      latitude={mapCenter.lat}
      longitude={mapCenter.lng}
      zoom={13}
      height="100%"
      locations={locations}
      showUserLocation={!!userLocation}
      onMarkerClick={onLocationClick}
      onPOIClick={onPOIClick}
      onGlobalPOIClick={onGlobalPOIClick}
      onNavigateToLocation={onNavigateToLocation}
      selectedLocationId={undefined} // You can add this to props if needed
      selectedPOI={selectedPOI}
      showPOIs={showPOIs}
      hideBadges={hideBadges}
      onSavedLocationsBadgeClick={onSavedLocationsBadgeClick}
    />
  );
}
