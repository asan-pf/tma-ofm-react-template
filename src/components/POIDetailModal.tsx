import { useState } from "react";
import {
  Modal,
  List,
  Section,
  Cell,
  Button,
} from "@telegram-apps/telegram-ui";
import {
  MapPin,
  ExternalLink,
  Phone,
  Clock,
  Globe,
  Heart,
  HeartOff,
  Star,
  Navigation,
} from "lucide-react";
import { POI, POIService } from "@/utils/poiService";

interface POIDetailModalProps {
  poi: POI | null;
  isOpen: boolean;
  onClose: () => void;
  onLocationClick?: (lat: number, lng: number) => void;
  onToggleFavorite?: (poi: POI) => void;
  isFavorited?: boolean;
}

export function POIDetailModal({
  poi,
  isOpen,
  onClose,
  onLocationClick,
  onToggleFavorite,
  isFavorited = false,
}: POIDetailModalProps) {
  const [showAllTags, setShowAllTags] = useState(false);

  if (!poi) return null;

  const formatOpeningHours = (hours: string) => {
    // Simple formatting - could be enhanced
    return hours.replace(/;/g, '\n');
  };

  const formatAddress = () => {
    const parts = [];
    if (poi.addr_housenumber) parts.push(poi.addr_housenumber);
    if (poi.addr_street) parts.push(poi.addr_street);
    return parts.join(' ');
  };

  const getRelevantTags = () => {
    const excludeTags = [
      'name', 'amenity', 'shop', 'tourism', 'leisure', 'cuisine', 
      'opening_hours', 'website', 'phone', 'addr:street', 'addr:housenumber'
    ];
    
    return Object.entries(poi.tags)
      .filter(([key]) => !excludeTags.includes(key))
      .filter(([, value]) => value && value.length > 0);
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      header={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: POIService.getCategoryColor(poi.category),
                borderRadius: "12px",
                padding: "8px",
                fontSize: "18px",
                color: "white",
              }}
            >
              {POIService.getCategoryIcon(poi.category)}
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "var(--tg-theme-text-color)",
                }}
              >
                {poi.name}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--tg-theme-hint-color)",
                }}
              >
                {POIService.formatCategory(poi.category)}
              </div>
            </div>
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <Button
              mode="plain"
              size="s"
              onClick={() => onToggleFavorite(poi)}
              style={{
                padding: "8px",
                minWidth: "unset",
                color: isFavorited ? "#ef4444" : "var(--tg-theme-hint-color)",
              }}
            >
              {isFavorited ? (
                <Heart size={20} fill="currentColor" />
              ) : (
                <HeartOff size={20} />
              )}
            </Button>
          )}
        </div>
      }
      open={isOpen}
      onOpenChange={onClose}
    >
      <List>
        {/* Basic Info */}
        <Section>
          <Cell
            before={
              <MapPin
                size={20}
                style={{ color: "var(--tg-theme-accent-text-color)" }}
              />
            }
            subtitle={`${poi.latitude.toFixed(6)}, ${poi.longitude.toFixed(6)}`}
            after={
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  size="s"
                  mode="plain"
                  onClick={() => onLocationClick?.(poi.latitude, poi.longitude)}
                >
                  <Navigation size={16} />
                </Button>
                <Button
                  size="s"
                  mode="plain"
                  onClick={openInMaps}
                >
                  <ExternalLink size={16} />
                </Button>
              </div>
            }
          >
            Location
          </Cell>

          {poi.cuisine && (
            <Cell
              before={
                <Star
                  size={20}
                  style={{ color: "var(--tg-theme-accent-text-color)" }}
                />
              }
            >
              <div>
                <strong>Cuisine:</strong> {poi.cuisine.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </Cell>
          )}

          {formatAddress() && (
            <Cell
              before={
                <MapPin
                  size={20}
                  style={{ color: "var(--tg-theme-accent-text-color)" }}
                />
              }
            >
              <div>
                <strong>Address:</strong> {formatAddress()}
              </div>
            </Cell>
          )}
        </Section>

        {/* Contact & Hours */}
        {(poi.opening_hours || poi.phone || poi.website) && (
          <Section header="📞 Contact & Hours">
            {poi.opening_hours && (
              <Cell
                before={
                  <Clock
                    size={20}
                    style={{ color: "var(--tg-theme-accent-text-color)" }}
                  />
                }
                multiline
              >
                <div>
                  <strong>Opening Hours:</strong>
                  <pre style={{ 
                    fontSize: "14px", 
                    margin: "4px 0 0 0", 
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit"
                  }}>
                    {formatOpeningHours(poi.opening_hours)}
                  </pre>
                </div>
              </Cell>
            )}

            {poi.phone && (
              <Cell
                before={
                  <Phone
                    size={20}
                    style={{ color: "var(--tg-theme-accent-text-color)" }}
                  />
                }
                after={
                  <Button
                    size="s"
                    mode="plain"
                    onClick={() => window.open(`tel:${poi.phone}`, '_self')}
                  >
                    Call
                  </Button>
                }
              >
                {poi.phone}
              </Cell>
            )}

            {poi.website && (
              <Cell
                before={
                  <Globe
                    size={20}
                    style={{ color: "var(--tg-theme-accent-text-color)" }}
                  />
                }
                after={
                  <Button
                    size="s"
                    mode="plain"
                    onClick={() => window.open(poi.website, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </Button>
                }
              >
                Website
              </Cell>
            )}
          </Section>
        )}

        {/* Additional Info */}
        {getRelevantTags().length > 0 && (
          <Section header="ℹ️ Additional Info">
            {getRelevantTags()
              .slice(0, showAllTags ? undefined : 3)
              .map(([key, value]) => (
                <Cell key={key}>
                  <div>
                    <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                  </div>
                </Cell>
              ))}
            
            {getRelevantTags().length > 3 && (
              <Cell>
                <Button
                  mode="plain"
                  size="s"
                  onClick={() => setShowAllTags(!showAllTags)}
                  style={{ padding: "0" }}
                >
                  {showAllTags ? 'Show Less' : `Show ${getRelevantTags().length - 3} More`}
                </Button>
              </Cell>
            )}
          </Section>
        )}

        {/* OSM Attribution */}
        <Section>
          <Cell
            style={{
              textAlign: "center",
              color: "var(--tg-theme-hint-color)",
              fontSize: "12px",
            }}
          >
            Data from OpenStreetMap contributors
          </Cell>
        </Section>
      </List>
    </Modal>
  );
}