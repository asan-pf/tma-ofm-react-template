import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { POI, POIService } from "@/utils/poiService";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (location: Location) => void;
  onPOIClick?: (poi: POI) => void;
  locations?: Location[];
  showUserLocation?: boolean;
  selectedLocationId?: number;
  showPOIs?: boolean;
  selectedPOI?: POI | null;
  hideBadges?: boolean;
  onSavedLocationsBadgeClick?: () => void;
}

// Custom icons for different categories
const createCategoryIcon = (category: string, isSelected: boolean = false) => {
  const colors = {
    grocery: '#10B981',
    'restaurant-bar': '#F59E0B',
    other: '#8B5CF6'
  };
  
  const color = colors[category as keyof typeof colors] || colors.other;
  const size = isSelected ? 35 : 25;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isSelected ? 'box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.8);' : ''}
      ">
        ${getCategoryIcon(category)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Create POI icon
const createPOIIcon = (poi: POI, isSelected: boolean = false) => {
  const color = POIService.getCategoryColor(poi.category);
  const size = isSelected ? 25 : 20;
  
  return L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.4}px;
        opacity: 0.85;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        ${isSelected ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.9);' : ''}
      ">
        ${POIService.getCategoryIcon(poi.category)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Create user location icon
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        background: #4285f4;
        border: 4px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 8px rgba(66, 133, 244, 0.2);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(66, 133, 244, 0.4); }
          50% { box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 8px rgba(66, 133, 244, 0.2); }
          100% { box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 16px rgba(66, 133, 244, 0); }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function getCategoryIcon(category: string): string {
  switch (category) {
    case "grocery":
      return "🛒";
    case "restaurant-bar":
      return "🍽️";
    default:
      return "🏪";
  }
}

// Component for handling map events
function MapEventHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component for managing POIs
function POIManager({ 
  showPOIs, 
  onPOIClick, 
  selectedPOI 
}: { 
  showPOIs: boolean;
  onPOIClick?: (poi: POI) => void;
  selectedPOI?: POI | null;
}) {
  const map = useMap();
  const [pois, setPOIs] = useState<POI[]>([]);

  useEffect(() => {
    if (!showPOIs || map.getZoom() < 14) {
      setPOIs([]);
      return;
    }

    const loadPOIs = async () => {
      try {
        const bounds = map.getBounds();
        const fetchBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };

        const fetchedPOIs = await POIService.fetchPOIs(fetchBounds);
        setPOIs(fetchedPOIs);
      } catch (error) {
        console.error("Error loading POIs:", error);
      }
    };

    const timeoutId = setTimeout(loadPOIs, 300);
    return () => clearTimeout(timeoutId);
  }, [map, showPOIs]);

  // Listen to map move events
  useMapEvents({
    moveend: () => {
      if (showPOIs && map.getZoom() >= 14) {
        const bounds = map.getBounds();
        const fetchBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };

        POIService.fetchPOIs(fetchBounds).then(setPOIs).catch(console.error);
      }
    },
    zoomend: () => {
      if (!showPOIs || map.getZoom() < 14) {
        setPOIs([]);
      }
    }
  });

  return (
    <>
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.latitude, poi.longitude]}
          icon={createPOIIcon(poi, selectedPOI?.id === poi.id)}
          eventHandlers={{
            click: () => onPOIClick?.(poi),
          }}
        >
          <Popup>
            <div>
              <strong>{poi.name}</strong>
              <small>Category: {poi.category}</small>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// Map center updater component
function MapCenterUpdater({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], zoom);
  }, [map, latitude, longitude, zoom]);

  return null;
}

export function LeafletMap({
  latitude,
  longitude,
  zoom = 13,
  height = "400px",
  onMapClick,
  onMarkerClick,
  onPOIClick,
  locations = [],
  showUserLocation = true,
  selectedLocationId,
  showPOIs = true,
  selectedPOI = null,
  hideBadges = false,
  onSavedLocationsBadgeClick,
}: LeafletMapProps) {

  return (
    <div
      style={{
        width: "100%",
        height: height,
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        touchZoom={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        dragging={true}
        attributionControl={true}
      >
        {/* OSM Tile Layer */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Map Event Handler */}
        <MapEventHandler onMapClick={onMapClick} />

        {/* Center updater */}
        <MapCenterUpdater latitude={latitude} longitude={longitude} zoom={zoom} />

        {/* POI Manager */}
        <POIManager 
          showPOIs={showPOIs}
          onPOIClick={onPOIClick}
          selectedPOI={selectedPOI}
        />

        {/* User Location Marker */}
        {showUserLocation && (
          <Marker
            position={[latitude, longitude]}
            icon={createUserLocationIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <div>
                <strong>📍 Your Location</strong>
                <p>{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Saved Location Markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createCategoryIcon(location.category, selectedLocationId === location.id)}
            eventHandlers={{
              click: () => onMarkerClick?.(location),
            }}
            zIndexOffset={500}
          >
            <Popup>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{getCategoryIcon(location.category)}</span>
                  <strong>{location.name}</strong>
                </div>
                {location.description && <p>{location.description}</p>}
                <small>Added: {new Date(location.created_at).toLocaleDateString()}</small>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>


      {/* Location count badge */}
      {!hideBadges && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 1000,
          }}
        >
          {locations.length > 0 && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSavedLocationsBadgeClick?.();
              }}
              style={{
                background: "var(--tg-theme-button-color, #0088cc)",
                color: "white",
                padding: "8px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                cursor: onSavedLocationsBadgeClick ? "pointer" : "default",
                transition: "transform 0.15s ease",
                touchAction: "manipulation",
              }}
              onTouchStart={(e) => {
                if (onSavedLocationsBadgeClick) {
                  e.currentTarget.style.transform = "scale(0.95)";
                }
              }}
              onTouchEnd={(e) => {
                if (onSavedLocationsBadgeClick) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
              onMouseDown={(e) => {
                if (onSavedLocationsBadgeClick) {
                  e.currentTarget.style.transform = "scale(0.95)";
                }
              }}
              onMouseUp={(e) => {
                if (onSavedLocationsBadgeClick) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
              onMouseLeave={(e) => {
                if (onSavedLocationsBadgeClick) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {locations.length} saved location
              {locations.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}