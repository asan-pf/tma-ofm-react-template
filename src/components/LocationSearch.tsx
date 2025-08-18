import { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, Navigation } from 'lucide-react';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  placeholder?: string;
  showCurrentLocation?: boolean;
  currentLocation?: { lat: number; lng: number } | null;
}

export function LocationSearch({ 
  onLocationSelect, 
  placeholder = "Search for places...",
  showCurrentLocation = true,
  currentLocation 
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // Debounce search
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`
        );
        const data = await response.json();
        
        // Sort by importance and filter duplicates
        const sortedResults = data
          .filter((result: SearchResult, index: number, self: SearchResult[]) => 
            index === self.findIndex(r => r.display_name === result.display_name)
          )
          .sort((a: SearchResult, b: SearchResult) => b.importance - a.importance)
          .slice(0, 6);
        
        setResults(sortedResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    // Save to recent searches
    const newRecentSearches = [name, ...recentSearches.filter(s => s !== name)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentLocationSearches', JSON.stringify(newRecentSearches));
    
    onLocationSelect(lat, lng, name);
    setQuery('');
    setShowResults(false);
  };

  const handleCurrentLocation = () => {
    if (currentLocation) {
      onLocationSelect(currentLocation.lat, currentLocation.lng, 'Current Location');
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const getLocationIcon = (type: string) => {
    if (type.includes('restaurant') || type.includes('cafe')) return '🍽️';
    if (type.includes('shop') || type.includes('store')) return '🛒';
    if (type.includes('hotel') || type.includes('accommodation')) return '🏨';
    if (type.includes('hospital') || type.includes('pharmacy')) return '🏥';
    if (type.includes('school') || type.includes('university')) return '🏫';
    if (type.includes('park') || type.includes('garden')) return '🌳';
    return '📍';
  };

  const formatDisplayName = (name: string) => {
    // Extract the main location name and country/region
    const parts = name.split(', ');
    if (parts.length > 3) {
      return `${parts[0]}, ${parts[1]}...`;
    }
    return name.length > 50 ? `${name.substring(0, 50)}...` : name;
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
          onFocus={() => setShowResults(query.length >= 2 || recentSearches.length > 0)}
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
          {query.length < 2 && recentSearches.length > 0 && (
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
              Searching...
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <>
              <div style={{ 
                padding: '16px 16px 8px 16px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--tg-theme-hint-color)' 
              }}>
                Search Results
              </div>
              {results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleLocationSelect(
                    parseFloat(result.lat), 
                    parseFloat(result.lon),
                    result.display_name
                  )}
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
                    fontSize: '18px', 
                    marginTop: '2px',
                    minWidth: '20px'
                  }}>
                    {getLocationIcon(result.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '500', 
                      color: 'var(--tg-theme-text-color)',
                      marginBottom: '2px'
                    }}>
                      {formatDisplayName(result.display_name)}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--tg-theme-hint-color)' 
                    }}>
                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              color: 'var(--tg-theme-hint-color)' 
            }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}