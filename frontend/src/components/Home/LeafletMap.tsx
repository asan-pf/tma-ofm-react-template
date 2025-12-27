import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  AttributionControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// Global POI imports commented out to focus on local POIs
// import { POI, POIService } from "@/utils/poiService";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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
  // onGlobalPOIClick?: (poi: POI) => void;
  locations?: Location[];
  showUserLocation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  selectedLocationId?: number;
  showPOIs?: boolean;
  // selectedPOI?: POI | null;
  hideBadges?: boolean;
  onSavedLocationsBadgeClick?: () => void;
  setMapRef?: (map: any) => void;
}

// Custom icons for database POIs (saved locations) - larger, more prominent style
const createCategoryIcon = (category: string, isSelected: boolean = false) => {
  const colors = {
    grocery: "#10B981",
    "restaurant-bar": "#F59E0B",
    other: "#8B5CF6",
  };

  const color = colors[category as keyof typeof colors] || colors.other;
  const size = isSelected ? 35 : 28;

  return L.divIcon({
    className: "database-poi-marker",
    html: `
      <div style="
        background: ${color};
        border: 4px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        position: relative;
        ${
          isSelected
            ? "box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.9);"
            : ""
        }
      ">
        ${getCategoryIcon(category)}
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #4285f4;
          border: 2px solid white;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        ">💾</div>
      </div>
    `,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
  });
};

// Create POI icon for global POIs (OpenStreetMap) - COMMENTED OUT TO FOCUS ON LOCAL POIs
/*
const createPOIIcon = (poi: POI, isSelected: boolean = false) => {
  const color = POIService.getCategoryColor(poi.category);
  const size = isSelected ? 22 : 16;

  return L.divIcon({
    className: "global-poi-marker",
    html: `
      <div style="
        background: ${color};
        border: 1px solid white;
        border-radius: 4px;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        opacity: 0.9;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        position: relative;
        ${
          isSelected
            ? "box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.9); transform: scale(1.1);"
            : ""
        }
      ">
        ${POIService.getCategoryIcon(poi.category)}
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ff6b35;
          border: 1px solid white;
          border-radius: 50%;
          width: 8px;
          height: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 6px;
        ">🌐</div>
      </div>
    `,
    iconSize: [size + 2, size + 2],
    iconAnchor: [(size + 2) / 2, (size + 2) / 2],
  });
};
*/

// Create user location icon
const createUserLocationIcon = () => {
  return L.divIcon({
    className: "user-location-marker",
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
function MapEventHandler({
  onMapClick,
  setMapRef,
}: {
  onMapClick?: (lat: number, lng: number) => void;
  setMapRef?: (map: any) => void;
}) {
  const map = useMap();
  
  // Set the map reference when component mounts
  useEffect(() => {
    if (setMapRef && map) {
      setMapRef(map);
    }
  }, [map, setMapRef]);

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component for managing POIs with clustering - COMMENTED OUT TO FOCUS ON LOCAL POIs
/*
function POIManager({
  showPOIs,
  // onGlobalPOIClick,
  selectedPOI,
}: {
  showPOIs: boolean;
  // onGlobalPOIClick?: (poi: POI) => void;
  // selectedPOI?: POI | null;
}) {
  const map = useMap();
  const [pois, setPOIs] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [clusterGroup, setClusterGroup] = useState<L.MarkerClusterGroup | null>(null);

  // Zoom level thresholds for performance optimization - more restrictive for global POIs
  const MIN_GLOBAL_POI_ZOOM = 17; // Only show global POIs at maximum zoom levels
  const MIN_CLUSTER_POI_ZOOM = 13; // Show clustered POIs from medium zoom
  const CLEAR_POI_ZOOM = 11; // Clear all POIs when zoomed out below this

  // Initialize cluster group
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: MIN_GLOBAL_POI_ZOOM,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let c = ' marker-cluster-';
        if (count < 10) {
          c += 'small';
        } else if (count < 100) {
          c += 'medium';
        } else {
          c += 'large';
        }
        
        return new L.DivIcon({ 
          html: `<div><span>${count}</span></div>`, 
          className: 'marker-cluster' + c, 
          iconSize: new L.Point(40, 40) 
        });
      }
    });
    
    map.addLayer(cluster);
    setClusterGroup(cluster);
    
    return () => {
      if (map.hasLayer(cluster)) {
        map.removeLayer(cluster);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!showPOIs || !clusterGroup) {
      if (clusterGroup) {
        clusterGroup.clearLayers();
      }
      setPOIs([]);
      return;
    }

    const loadPOIs = async () => {
      if (isLoading) return; // Prevent concurrent requests

      try {
        // Only load global POIs if zoomed in enough for clusters or individual markers
        if (map.getZoom() < MIN_CLUSTER_POI_ZOOM) {
          return;
        }

        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(loadPOIs, 300);
    return () => clearTimeout(timeoutId);
  }, [map, showPOIs, isLoading, clusterGroup]);

  // Update cluster markers when POIs change
  useEffect(() => {
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    if (currentZoom >= MIN_CLUSTER_POI_ZOOM) {
      pois.forEach((poi) => {
        const marker = L.marker([poi.latitude, poi.longitude], {
          icon: createPOIIcon(poi, selectedPOI?.id === poi.id),
        });

        marker.bindPopup(`
          <div>
            <strong>${poi.name}</strong><br/>
            <small style="color: #666">Category: ${poi.category}</small>
          </div>
        `);

        marker.on('click', () => {
          onGlobalPOIClick?.(poi);
        });

        clusterGroup.addLayer(marker);
      });
    }
  }, [pois, clusterGroup, currentZoom, selectedPOI, onGlobalPOIClick]);

  // Listen to map move events
  useMapEvents({
    moveend: () => {
      if (showPOIs && map.getZoom() >= MIN_CLUSTER_POI_ZOOM && !isLoading) {
        const bounds = map.getBounds();
        const fetchBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };

        // Debounce POI loading to prevent too many requests
        setTimeout(() => {
          if (!isLoading) {
            setIsLoading(true);
            POIService.fetchPOIs(fetchBounds)
              .then(setPOIs)
              .catch(console.error)
              .finally(() => setIsLoading(false));
          }
        }, 200);
      } else if (!showPOIs || map.getZoom() < CLEAR_POI_ZOOM) {
        // Clear POIs when zoomed out or POIs are disabled
        setPOIs([]);
      }
    },
    zoomend: () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);

      if (!showPOIs) {
        setPOIs([]);
        return;
      }

      if (newZoom < CLEAR_POI_ZOOM) {
        // Clear all global POIs when zoomed out significantly
        setPOIs([]);
      } else if (newZoom >= MIN_CLUSTER_POI_ZOOM && !isLoading) {
        // Load/reload global POIs for medium to high zoom levels
        const bounds = map.getBounds();
        const fetchBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };

        setTimeout(() => {
          if (!isLoading) {
            setIsLoading(true);
            POIService.fetchPOIs(fetchBounds)
              .then(setPOIs)
              .catch(console.error)
              .finally(() => setIsLoading(false));
          }
        }, 250);
      }
    },
  });

  return null; // All rendering is handled by the cluster group
}
*/

// Map center updater component
function MapCenterUpdater({
  latitude,
  longitude,
  zoom,
}: {
  latitude: number;
  longitude: number;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], zoom);
  }, [map, latitude, longitude, zoom]);

  return null;
}

// Component for managing zoom-based database location rendering
function DatabaseLocationManager({
  locations,
  selectedLocationId,
  onMarkerClick,
}: {
  locations: Location[];
  selectedLocationId?: number;
  onMarkerClick?: (location: Location) => void;
}) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Zoom level threshold for showing database locations - much lower zoom to show from farther
  const MIN_DATABASE_POI_ZOOM = 8; // Show database POIs from farther zoom level

  useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });

  // Function to handle location click
  const handleLocationClick = (location: Location) => {
    onMarkerClick?.(location);
  };

  // Only show database locations if zoom level is high enough
  const shouldShowDatabasePOIs = currentZoom >= MIN_DATABASE_POI_ZOOM;

  return (
    <>
      {shouldShowDatabasePOIs &&
        locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createCategoryIcon(
              location.category,
              selectedLocationId === location.id
            )}
            eventHandlers={{
              click: () => handleLocationClick(location),
            }}
            zIndexOffset={500}
          >
            <Popup>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>
                    {getCategoryIcon(location.category)}
                  </span>
                  <strong>{location.name}</strong>
                </div>
                {location.description && <p>{location.description}</p>}
                <small>
                  Added: {new Date(location.created_at).toLocaleDateString()}
                </small>
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
}


export function LeafletMap({
  latitude,
  longitude,
  zoom = 13,
  height = "400px",
  onMapClick,
  onMarkerClick,
  // onGlobalPOIClick,
  locations = [],
  showUserLocation = true,
  userLocation,
  selectedLocationId,
  // showPOIs = true, // Commented out since global POIs are disabled
  // selectedPOI = null,
  hideBadges = false,
  onSavedLocationsBadgeClick,
  setMapRef,
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
        attributionControl={false}
      >
        {/* OSM Tile Layer */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Powered by <a href="https://leafletjs.com/">Leaflet</a>'
          maxZoom={19}
        />

        {/* Map Event Handler */}
        <MapEventHandler onMapClick={onMapClick} setMapRef={setMapRef} />

        {/* Center updater */}
        <MapCenterUpdater
          latitude={latitude}
          longitude={longitude}
          zoom={zoom}
        />

        {/* POI Manager for global POIs - COMMENTED OUT TO FOCUS ON LOCAL POIs */}
        {/* <POIManager
          showPOIs={showPOIs}
          onGlobalPOIClick={onGlobalPOIClick}
          selectedPOI={selectedPOI}
        /> */}

        {/* User Location Marker */}
        {showUserLocation && userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserLocationIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <div>
                <strong>📍 Your Location</strong>
                <p>
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Database Location Manager for saved locations */}
        <DatabaseLocationManager
          locations={locations}
          selectedLocationId={selectedLocationId}
          onMarkerClick={onMarkerClick}
        />

        {/* Custom Attribution Control */}
        <AttributionControl position="bottomleft" />
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
