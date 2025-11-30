import { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, Navigation, MapPin, Star } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: 'grocery' | 'restaurant-bar' | 'other';
  created_at: string;
}

interface LocationWithRating extends Location {
  rating?: { average: number; count: number };
}

interface DatabaseLocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  showCurrentLocation?: boolean;
  currentLocation?: { lat: number; lng: number } | null;
}

export function DatabaseLocationSearch({
  onLocationSelect,
  placeholder = "Search locations...",
  showCurrentLocation = true,
  currentLocation
}: DatabaseLocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationWithRating[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentLocationSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Don't search if query is too short
    if (query.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    // Debounce search
    searchTimeout.current = setTimeout(async () => {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

        // Search in database locations
        const response = await fetch(`${BACKEND_URL}/api/locations`);
        if (!response.ok) throw new Error('Failed to fetch locations');

        const allLocations: Location[] = await response.json();

        // Filter locations based on query
        const filteredLocations = allLocations.filter(location =>
          location.name.toLowerCase().includes(query.toLowerCase()) ||
          location.description.toLowerCase().includes(query.toLowerCase()) ||
          getCategoryDisplayName(location.category).toLowerCase().includes(query.toLowerCase())
        );

        // Load ratings for filtered locations
        const locationsWithRatings = await Promise.all(
          filteredLocations.map(async (location) => {
            try {
              const ratingResponse = await fetch(`${BACKEND_URL}/api/ratings?location_id=${location.id}`);
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                return {
                  ...location,
                  rating: { average: ratingData.average, count: ratingData.count }
                };
              }
            } catch (error) {
              console.error(`Error loading rating for location ${location.id}:`, error);
            }
            return { ...location, rating: { average: 0, count: 0 } };
          })
        );

        // Sort by rating and name
        const sortedResults = locationsWithRatings
          .sort((a, b) => {
            // Sort by rating first, then by name
            if (b.rating!.average !== a.rating!.average) {
              return b.rating!.average - a.rating!.average;
            }
            return a.name.localeCompare(b.name);
          })
          .slice(0, 8); // Limit to 8 results

        setResults(sortedResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleLocationSelect = (location: Location) => {
    // Save to recent searches
    const newRecentSearches = [location.name, ...recentSearches.filter(s => s !== location.name)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentLocationSearches', JSON.stringify(newRecentSearches));

    onLocationSelect(location);
    setQuery('');
    setShowResults(false);
  };

  const handleCurrentLocation = () => {
    if (currentLocation) {
      const currentLoc: Location = {
        id: -1,
        name: 'Current Location',
        description: 'Your current GPS location',
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        category: 'other',
        created_at: new Date().toISOString()
      };
      onLocationSelect(currentLoc);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grocery': return '🛒';
      case 'restaurant-bar': return '🍽️';
      default: return '🏪';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'grocery': return 'Grocery Store';
      case 'restaurant-bar': return 'Restaurant & Bar';
      default: return 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'grocery': return '#10B981';
      case 'restaurant-bar': return '#F59E0B';
      default: return '#8B5CF6';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          color: 'var(--tg-theme-hint-color)'
        }}>
          <Search size={18} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(query.length >= 1 || recentSearches.length > 0)}
          placeholder={placeholder}
          style={{
            width: '100%',
            paddingLeft: '44px',
            paddingRight: query ? '44px' : '16px',
            paddingTop: '14px',
            paddingBottom: '14px',
            borderRadius: '24px',
            border: '2px solid var(--tg-theme-section-separator-color)',
            background: 'var(--tg-theme-bg-color)',
            color: 'var(--tg-theme-text-color)',
            fontSize: '16px',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        />

        {query && (
          <button
            onClick={clearQuery}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tg-theme-hint-color)',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          background: 'var(--tg-theme-bg-color)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid var(--tg-theme-section-separator-color)',
          zIndex: 1000,
          marginTop: '8px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>

          {/* Current Location Option */}
          {showCurrentLocation && currentLocation && (
            <button
              onClick={handleCurrentLocation}
              style={{
                width: '100%',
                padding: '16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: '1px solid var(--tg-theme-section-separator-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                background: 'var(--tg-theme-button-color)',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Navigation size={16} style={{ color: 'white' }} />
              </div>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--tg-theme-text-color)' }}>
                  Current Location
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                  Use my current GPS location
                </div>
              </div>
            </button>
          )}

          {/* Recent Searches */}
          {query.length < 1 && recentSearches.length > 0 && (
            <>
              <div style={{
                padding: '16px 16px 8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--tg-theme-hint-color)'
              }}>
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Clock size={16} style={{ color: 'var(--tg-theme-hint-color)' }} />
                  <div style={{ color: 'var(--tg-theme-text-color)' }}>
                    {search}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Search Results */}
          {isSearching && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--tg-theme-hint-color)'
            }}>
              Searching locations...
            </div>
          )}

          {!isSearching && query.length >= 1 && results.length > 0 && (
            <>
              <div style={{
                padding: '16px 16px 8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--tg-theme-hint-color)'
              }}>
                Found {results.length} location{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    background: getCategoryColor(location.category),
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    minWidth: '36px',
                    marginTop: '2px'
                  }}>
                    {getCategoryIcon(location.category)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: 'var(--tg-theme-text-color)',
                      marginBottom: '2px'
                    }}>
                      {location.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--tg-theme-hint-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '2px'
                    }}>
                      <span>{getCategoryDisplayName(location.category)}</span>
                      <span>•</span>
                      <span>{formatDate(location.created_at)}</span>
                      {location.rating && location.rating.count > 0 && (
                        <>
                          <span>•</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                            <span>{location.rating.average.toFixed(1)}</span>
                            <span>({location.rating.count})</span>
                          </div>
                        </>
                      )}
                    </div>
                    {location.description && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--tg-theme-text-color)',
                        lineHeight: '1.3',
                        marginTop: '2px'
                      }}>
                        {location.description.length > 60
                          ? `${location.description.substring(0, 60)}...`
                          : location.description
                        }
                      </div>
                    )}
                  </div>
                  <div style={{
                    color: 'var(--tg-theme-hint-color)',
                    fontSize: '20px',
                    marginTop: '4px'
                  }}>
                    <MapPin size={16} />
                  </div>
                </button>
              ))}
            </>
          )}

          {!isSearching && query.length >= 1 && results.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--tg-theme-hint-color)'
            }}>
              No locations found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}