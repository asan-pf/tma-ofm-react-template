import { useState, useEffect, useRef, useMemo } from "react";
import {
  List,
  Section,
  Cell,
  Button,
  Input,
  Avatar,
} from "@telegram-apps/telegram-ui";
import {
  MapPin,
  User,
  Send,
  ChevronUp,
  X,
  Globe,
  Camera,
  ImagePlus,
} from "lucide-react";
import { StarRating } from "./StarRating";
import { initDataState, useSignal } from "@telegram-apps/sdk-react";
import { UserService } from "@/utils/userService";
import {
  uploadCommentImage,
  isSupabaseConfigured,
} from "@/utils/storageService";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
  user_id?: number;
  website_url?: string;
  image_url?: string;
  schedules?: string;
  type?: "permanent" | "temporary";
  users?: {
    id: number;
    nickname: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: number;
  content: string;
  image_url?: string;
  created_at: string;
  users?: {
    id: number;
    nickname: string;
    avatar_url: string | null;
  };
}

interface Rating {
  average: number;
  count: number;
}

interface LocationDetailModalProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onLocationClick?: (lat: number, lng: number) => void;
  onToggleFavorite?: (locationId: number) => void;
  isFavorited?: boolean;
}

export function LocationDetailModal({
  location,
  isOpen,
  onClose,
  onLocationClick,
  onToggleFavorite,
  isFavorited = false,
}: LocationDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState<Rating>({ average: 0, count: 0 });
  const [newComment, setNewComment] = useState("");
  const [newCommentImage, setNewCommentImage] = useState("");
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initData = useSignal(initDataState);
  const telegramUser = initData?.user;
  const canUploadImages = isSupabaseConfigured;
  const structuredSchedule = useMemo(() => {
    if (!location.schedules) return null;
    try {
      const parsed = JSON.parse(location.schedules);
      if (!Array.isArray(parsed)) return null;
      return parsed
        .map((entry: any) => ({
          day: String(entry.day ?? ""),
          open: String(entry.open ?? ""),
          close: String(entry.close ?? ""),
          open24Hours: Boolean(entry.open24Hours),
          closed: Boolean(entry.closed),
        }))
        .filter((entry) => entry.day);
    } catch (error) {
      return null;
    }
  }, [location.schedules]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "grocery":
        return "🛒";
      case "restaurant-bar":
        return "🍽️";
      default:
        return "🏪";
    }
  };

  const formatCategory = (category: string) => {
    return category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAllImages = () => {
    const images: string[] = [];
    if (location.image_url) {
      images.push(location.image_url);
    }
    comments.forEach((comment) => {
      if (comment.image_url) {
        images.push(comment.image_url);
      }
    });
    return images;
  };

  const releaseCommentPreview = () => {
    if (commentImageFile && newCommentImage.startsWith("blob:")) {
      URL.revokeObjectURL(newCommentImage);
    }
  };

  useEffect(() => {
    return () => {
      if (newCommentImage.startsWith("blob:")) {
        URL.revokeObjectURL(newCommentImage);
      }
    };
  }, [newCommentImage]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(
        `${BACKEND_URL}/api/comments?location_id=${location.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadRating = async () => {
    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(
        `${BACKEND_URL}/api/ratings?location_id=${location.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRating({ average: data.average, count: data.count });
      }
    } catch (error) {
      console.error("Error loading rating:", error);
    }
  };

  const clearImage = () => {
    releaseCommentPreview();
    setCommentImageFile(null);
    setNewCommentImage("");
  };

  const handleCommentFileChange = (file: File | null) => {
    releaseCommentPreview();
    if (!file) {
      setCommentImageFile(null);
      setNewCommentImage("");
      return;
    }
    setCommentImageFile(file);
    setNewCommentImage(URL.createObjectURL(file));
  };

  const handleCommentImageUrlChange = (value: string) => {
    if (commentImageFile) {
      releaseCommentPreview();
      setCommentImageFile(null);
    }
    setNewCommentImage(value);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !telegramUser) return;

    try {
      setIsSubmitting(true);
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      // Get or create user
      const user = await UserService.getOrCreateUser(telegramUser);
      if (!user) {
        throw new Error("Failed to get user");
      }

      let uploadedCommentImage: string | null =
        newCommentImage.trim() || null;

      if (commentImageFile) {
        try {
          uploadedCommentImage = await uploadCommentImage(commentImageFile);
        } catch (uploadError) {
          console.error("Error uploading comment image:", uploadError);
          throw new Error("Image upload failed");
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: location.id,
          user_id: user.id,
          content: newComment,
          image_url: uploadedCommentImage,
        }),
      });

      if (response.ok) {
        setNewComment("");
        clearImage();
        loadComments(); // Refresh comments
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit your review right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRating = async (stars: number) => {
    if (!telegramUser) return;

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      // Get or create user
      const user = await UserService.getOrCreateUser(telegramUser);
      if (!user) {
        throw new Error("Failed to get user");
      }

      const response = await fetch(`${BACKEND_URL}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: location.id,
          user_id: user.id,
          stars,
        }),
      });

      if (response.ok) {
        setUserRating(stars);
        loadRating(); // Refresh rating
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  useEffect(() => {
    if (isOpen && location) {
      loadComments();
      loadRating();
    }
  }, [isOpen, location]);

  useEffect(() => {
    setLocalIsFavorited(isFavorited);
  }, [isFavorited]);

  const handleFavoriteToggle = async () => {
    if (!onToggleFavorite) return;
    
    // Immediate UI feedback
    setLocalIsFavorited(!localIsFavorited);
    console.log('Favorite button clicked, toggling to:', !localIsFavorited);
    
    // Call parent handler
    onToggleFavorite(location.id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    setCurrentY(touch.clientY);
    
    const deltaY = touch.clientY - startY;
    
    // Prevent default scrolling when at the top and trying to expand
    if (deltaY < -50 && !isExpanded && modalRef.current) {
      // Allow continuous scroll if expanded
      if (isExpanded) return;
      e.preventDefault();
    }
    
    // Allow closing by dragging down when not expanded or when at top of scroll
    if (deltaY > 100) {
      // Only prevent if we are scrolled down
      if (modalRef.current && modalRef.current.scrollTop > 0) return;
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    
    // Expand if dragged up significantly
    if (deltaY < -100 && !isExpanded) {
      setIsExpanded(true);
    }
    // Close if dragged down significantly
    else if (deltaY > 150) {
      onClose();
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'var(--tg-theme-bg-color)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          width: '100%',
          maxHeight: isExpanded ? '90vh' : '60vh',
          height: isExpanded ? '90vh' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'all 0.3s ease',
          transform: isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : 'none',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header with drag handle */}
        <div
          style={{
            padding: '12px 20px 8px',
            borderBottom: '1px solid var(--tg-theme-separator-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Drag handle */}
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: 'var(--tg-theme-hint-color)',
                borderRadius: '2px',
                marginRight: '8px',
              }}
            />
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--tg-theme-text-color)',
                flex: 1,
              }}
            >
              {location.name}
            </h3>
          </div>
          
          {/* Expand/Close buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--tg-theme-accent-text-color)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                }}
                title="Expand"
              >
                <ChevronUp size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tg-theme-hint-color)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
              }}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Title and Category */}
          <div
            style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid var(--tg-theme-separator-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '24px',
                    fontWeight: '600',
                    color: 'var(--tg-theme-text-color)',
                    lineHeight: '1.2',
                  }}
                >
                  {location.name}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{getCategoryIcon(location.category)}</span>
                  <span
                    style={{
                      fontSize: '14px',
                      color: 'var(--tg-theme-hint-color)',
                    }}
                  >
                    {formatCategory(location.category)}
                  </span>
                </div>
                {rating.count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <StarRating rating={rating.average} readonly size="sm" />
                    <span style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)' }}>
                      ({rating.count})
                    </span>
                  </div>
                )}
              </div>

              {/* Favorite Button */}
              {onToggleFavorite && (
                <button
                  onClick={handleFavoriteToggle}
                  style={{
                    background: localIsFavorited ? '#FEE2E2' : 'var(--tg-theme-bg-color)',
                    border: `2px solid ${localIsFavorited ? '#EF4444' : '#D1D5DB'}`,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}
                  title={localIsFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {localIsFavorited ? '❤️' : '🤍'}
                </button>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          {getAllImages().length > 0 && (
            <div
              style={{
                padding: '0',
                borderBottom: '1px solid var(--tg-theme-separator-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: '8px',
                  padding: '12px 20px',
                  scrollbarWidth: 'none',
                }}
              >
                {getAllImages().map((image, idx) => (
                  <img
                    key={idx}
                    src={image}
                    alt={`Photo ${idx + 1}`}
                    style={{
                      height: '120px',
                      minWidth: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tabs - Sticky */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid var(--tg-theme-separator-color)',
              padding: '0 20px',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'var(--tg-theme-bg-color)',
            }}
          >
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                flex: 1,
                padding: '14px 0',
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${
                  activeTab === 'overview' ? 'var(--tg-theme-accent-text-color)' : 'transparent'
                }`,
                color:
                  activeTab === 'overview'
                    ? 'var(--tg-theme-accent-text-color)'
                    : 'var(--tg-theme-hint-color)',
                fontWeight: activeTab === 'overview' ? '600' : '500',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px',
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                flex: 1,
                padding: '14px 0',
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${
                  activeTab === 'reviews' ? 'var(--tg-theme-accent-text-color)' : 'transparent'
                }`,
                color:
                  activeTab === 'reviews'
                    ? 'var(--tg-theme-accent-text-color)'
                    : 'var(--tg-theme-hint-color)',
                fontWeight: activeTab === 'reviews' ? '600' : '500',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px',
              }}
            >
              Reviews {rating.count > 0 && `(${rating.count})`}
            </button>
          </div>

          {/* Tab Content - Continuous Scroll (No nested scroll) */}
          <div style={{ flex: 1, padding: '0 0 20px' }}>
            {activeTab === 'overview' ? (
              <List>
                {/* Description */}
                {location.description && (
                  <Section>
                    <Cell
                      multiline
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: 'var(--tg-theme-text-color)',
                      }}
                    >
                      {location.description}
                    </Cell>
                  </Section>
                )}

                {/* Location Info */}
                <Section header="Location">
                  <Cell
                    before={<MapPin size={18} style={{ color: 'var(--tg-theme-hint-color)' }} />}
                    subtitle={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                    after={
                      <Button
                        size="s"
                        mode="plain"
                        onClick={() => onLocationClick?.(location.latitude, location.longitude)}
                      >
                        View
                      </Button>
                    }
                  >
                    Coordinates
                  </Cell>
                </Section>

                {/* Website */}
                {location.website_url && (
                  <Section header="Website">
                    <Cell
                      before={<Globe size={18} style={{ color: 'var(--tg-theme-hint-color)' }} />}
                      after={
                        <Button
                          size="s"
                          mode="plain"
                          onClick={() => window.open(location.website_url, '_blank')}
                        >
                          Visit
                        </Button>
                      }
                    >
                      {location.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </Cell>
                  </Section>
                )}

                {/* Schedules */}
                {location.schedules && (
                  <Section header="Hours">
                    {structuredSchedule ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {structuredSchedule.map((entry) => (
                          <div
                            key={entry.day}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '14px',
                              color: 'var(--tg-theme-text-color)',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{entry.day}</span>
                            <span style={{ color: 'var(--tg-theme-hint-color)' }}>
                              {entry.closed
                                ? 'Closed'
                                : entry.open24Hours
                                  ? 'Open 24 hours'
                                  : `${entry.open} - ${entry.close}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Cell
                        multiline
                        style={{
                          fontSize: '14px',
                          whiteSpace: 'pre-line',
                          color: 'var(--tg-theme-text-color)',
                        }}
                      >
                        {location.schedules}
                      </Cell>
                    )}
                  </Section>
                )}

                {/* Additional Info */}
                <Section header="Details">
                  {location.type && (
                    <Cell
                      subtitle="Type"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {location.type}
                    </Cell>
                  )}
                  <Cell subtitle="Added on">
                    {formatDate(location.created_at)}
                  </Cell>
                  {location.users && (
                    <Cell
                      before={
                        <Avatar
                          size={28}
                          src={location.users.avatar_url || undefined}
                          fallbackIcon={<User size={16} />}
                        />
                      }
                      subtitle="Created by"
                    >
                      {location.users.nickname}
                    </Cell>
                  )}
                </Section>
              </List>
            ) : (
              <List>
                {/* Rating Section */}
                <Section>
                  <Cell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                      <div>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                          {rating.average.toFixed(1)}
                        </div>
                        <StarRating rating={rating.average} readonly size="md" />
                        <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
                          {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>

                      {telegramUser && (
                        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--tg-theme-separator-color)' }}>
                          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                            Rate this place
                          </div>
                          <StarRating rating={userRating} onRatingChange={submitRating} size="md" />
                        </div>
                      )}
                    </div>
                  </Cell>
                </Section>

                {/* Comments Section */}
                <Section header="Reviews">
                  {telegramUser && (
                    <Cell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your experience..."
                          header=""
                        />

                        {/* Modern Upload UI */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              border: '2px dashed var(--tg-theme-separator-color)',
                              borderRadius: '12px',
                              padding: '24px 16px',
                              textAlign: 'center',
                              cursor: canUploadImages && !isSubmitting ? 'pointer' : 'default',
                              backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                              transition: 'all 0.2s',
                              opacity: canUploadImages && !isSubmitting ? 1 : 0.6,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div style={{ 
                              width: '48px', 
                              height: '48px', 
                              borderRadius: '50%', 
                              backgroundColor: 'rgba(var(--tg-theme-accent-text-color-rgb, 0, 122, 255), 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '4px'
                            }}>
                              <ImagePlus size={24} style={{ color: 'var(--tg-theme-accent-text-color)' }} />
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--tg-theme-text-color)' }}>
                              Add Photos
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                              Share what this place looks like
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              disabled={!canUploadImages || isSubmitting}
                              onChange={(event) =>
                                handleCommentFileChange(event.target.files?.[0] ?? null)
                              }
                              hidden
                            />
                          </div>

                          {!canUploadImages && (
                            <div style={{ fontSize: '12px', color: 'var(--tg-theme-destructive-text-color)', padding: '0 4px' }}>
                              Configure VITE_SUPABASE_URL to enable image uploads.
                            </div>
                          )}

                          <div style={{ position: 'relative' }}>
                            <Input
                              value={newCommentImage}
                              onChange={(e) => handleCommentImageUrlChange(e.target.value)}
                              placeholder="Or paste an image URL..."
                              header=""
                              type="url"
                              style={{ paddingLeft: '32px' }}
                            />
                            <Camera size={16} style={{ 
                              position: 'absolute', 
                              left: '12px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              color: 'var(--tg-theme-hint-color)'
                            }} />
                          </div>
                        </div>

                        {newCommentImage && (
                          <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
                            <img
                              src={newCommentImage}
                              alt="Preview"
                              style={{
                                maxWidth: '150px',
                                maxHeight: '100px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '2px solid var(--tg-theme-accent-text-color)',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <button
                              onClick={clearImage}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: 'var(--tg-theme-destructive-text-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '14px',
                              }}
                              title="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        <Button
                          size="s"
                          onClick={submitComment}
                          disabled={!newComment.trim() || isSubmitting}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          {isSubmitting ? (
                            'Posting...'
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Send size={14} />
                              Post Review
                            </div>
                          )}
                        </Button>
                      </div>
                    </Cell>
                  )}

                  {isLoadingComments ? (
                    <Cell>Loading reviews...</Cell>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <Cell
                        key={comment.id}
                        before={
                          <Avatar
                            size={28}
                            src={comment.users?.avatar_url || undefined}
                            fallbackIcon={<User size={16} />}
                          />
                        }
                        subtitle={formatDate(comment.created_at)}
                        multiline
                      >
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                            {comment.users?.nickname || 'Anonymous'}
                          </div>
                          <div style={{ color: 'var(--tg-theme-text-color)', lineHeight: '1.5', fontSize: '14px' }}>
                            {comment.content}
                          </div>
                          {comment.image_url && (
                            <div style={{ marginTop: '12px' }}>
                              <img
                                src={comment.image_url}
                                alt="Review photo"
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  maxHeight: '200px',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Cell>
                    ))
                  ) : (
                    <Cell>
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--tg-theme-hint-color)',
                          padding: '20px 0',
                          fontSize: '14px',
                        }}
                      >
                        No reviews yet. Be the first to share your experience!
                      </div>
                    </Cell>
                  )}
                </Section>
              </List>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
