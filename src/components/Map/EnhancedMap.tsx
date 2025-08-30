import { useEffect, useRef, useState } from 'react';
import { POI, POIService } from '@/utils/poiService';

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: 'grocery' | 'restaurant-bar' | 'other';
  created_at: string;
}

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  name: string;
  category: string;
  color: string;
}

interface EnhancedMapProps {
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
}

export function EnhancedMap({ 
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
  hideBadges = false
}: EnhancedMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapState, setMapState] = useState({
    centerLat: latitude,
    centerLng: longitude,
    zoom: zoom,
    offsetX: 0,
    offsetY: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<string | null>(null);
  const [pois, setPOIs] = useState<POI[]>([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  
  // Pinch zoom state
  const [isPinching, setIsPinching] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  
  // Touch interaction state for better mobile support
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  const tileCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Convert locations to markers
  const markers: MapMarker[] = locations.map(loc => ({
    id: loc.id,
    lat: loc.latitude,
    lng: loc.longitude,
    name: loc.name,
    category: loc.category,
    color: getCategoryColor(loc.category)
  }));

  function getCategoryColor(category: string): string {
    switch (category) {
      case 'grocery': return '#10B981';
      case 'restaurant-bar': return '#F59E0B';
      default: return '#8B5CF6';
    }
  }

  function getCategoryIcon(category: string): string {
    switch (category) {
      case 'grocery': return '🛒';
      case 'restaurant-bar': return '🍽️';
      default: return '🏪';
    }
  }

  // Load POIs when map bounds change
  const loadPOIs = async () => {
    if (!showPOIs || mapState.zoom < 14) {
      setPOIs([]);
      return;
    }

    setIsLoadingPOIs(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Calculate bounds from current view
      const bounds = {
        north: mapState.centerLat + (0.01 * (18 - mapState.zoom)),
        south: mapState.centerLat - (0.01 * (18 - mapState.zoom)),
        east: mapState.centerLng + (0.01 * (18 - mapState.zoom)),
        west: mapState.centerLng - (0.01 * (18 - mapState.zoom))
      };

      const fetchedPOIs = await POIService.fetchPOIs(bounds);
      setPOIs(fetchedPOIs);
    } catch (error) {
      console.error('Error loading POIs:', error);
    } finally {
      setIsLoadingPOIs(false);
    }
  };

  // Map projection functions
  const rad2deg = (rad: number) => rad * (180 / Math.PI);

  const latLngToPixel = (lat: number, lng: number, zoom: number) => {
    const x = (lng + 180) / 360 * Math.pow(2, zoom) * 256;
    const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom) * 256;
    return { x, y };
  };

  const pixelToLatLng = (x: number, y: number, zoom: number) => {
    const lng = (x / (Math.pow(2, zoom) * 256)) * 360 - 180;
    const n = Math.PI - 2 * Math.PI * (y / (Math.pow(2, zoom) * 256));
    const lat = rad2deg(Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    return { lat, lng };
  };

  const latLngToTile = (lat: number, lng: number, zoom: number) => {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  };

  const loadTile = async (tileX: number, tileY: number, zoom: number): Promise<HTMLImageElement | null> => {
    const tileKey = `${zoom}/${tileX}/${tileY}`;
    
    if (tileCache.current.has(tileKey)) {
      return tileCache.current.get(tileKey)!;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        tileCache.current.set(tileKey, img);
        resolve(img);
      };
      
      img.onerror = () => resolve(null);
      
      img.src = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
    });
  };

  const drawMap = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#a0c4ff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate center pixel coordinates
    const centerPixel = latLngToPixel(mapState.centerLat, mapState.centerLng, mapState.zoom);
    const centerTile = latLngToTile(mapState.centerLat, mapState.centerLng, mapState.zoom);

    // Calculate how many tiles we need to cover the canvas
    const tilesX = Math.ceil(canvasWidth / 256) + 2;
    const tilesY = Math.ceil(canvasHeight / 256) + 2;

    // Draw tiles
    const tilePromises: Promise<void>[] = [];
    
    for (let dx = -Math.ceil(tilesX / 2); dx <= Math.ceil(tilesX / 2); dx++) {
      for (let dy = -Math.ceil(tilesY / 2); dy <= Math.ceil(tilesY / 2); dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;

        if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, mapState.zoom) || tileY >= Math.pow(2, mapState.zoom)) {
          continue;
        }

        const promise = loadTile(tileX, tileY, mapState.zoom).then((img) => {
          if (img) {
            const tilePixelX = tileX * 256;
            const tilePixelY = tileY * 256;
            
            const drawX = (canvasWidth / 2) + (tilePixelX - centerPixel.x) + mapState.offsetX;
            const drawY = (canvasHeight / 2) + (tilePixelY - centerPixel.y) + mapState.offsetY;

            ctx.drawImage(img, drawX, drawY, 256, 256);
          }
        });

        tilePromises.push(promise);
      }
    }

    // Wait for all tiles to load, then draw markers
    Promise.all(tilePromises).then(() => {
      // Draw POI markers first (behind saved locations)
      if (showPOIs && mapState.zoom >= 14) {
        pois.forEach((poi) => {
          const poiPixel = latLngToPixel(poi.latitude, poi.longitude, mapState.zoom);
          const poiX = (canvasWidth / 2) + (poiPixel.x - centerPixel.x) + mapState.offsetX;
          const poiY = (canvasHeight / 2) + (poiPixel.y - centerPixel.y) + mapState.offsetY;

          // Skip if POI is outside visible area
          if (poiX < -20 || poiX > canvasWidth + 20 || poiY < -30 || poiY > canvasHeight + 20) {
            return;
          }

          const isHovered = hoveredPOI === poi.id;
          const isSelected = selectedPOI?.id === poi.id;
          const poiSize = isHovered || isSelected ? 10 : 8;
          const poiColor = POIService.getCategoryColor(poi.category);
          
          // Draw POI marker (smaller than saved locations)
          ctx.fillStyle = poiColor;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(poiX, poiY, poiSize, 0, 2 * Math.PI);
          ctx.fill();

          // Draw white center
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(poiX, poiY, poiSize - 2, 0, 2 * Math.PI);
          ctx.fill();

          // Draw category icon (smaller)
          ctx.fillStyle = poiColor;
          ctx.font = `${poiSize - 1}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(POIService.getCategoryIcon(poi.category), poiX, poiY);

          // Draw selection ring if selected
          if (isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(poiX, poiY, poiSize + 2, 0, 2 * Math.PI);
            ctx.stroke();
          }

          ctx.globalAlpha = 1;
        });
      }

      // Draw location markers (on top of POIs)
      markers.forEach((marker) => {
        const markerPixel = latLngToPixel(marker.lat, marker.lng, mapState.zoom);
        const markerX = (canvasWidth / 2) + (markerPixel.x - centerPixel.x) + mapState.offsetX;
        const markerY = (canvasHeight / 2) + (markerPixel.y - centerPixel.y) + mapState.offsetY;

        // Skip if marker is outside visible area
        if (markerX < -20 || markerX > canvasWidth + 20 || markerY < -30 || markerY > canvasHeight + 20) {
          return;
        }

        const isHovered = hoveredMarker === marker.id;
        const isSelected = selectedLocationId === marker.id;
        const markerSize = isHovered || isSelected ? 16 : 12;
        
        // Draw marker shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(markerX + 1, markerY + markerSize + 1, markerSize * 0.8, 4, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Draw marker pin
        ctx.fillStyle = marker.color;
        ctx.beginPath();
        ctx.arc(markerX, markerY - markerSize / 2, markerSize, 0, 2 * Math.PI);
        ctx.fill();

        // Draw white center
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(markerX, markerY - markerSize / 2, markerSize - 3, 0, 2 * Math.PI);
        ctx.fill();

        // Draw category icon (simplified)
        ctx.fillStyle = marker.color;
        ctx.font = `${markerSize - 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getCategoryIcon(marker.category), markerX, markerY - markerSize / 2);

        // Draw marker pointer
        ctx.fillStyle = marker.color;
        ctx.beginPath();
        ctx.moveTo(markerX, markerY);
        ctx.lineTo(markerX - 6, markerY - markerSize);
        ctx.lineTo(markerX + 6, markerY - markerSize);
        ctx.closePath();
        ctx.fill();

        // Draw selection ring if selected
        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(markerX, markerY - markerSize / 2, markerSize + 3, 0, 2 * Math.PI);
          ctx.stroke();
        }
      });

      // Draw user location marker if enabled
      if (showUserLocation) {
        const userPixel = latLngToPixel(latitude, longitude, mapState.zoom);
        const userX = (canvasWidth / 2) + (userPixel.x - centerPixel.x) + mapState.offsetX;
        const userY = (canvasHeight / 2) + (userPixel.y - centerPixel.y) + mapState.offsetY;

        // Skip if user location is outside visible area
        if (userX >= -20 && userX <= canvasWidth + 20 && userY >= -20 && userY <= canvasHeight + 20) {
          // Outer pulse ring
          ctx.strokeStyle = '#4285f4';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(userX, userY, 20, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Inner pulse ring  
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(userX, userY, 15, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Main blue dot with white border
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(userX, userY, 12, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.fillStyle = '#4285f4';
          ctx.beginPath();
          ctx.arc(userX, userY, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Inner white dot for better visibility
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(userX, userY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
  };

  // Mouse/Touch event handlers
  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0]?.clientX || 0, y: e.touches[0]?.clientY || 0 };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };


  const getMarkerAtPosition = (x: number, y: number): Location | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const centerPixel = latLngToPixel(mapState.centerLat, mapState.centerLng, mapState.zoom);

    for (const location of locations) {
      const markerPixel = latLngToPixel(location.latitude, location.longitude, mapState.zoom);
      const markerX = (canvas.width / 2) + (markerPixel.x - centerPixel.x) + mapState.offsetX;
      const markerY = (canvas.height / 2) + (markerPixel.y - centerPixel.y) + mapState.offsetY;

      const distance = Math.sqrt(
        Math.pow(canvasX - markerX, 2) + Math.pow(canvasY - (markerY - 6), 2)
      );

      // Larger touch target for mobile devices
      const touchRadius = 'ontouchstart' in window ? 35 : 20;
      if (distance <= touchRadius) {
        return location;
      }
    }

    return null;
  };

  const getPOIAtPosition = (x: number, y: number): POI | null => {
    if (!showPOIs || mapState.zoom < 14) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const centerPixel = latLngToPixel(mapState.centerLat, mapState.centerLng, mapState.zoom);

    for (const poi of pois) {
      const poiPixel = latLngToPixel(poi.latitude, poi.longitude, mapState.zoom);
      const poiX = (canvas.width / 2) + (poiPixel.x - centerPixel.x) + mapState.offsetX;
      const poiY = (canvas.height / 2) + (poiPixel.y - centerPixel.y) + mapState.offsetY;

      const distance = Math.sqrt(
        Math.pow(canvasX - poiX, 2) + Math.pow(canvasY - poiY, 2)
      );

      // Larger touch target for mobile devices
      const touchRadius = 'ontouchstart' in window ? 35 : 20;
      if (distance <= touchRadius) {
        return poi;
      }
    }

    return null;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only prevent default for mouse events, not touch events (to allow native pinch zoom)
    if (!('touches' in e)) {
      e.preventDefault();
    }
    
    if ('touches' in e && e.touches.length === 2) {
      // For now, let native pinch zoom handle this
      return;
    } else if ('touches' in e && e.touches.length === 1) {
      // Single touch - start dragging
      const pos = getEventPosition(e);
      setIsDragging(true);
      setLastMousePos(pos);
      setTouchStartPos(pos);
      setIsPinching(false);
      setHasMoved(false);
    } else {
      // Mouse event - start dragging  
      const pos = getEventPosition(e);
      setIsDragging(true);
      setLastMousePos(pos);
      setTouchStartPos(pos);
      setIsPinching(false);
      setHasMoved(false);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    // Skip pinch zoom handling for now - let native handle it
    if ('touches' in e && e.touches.length === 2) {
      return;
    }

    const pos = getEventPosition(e);

    // Handle hover for desktop
    if (!isDragging && !isPinching && 'clientX' in e) {
      const marker = getMarkerAtPosition(pos.x, pos.y);
      const poi = getPOIAtPosition(pos.x, pos.y);
      setHoveredMarker(marker ? marker.id : null);
      setHoveredPOI(poi ? poi.id : null);
    }

    if (!isDragging || isPinching) return;
    e.preventDefault();

    const deltaX = pos.x - lastMousePos.x;
    const deltaY = pos.y - lastMousePos.y;
    
    // Track if user has moved significantly (helps distinguish tap vs drag on mobile)
    const totalMovement = Math.sqrt(
      Math.pow(pos.x - touchStartPos.x, 2) + Math.pow(pos.y - touchStartPos.y, 2)
    );
    if (totalMovement > 5) {
      setHasMoved(true);
    }

    setMapState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY
    }));

    setLastMousePos(pos);
  };

  const handleEnd = () => {
    if (isDragging) {
      const canvas = canvasRef.current;
      if (canvas) {
        const centerPixel = latLngToPixel(mapState.centerLat, mapState.centerLng, mapState.zoom);
        const newCenterPixelX = centerPixel.x - mapState.offsetX;
        const newCenterPixelY = centerPixel.y - mapState.offsetY;
        const newCenter = pixelToLatLng(newCenterPixelX, newCenterPixelY, mapState.zoom);

        setMapState(prev => ({
          ...prev,
          centerLat: newCenter.lat,
          centerLng: newCenter.lng,
          offsetX: 0,
          offsetY: 0
        }));
      }
    }
    setIsDragging(false);
    setIsPinching(false);
    setLastPinchDistance(0);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    // Don't handle click if user was dragging (especially on mobile)
    if (hasMoved) return;

    const pos = { x: e.clientX, y: e.clientY };
    
    // Check if clicking on a saved location marker (higher priority)
    const clickedLocation = getMarkerAtPosition(pos.x, pos.y);
    if (clickedLocation && onMarkerClick) {
      onMarkerClick(clickedLocation);
      return;
    }

    // Check if clicking on a POI
    const clickedPOI = getPOIAtPosition(pos.x, pos.y);
    if (clickedPOI && onPOIClick) {
      onPOIClick(clickedPOI);
      return;
    }

    // Handle map click
    if (onMapClick) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const centerPixel = latLngToPixel(mapState.centerLat, mapState.centerLng, mapState.zoom);
      const worldX = centerPixel.x + (clickX - canvas.width / 2) - mapState.offsetX;
      const worldY = centerPixel.y + (clickY - canvas.height / 2) - mapState.offsetY;
      
      const clickCoords = pixelToLatLng(worldX, worldY, mapState.zoom);
      onMapClick(clickCoords.lat, clickCoords.lng);
    }
  };

  const handleZoom = (delta: number) => {
    setMapState(prev => ({
      ...prev,
      zoom: Math.max(1, Math.min(18, prev.zoom + delta))
      // Keep existing offsets for smoother zoom
    }));
  };

  // Update map state when props change
  useEffect(() => {
    setMapState(prev => ({
      ...prev,
      centerLat: latitude,
      centerLng: longitude,
      zoom: zoom
    }));
  }, [latitude, longitude, zoom]);

  // Load POIs when map state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPOIs();
    }, 300); // Debounce POI loading

    return () => clearTimeout(timeoutId);
  }, [mapState.centerLat, mapState.centerLng, mapState.zoom, showPOIs]);

  // Redraw map when state changes
  useEffect(() => {
    drawMap();
  }, [mapState, markers, hoveredMarker, selectedLocationId, pois, hoveredPOI, selectedPOI, showPOIs, showUserLocation, latitude, longitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    drawMap();
  }, []);

  // Calculate user location marker position for CSS overlay
  const userLocationStyle = showUserLocation ? (() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const centerPixel = latLngToPixel(mapState.centerLat, mapState.centerLng, mapState.zoom);
    const userPixel = latLngToPixel(latitude, longitude, mapState.zoom);
    const userX = (canvas.width / 2) + (userPixel.x - centerPixel.x) + mapState.offsetX;
    const userY = (canvas.height / 2) + (userPixel.y - centerPixel.y) + mapState.offsetY;
    
    return {
      position: 'absolute' as const,
      left: `${userX}px`,
      top: `${userY}px`,
      transform: 'translate(-50%, -50%)',
      width: '24px',
      height: '24px',
      background: '#4285f4',
      borderRadius: '50%',
      border: '4px solid white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 8px rgba(66, 133, 244, 0.2)',
      zIndex: 500,
      animation: 'pulse 2s infinite',
      pointerEvents: 'none' as const
    };
  })() : null;

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'manipulation'  // Allow pinch zoom but prevent other touch actions
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onClick={handleMapClick}
      />
      
      {/* User Location CSS Overlay Marker */}
      {userLocationStyle && (
        <>
          <style>
            {`
              @keyframes pulse {
                0% {
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(66, 133, 244, 0.4);
                }
                50% {
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 8px rgba(66, 133, 244, 0.2);
                }
                100% {
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 16px rgba(66, 133, 244, 0);
                }
              }
            `}
          </style>
          <div style={userLocationStyle}></div>
        </>
      )}
      
      {/* Map Controls */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000
      }}>
        <button
          onClick={() => handleZoom(1)}
          style={{
            width: '48px', 
            height: '48px', 
            background: 'var(--tg-theme-bg-color, white)', 
            color: 'var(--tg-theme-text-color, #333)',
            border: '2px solid var(--tg-theme-section-separator-color)', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            fontSize: '22px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          +
        </button>
        <button
          onClick={() => handleZoom(-1)}
          style={{
            width: '48px', 
            height: '48px', 
            background: 'var(--tg-theme-bg-color, white)', 
            color: 'var(--tg-theme-text-color, #333)',
            border: '2px solid var(--tg-theme-section-separator-color)', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            fontSize: '22px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          −
        </button>
      </div>

      {/* Location count badge */}
      {!hideBadges && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000
        }}>
          {locations.length > 0 && (
            <div style={{
              background: 'var(--tg-theme-button-color, #0088cc)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}>
              {locations.length} saved location{locations.length !== 1 ? 's' : ''}
            </div>
          )}
          
          {showPOIs && mapState.zoom >= 14 && (
            <div style={{
              background: isLoadingPOIs ? 'var(--tg-theme-hint-color, #999)' : 'var(--tg-theme-secondary-bg-color, #f1f3f4)',
              color: isLoadingPOIs ? 'white' : 'var(--tg-theme-text-color, #000)',
              padding: '6px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: '500',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}>
              {isLoadingPOIs ? 'Loading POIs...' : `${pois.length} POI${pois.length !== 1 ? 's' : ''}`}
            </div>
          )}
          
          {showPOIs && mapState.zoom < 14 && (
            <div style={{
              background: 'var(--tg-theme-hint-color, #999)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: '500',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}>
              Zoom in to see POIs
            </div>
          )}
        </div>
      )}
    </div>
  );
}