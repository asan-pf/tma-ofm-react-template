import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, Plus, X, Search, Navigation2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationAddedModal } from '@/components/LocationAddedModal';
import { LocationSearch } from '@/components/LocationSearch';
import { UserService } from '@/utils/userService';
import { initDataState, useSignal } from '@telegram-apps/sdk-react';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  name: string;
  description: string;
  category: 'grocery' | 'restaurant-bar' | 'other';
  latitude: number;
  longitude: number;
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function AddLocationPage() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationData, setLocationData] = useState<Partial<LocationData>>({
    name: '',
    description: '',
    category: 'other'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationAddedModal, setShowLocationAddedModal] = useState(false);
  const [newlyAddedLocation, setNewlyAddedLocation] = useState<any>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const { latitude, longitude, error: geoError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });

  const navigate = useNavigate();
  const initData = useSignal(initDataState);

  useEffect(() => {
    if (latitude && longitude && !mapCenter) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude, mapCenter]);


  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setLocationData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleSubmit = async () => {
    if (!selectedLocation || !locationData.name) return;

    setIsSubmitting(true);
    try {
      const telegramUser = initData?.user;
      if (!telegramUser) {
        throw new Error('Telegram user data not available');
      }

      // Get or create user
      const user = await UserService.getOrCreateUser(telegramUser);
      if (!user) {
        throw new Error('Failed to get user data');
      }

      // Create location
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const locationResponse = await fetch(`${BACKEND_URL}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: locationData.name,
          description: locationData.description || '',
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          category: locationData.category,
          userId: user.id
        })
      });

      if (!locationResponse.ok) {
        throw new Error('Failed to create location');
      }

      // Success - show success modal instead of navigating
      const addedLocation = await locationResponse.json();
      setNewlyAddedLocation(addedLocation);
      setShowLocationAddedModal(true);
      
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to add location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mapCenter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            {geoError ? (
              <>
                <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Search for a Location
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Location access is disabled. Search for a place to get started.
                </p>
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={() => setShowSearchModal(true)} 
                    size="lg"
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search for a place...
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6">
                  <Navigation2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Finding Your Location
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please allow location access when prompted
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Location
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tap on the map to add a new place
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Full Screen Modal with Map and Form */}
      <div className="fixed inset-0 z-30 bg-white dark:bg-gray-900 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {selectedLocation ? 'Add Location Details' : 'Select Location'}
          </h2>
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Section */}
        <div className="relative flex-1 min-h-[250px]">
          <LeafletMapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-medium">New Location</p>
                    <p className="text-sm text-gray-600">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </LeafletMapContainer>

          {/* Instructions overlay */}
          {!selectedLocation && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="bg-blue-600 text-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    Tap anywhere on the map to add a location
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Section - Always visible at bottom */}
        {selectedLocation && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 max-h-[50vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                value={locationData.name || ''}
                onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Central Coffee Shop"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={locationData.description || ''}
                onChange={(e) => setLocationData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this place..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'grocery', label: '🛒 Grocery', icon: '🛒' },
                  { value: 'restaurant-bar', label: '🍕 Food & Drink', icon: '🍕' },
                  { value: 'other', label: '📦 Other', icon: '📦' }
                ].map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setLocationData(prev => ({ ...prev, category: category.value as any }))}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      locationData.category === category.value
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{category.icon}</div>
                      <div className="text-xs">
                        {category.label.replace(/^.+ /, '')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={!locationData.name || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Adding Location...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add Location
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Location will be reviewed before appearing on the map
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Search Location
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <LocationSearch
              onLocationSelect={(lat, lng) => {
                setMapCenter({ lat, lng });
                setShowSearchModal(false);
              }}
              placeholder="Search for places, addresses..."
              showCurrentLocation={false}
            />
          </div>
        </div>
      )}

      {/* Location Added Success Modal */}
      {newlyAddedLocation && (
        <LocationAddedModal
          location={newlyAddedLocation}
          isOpen={showLocationAddedModal}
          onClose={() => {
            setShowLocationAddedModal(false);
            setNewlyAddedLocation(null);
            navigate('/'); // Navigate back after closing success modal
          }}
          onViewLocation={(location) => {
            // Navigate back with location data
            navigate('/', { state: { viewLocation: location } });
          }}
        />
      )}
    </div>
  );
}