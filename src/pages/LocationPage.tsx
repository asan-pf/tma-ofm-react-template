import { MapPin, RefreshCw, Navigation2, Search, Star, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  Button, 
  Cell, 
  Section, 
  List, 
  Modal, 
  Banner, 
  Input,
  Avatar,
  IconButton
} from '@telegram-apps/telegram-ui';
import { initDataState, useSignal } from '@telegram-apps/sdk-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { InteractiveMap } from '@/components/Map/InteractiveMap';
import { Page } from '@/components/Page';
import { LocationDetailModal } from '@/components/LocationDetailModal';

/**
 * Represents a location in the system
 */
interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: 'grocery' | 'restaurant-bar' | 'other';
  created_at: string;
  user_id?: number;
  is_approved?: boolean;
}

/**
 * User profile data from Telegram
 */
interface UserProfile {
  id: number;
  telegram_id: string;
  nickname: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

/**
 * Map center coordinates
 */
interface MapCenter {
  lat: number;
  lng: number;
}

/**
 * Main location page component that displays an interactive map and location management UI
 * Features:
 * - Interactive map with pan/zoom capabilities
 * - Location search functionality
 * - Add new locations by clicking on map
 * - View and navigate to existing locations
 * - User profile management
 */
export function LocationPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<MapCenter | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<MapCenter | null>(null);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDescription, setNewLocationDescription] = useState('');
  const [newLocationCategory, setNewLocationCategory] = useState<'grocery' | 'restaurant-bar' | 'other'>('other');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [locationRatings, setLocationRatings] = useState<Record<number, { average: number; count: number }>>({});
  
  const initDataState_ = useSignal(initDataState);
  const telegramUser = initDataState_?.user;
  
  const location = useGeolocation({
    enableHighAccuracy: false,
    timeout: 5000, // Much shorter timeout
    maximumAge: 300000,
  });

  const { loading, error, latitude, longitude } = location;
  
  const getUserInitials = () => {
    if (telegramUser?.first_name) {
      return telegramUser.first_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Helper functions for UI
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'grocery': return '#34D399';
      case 'restaurant-bar': return '#F59E0B'; 
      default: return '#8B5CF6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grocery': return '🛒';
      case 'restaurant-bar': return '🍽️';
      default: return '🏪';
    }
  };

  const formatCategory = (category: string) => {
    return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadLocations();
    if (telegramUser) {
      loadUserProfile();
    }
  }, [telegramUser]);

  useEffect(() => {
    if (latitude && longitude && !mapCenter) {
      setMapCenter({ lat: latitude, lng: longitude });
    } else if (error && !mapCenter) {
      // Fallback to a default location (London) if geolocation fails
      setMapCenter({ lat: 51.5074, lng: -0.1278 });
    }
  }, [latitude, longitude, mapCenter, error]);

  // Force fallback after 8 seconds if still loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (loading && !mapCenter) {
        setMapCenter({ lat: 51.5074, lng: -0.1278 });
      }
    }, 8000);

    return () => clearTimeout(fallbackTimer);
  }, [loading, mapCenter]);

  const loadLocations = async () => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
        // Load ratings for each location
        loadLocationRatings(data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadLocationRatings = async (locationList: Location[]) => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const ratingsPromises = locationList.map(async (loc) => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/ratings?location_id=${loc.id}`);
          if (response.ok) {
            const data = await response.json();
            return { locationId: loc.id, rating: { average: data.average, count: data.count } };
          }
        } catch (error) {
          console.error(`Error loading rating for location ${loc.id}:`, error);
        }
        return { locationId: loc.id, rating: { average: 0, count: 0 } };
      });

      const ratingsData = await Promise.all(ratingsPromises);
      const ratingsMap = ratingsData.reduce((acc, { locationId, rating }) => {
        acc[locationId] = rating;
        return acc;
      }, {} as Record<number, { average: number; count: number }>);
      
      setLocationRatings(ratingsMap);
    } catch (error) {
      console.error('Error loading location ratings:', error);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationDetail(true);
  };

  const handleLocationDetailClose = () => {
    setShowLocationDetail(false);
    setSelectedLocation(null);
  };

  const loadUserProfile = async () => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/users/${telegramUser?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setAvatarUrl(data.avatar_url || '');
      } else if (response.status === 404) {
        // Create user if not exists
        await createUser();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const createUser = async () => {
    if (!telegramUser) return;
    
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: telegramUser?.id?.toString(),
          nickname: telegramUser?.first_name + (telegramUser?.last_name ? ` ${telegramUser.last_name}` : ''),
          avatarUrl: null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedLocation({ lat, lng });
    setShowAddLocationModal(true);
  };

  const handleAddLocation = async () => {
    if (!clickedLocation || !newLocationName.trim()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Ensure we have a valid user profile first
      let validUserId = null;
      if (userProfile && userProfile.id > 0) {
        validUserId = userProfile.id;
      } else if (telegramUser) {
        // Try to create/get user first
        try {
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
          const userResponse = await fetch(`${BACKEND_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: telegramUser.id.toString(),
              nickname: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
              avatarUrl: null
            })
          });
          
          if (userResponse.ok) {
            const newUser = await userResponse.json();
            validUserId = newUser.id;
            setUserProfile(newUser);
          }
        } catch (userError) {
          console.error('Error creating user:', userError);
          // Continue with null userId
        }
      }

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLocationName,
          description: newLocationDescription,
          latitude: clickedLocation.lat,
          longitude: clickedLocation.lng,
          category: newLocationCategory,
          userId: validUserId  // This can be null now
        })
      });
      
      if (response.ok) {
        setShowAddLocationModal(false);
        setNewLocationName('');
        setNewLocationDescription('');
        setNewLocationCategory('other');
        setClickedLocation(null);
        await loadLocations(); // Refresh locations and ratings
      } else {
        const errorData = await response.json();
        setApiError(errorData.error || 'Failed to add location');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
      console.error('Error adding location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async () => {
    if (!userProfile) return;
    
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/users/update/${userProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: avatarUrl
        })
      });
      
      if (response.ok) {
        setShowProfileModal(false);
        loadUserProfile(); // Refresh user profile
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await response.json();
      
      if (results && results[0]) {
        const { lat, lon } = results[0];
        setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };


  // Loading state
  if (loading && !mapCenter) {
    return (
      <Page>
        <Banner
          header="Finding Your Location"
          subheader="Please allow location access when prompted by your browser"
        />
        <List>
          <Section>
            <Cell
              before={<Navigation2 size={24} />}
              subtitle="GPS signal scanning..."
            >
              Getting location
            </Cell>
            <Cell
              Component="button"
              onClick={() => setMapCenter({ lat: 51.5074, lng: -0.1278 })}
              before={<MapPin size={20} />}
            >
              Skip - Use London as default
            </Cell>
          </Section>
        </List>
      </Page>
    );
  }

  // Error state - show search instead
  if (error && !mapCenter) {
    return (
      <Page>
        <Banner
          header="Search for a Location"
          subheader="Location access is disabled. Search for a place to get started."
        />
        
        <List>
          <Section>
            <Cell>
              <Input
                header="Search location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a city or place..."
              />
            </Cell>
          </Section>
          
          <Section>
            <Cell
              Component="button"
              onClick={handleSearch}
              disabled={isSearching}
              before={isSearching ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} />}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Cell>
            <Cell
              Component="button"
              onClick={() => window.location.reload()}
              before={<RefreshCw size={20} />}
            >
              Try Location Again
            </Cell>
          </Section>
        </List>
      </Page>
    );
  }

  // Success state with location or search result
  if ((latitude && longitude) || mapCenter) {
    const displayLat = mapCenter?.lat || latitude!;
    const displayLng = mapCenter?.lng || longitude!;
    
    return (
      <Page>
        {/* Profile Modal */}
        {showProfileModal && (
          <Modal
            header="Profile Settings"
            trigger={undefined}
            open={showProfileModal}
            onOpenChange={setShowProfileModal}
          >
            <List>
              <Section>
                <Cell>
                  <Input
                    header="Avatar URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </Cell>
              </Section>
            </List>
            <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
              <Button size="l" stretched onClick={updateUserProfile}>
                Save
              </Button>
              <Button size="l" stretched mode="plain" onClick={() => setShowProfileModal(false)}>
                Cancel
              </Button>
            </div>
          </Modal>
        )}

        {/* Add Location Modal */}
        {showAddLocationModal && clickedLocation && (
          <Modal
            header="Add Location"
            trigger={undefined}
            open={showAddLocationModal}
            onOpenChange={setShowAddLocationModal}
          >
            <List>
              <Section>
                <Cell>
                  <Input
                    header="Location Name"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Enter location name"
                  />
                </Cell>
                <Cell>
                  <Input
                    header="Description"
                    value={newLocationDescription}
                    onChange={(e) => setNewLocationDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </Cell>
                <Cell>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Category
                    </label>
                    <select
                      value={newLocationCategory}
                      onChange={(e) => setNewLocationCategory(e.target.value as 'grocery' | 'restaurant-bar' | 'other')}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        fontSize: '16px',
                        background: 'white'
                      }}
                    >
                      <option value="other">🏪 Other</option>
                      <option value="grocery">🛒 Grocery Store</option>
                      <option value="restaurant-bar">🍽️ Restaurant/Bar</option>
                    </select>
                  </div>
                </Cell>
                <Cell
                  before={<MapPin size={20} />}
                  subtitle={`Lat: ${clickedLocation.lat.toFixed(6)}, Lng: ${clickedLocation.lng.toFixed(6)}`}
                >
                  Selected Location
                </Cell>
              </Section>
            </List>
            {apiError && (
              <div style={{
                padding: '12px',
                margin: '0 16px',
                background: 'var(--tg-theme-destructive-text-color, #ff3b3b)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {apiError}
              </div>
            )}
            <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
              <Button 
                size="l" 
                stretched 
                onClick={handleAddLocation} 
                disabled={!newLocationName.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                    Adding...
                  </>
                ) : (
                  'Add Location'
                )}
              </Button>
              <Button size="l" stretched mode="plain" onClick={() => {
                setShowAddLocationModal(false);
                setNewLocationName('');
                setNewLocationDescription('');
                setNewLocationCategory('other');
                setClickedLocation(null);
              }}>
                Cancel
              </Button>
            </div>
          </Modal>
        )}

        {/* Header with User Profile */}
        <List>
          <Section>
            <Cell
              before={
                <div style={{ 
                  background: 'var(--tg-theme-button-color, #0088cc)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={20} style={{ color: 'white' }} />
                </div>
              }
              after={
                telegramUser && (
                  <IconButton
                    size="s"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <Avatar
                      size={24}
                      src={userProfile?.avatar_url || undefined}
                      fallbackIcon={getUserInitials()}
                    />
                  </IconButton>
                )
              }
              subtitle={`${locations.length} locations available`}
            >
              <span style={{ fontSize: '18px', fontWeight: '600' }}>
                OpenFreeMap
              </span>
            </Cell>
          </Section>
        </List>

        {/* Search Input */}
        <List>
          <Section header="🔍 Search Location">
            <Cell
              Component="label"
              multiline
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    header=""
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for places..."
                  />
                </div>
                <Button
                  mode={isSearching ? 'plain' : 'filled'}
                  size="m"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                </Button>
              </div>
            </Cell>
          </Section>
        </List>
        
        {/* Map Section */}
        <List>
          <Section header="🗺️ Interactive Map">
            <Cell
              subtitle="Tap anywhere on the map to add a new location"
              multiline
            >
              <div style={{ 
                width: '100%', 
                height: '350px',
                marginTop: '8px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--tg-theme-section-separator-color)'
              }}>
                <InteractiveMap
                  latitude={displayLat}
                  longitude={displayLng}
                  zoom={mapCenter ? 13 : 16}
                  height="350px"
                  onMapClick={handleMapClick}
                />
              </div>
            </Cell>
          </Section>
        </List>

        {/* Current Location Info */}
        {latitude && longitude && (
          <List>
            <Section header="📍 Your Location">
              <Cell
                before={
                  <div style={{
                    background: 'var(--tg-theme-accent-text-color, #0088cc)',
                    borderRadius: '8px',
                    padding: '6px'
                  }}>
                    <Navigation2 size={16} style={{ color: 'white' }} />
                  </div>
                }
                subtitle={`${displayLat.toFixed(6)}, ${displayLng.toFixed(6)}`}
                after={
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'var(--tg-theme-hint-color)',
                    background: 'var(--tg-theme-secondary-bg-color)',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    GPS
                  </span>
                }
              >
                Current Position
              </Cell>
            </Section>
          </List>
        )}

        {/* Recent Locations List */}
        {locations.length > 0 && (
          <List>
            <Section header={`📍 All Locations (${locations.length})`}>
              {locations.map((loc) => {
                const rating = locationRatings[loc.id] || { average: 0, count: 0 };
                return (
                  <Cell
                    key={loc.id}
                    Component="button"
                    before={
                      <div style={{
                        background: getCategoryColor(loc.category),
                        borderRadius: '12px',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {getCategoryIcon(loc.category)}
                      </div>
                    }
                    onClick={() => handleLocationSelect(loc)}
                    after={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {rating.count > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                            <span style={{ 
                              fontSize: '12px', 
                              color: 'var(--tg-theme-text-color)',
                              fontWeight: '500'
                            }}>
                              {rating.average.toFixed(1)}
                            </span>
                            <span style={{ 
                              fontSize: '10px', 
                              color: 'var(--tg-theme-hint-color)'
                            }}>
                              ({rating.count})
                            </span>
                          </div>
                        )}
                        <Button size="s" mode="plain" onClick={(e) => {
                          e.stopPropagation();
                          setMapCenter({ lat: loc.latitude, lng: loc.longitude });
                        }}>
                          📍
                        </Button>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', width: '100%' }}>
                      <div style={{ 
                        fontWeight: '600',
                        fontSize: '16px',
                        color: 'var(--tg-theme-text-color)'
                      }}>
                        {loc.name}
                      </div>
                      <div style={{ 
                        fontSize: '13px',
                        color: 'var(--tg-theme-hint-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{formatCategory(loc.category)}</span>
                        <span>•</span>
                        <span>{formatDate(loc.created_at)}</span>
                        {rating.count > 0 && (
                          <>
                            <span>•</span>
                            <MessageCircle size={12} />
                            <span>Reviews</span>
                          </>
                        )}
                      </div>
                      {loc.description && (
                        <div style={{ 
                          fontSize: '12px',
                          color: 'var(--tg-theme-text-color)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          maxWidth: '200px'
                        }}>
                          {loc.description}
                        </div>
                      )}
                    </div>
                  </Cell>
                );
              })}
            </Section>
          </List>
        )}

        {/* Location Detail Modal */}
        {selectedLocation && (
          <LocationDetailModal
            location={selectedLocation}
            isOpen={showLocationDetail}
            onClose={handleLocationDetailClose}
            onLocationClick={(lat, lng) => {
              setMapCenter({ lat, lng });
              handleLocationDetailClose();
            }}
          />
        )}
      </Page>
    );
  }

  // Fallback state
  return (
    <Page>
      <Banner
        header="No Location Data"
        subheader="Unable to retrieve location information from your device"
      />
      <List>
        <Section>
          <Cell
            Component="button"
            onClick={() => window.location.reload()}
            before={<RefreshCw size={20} />}
          >
            Refresh Page
          </Cell>
        </Section>
      </List>
    </Page>
  );
}