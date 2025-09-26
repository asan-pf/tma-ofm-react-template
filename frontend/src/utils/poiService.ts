export interface POI {
  id: string;
  name: string;
  type: string;
  category: string;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
  amenity?: string;
  shop?: string;
  cuisine?: string;
  opening_hours?: string;
  website?: string;
  phone?: string;
  addr_street?: string;
  addr_housenumber?: string;
}

export interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
}

export interface OverpassResponse {
  elements: OSMElement[];
}

export class POIService {
  private static readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache = new Map<string, { data: POI[]; timestamp: number }>();

  static async fetchPOIs(
    bounds: { north: number; south: number; east: number; west: number },
    categories: string[] = ['restaurant', 'cafe', 'shop', 'tourism', 'leisure', 'amenity']
  ): Promise<POI[]> {
    const cacheKey = `${bounds.south}-${bounds.west}-${bounds.north}-${bounds.east}-${categories.join(',')}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const query = this.buildOverpassQuery(bounds, categories);
      const response = await fetch(this.OVERPASS_URL, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OverpassResponse = await response.json();
      const pois = this.parseOverpassResponse(data);

      // Cache the results
      this.cache.set(cacheKey, { data: pois, timestamp: Date.now() });

      return pois;
    } catch (error) {
      console.error('Error fetching POIs:', error);
      return [];
    }
  }

  private static buildOverpassQuery(
    bounds: { north: number; south: number; east: number; west: number },
    categories: string[]
  ): string {
    const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
    
    const queries = categories.map(category => {
      switch (category) {
        case 'restaurant':
          return `node["amenity"~"^(restaurant|fast_food|pub|bar)$"](${bbox});`;
        case 'cafe':
          return `node["amenity"~"^(cafe|ice_cream)$"](${bbox});`;
        case 'shop':
          return `node["shop"~"^(supermarket|convenience|bakery|butcher|greengrocer)$"](${bbox});`;
        case 'tourism':
          return `node["tourism"~"^(attraction|museum|viewpoint|monument)$"](${bbox});`;
        case 'leisure':
          return `node["leisure"~"^(park|playground|sports_centre|fitness_centre)$"](${bbox});`;
        case 'amenity':
          return `node["amenity"~"^(hospital|pharmacy|bank|atm|fuel|parking)$"](${bbox});`;
        default:
          return '';
      }
    }).filter(q => q);

    return `
      [out:json][timeout:25];
      (
        ${queries.join('\n        ')}
      );
      out center;
    `;
  }

  private static parseOverpassResponse(data: OverpassResponse): POI[] {
    return data.elements
      .map(element => this.elementToPOI(element))
      .filter((poi): poi is POI => poi !== null);
  }

  private static elementToPOI(element: OSMElement): POI | null {
    if (!element.tags) return null;

    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    
    if (!lat || !lon) return null;

    const name = element.tags.name || this.generateNameFromTags(element.tags);
    if (!name) return null;

    const category = this.categorizeElement(element.tags);
    const type = element.tags.amenity || element.tags.shop || element.tags.tourism || element.tags.leisure || 'other';

    return {
      id: `${element.type}-${element.id}`,
      name,
      type,
      category,
      latitude: lat,
      longitude: lon,
      tags: element.tags,
      amenity: element.tags.amenity,
      shop: element.tags.shop,
      cuisine: element.tags.cuisine,
      opening_hours: element.tags.opening_hours,
      website: element.tags.website,
      phone: element.tags.phone,
      addr_street: element.tags['addr:street'],
      addr_housenumber: element.tags['addr:housenumber'],
    };
  }

  private static generateNameFromTags(tags: Record<string, string>): string {
    if (tags.name) return tags.name;
    if (tags.brand) return tags.brand;
    
    // Generate name from type
    const amenity = tags.amenity;
    const shop = tags.shop;
    const tourism = tags.tourism;
    
    if (amenity) {
      return amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (shop) {
      return shop.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (tourism) {
      return tourism.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return '';
  }

  private static categorizeElement(tags: Record<string, string>): string {
    const amenity = tags.amenity;
    const shop = tags.shop;
    const tourism = tags.tourism;
    const leisure = tags.leisure;

    // Food & Drink
    if (['restaurant', 'fast_food', 'cafe', 'pub', 'bar', 'ice_cream'].includes(amenity || '')) {
      return 'restaurant-bar';
    }

    // Shopping
    if (['supermarket', 'convenience', 'bakery', 'butcher', 'greengrocer'].includes(shop || '')) {
      return 'grocery';
    }

    // Tourism & Culture
    if (['attraction', 'museum', 'viewpoint', 'monument'].includes(tourism || '')) {
      return 'tourism';
    }

    // Health & Services
    if (['hospital', 'pharmacy', 'bank', 'atm'].includes(amenity || '')) {
      return 'services';
    }

    // Recreation
    if (['park', 'playground', 'sports_centre', 'fitness_centre'].includes(leisure || '')) {
      return 'leisure';
    }

    // Transport
    if (['fuel', 'parking'].includes(amenity || '')) {
      return 'transport';
    }

    return 'other';
  }

  static getCategoryColor(category: string): string {
    switch (category) {
      case 'restaurant-bar': return '#F59E0B';
      case 'grocery': return '#10B981';
      case 'tourism': return '#3B82F6';
      case 'services': return '#EF4444';
      case 'leisure': return '#8B5CF6';
      case 'transport': return '#6B7280';
      default: return '#6B7280';
    }
  }

  static getCategoryIcon(category: string): string {
    switch (category) {
      case 'restaurant-bar': return '🍽️';
      case 'grocery': return '🛒';
      case 'tourism': return '🗺️';
      case 'services': return '🏥';
      case 'leisure': return '🏃';
      case 'transport': return '🚗';
      default: return '📍';
    }
  }

  static formatCategory(category: string): string {
    return category.replace('-', ' & ').replace(/\b\w/g, l => l.toUpperCase());
  }
}