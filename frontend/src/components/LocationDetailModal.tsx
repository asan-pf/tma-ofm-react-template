import { useState, useEffect, useRef } from "react";
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
  MessageCircle,
  Star,
  User,
  Send,
  ChevronUp,
  X,
} from "lucide-react";
import { StarRating } from "./StarRating";
import { initDataState, useSignal } from "@telegram-apps/sdk-react";
import { UserService } from "@/utils/userService";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: "grocery" | "restaurant-bar" | "other";
  created_at: string;
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
  const [userRating, setUserRating] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const initData = useSignal(initDataState);
  const telegramUser = initData?.user;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "grocery":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "restaurant-bar":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    }
  };

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

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "";
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
        import.meta.env.VITE_BACKEND_URL || "";
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
    setNewCommentImage("");
  };

  const submitComment = async () => {
    if (!newComment.trim() || !telegramUser) return;

    try {
      setIsSubmitting(true);
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "";

      // Get or create user
      const user = await UserService.getOrCreateUser(telegramUser);
      if (!user) {
        throw new Error("Failed to get user");
      }

      const response = await fetch(`${BACKEND_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: location.id,
          user_id: user.id,
          content: newComment,
          image_url: newCommentImage || null,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setNewCommentImage("");
        loadComments(); // Refresh comments
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRating = async (stars: number) => {
    if (!telegramUser) return;

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "";

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
      e.preventDefault();
    }

    // Allow closing by dragging down when not expanded or when at top of scroll
    if (deltaY > 100) {
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
            padding: '8px 0',
          }}
        >
          <List>
            {/* Header with Location Info and Favorite Button */}
            <Section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "var(--tg-theme-secondary-bg-color)",
                  borderRadius: "12px",
                  margin: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      background: getCategoryColor(location.category).includes("green")
                        ? "#10B981"
                        : getCategoryColor(location.category).includes("orange")
                          ? "#F59E0B"
                          : "#8B5CF6",
                      borderRadius: "12px",
                      padding: "12px",
                      fontSize: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "48px",
                      height: "48px",
                    }}
                  >
                    {getCategoryIcon(location.category)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "var(--tg-theme-text-color)",
                        marginBottom: "4px",
                      }}
                    >
                      {location.name}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--tg-theme-hint-color)",
                        textTransform: "capitalize",
                      }}
                    >
                      {formatCategory(location.category)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--tg-theme-hint-color)",
                        marginTop: "2px",
                      }}
                    >
                      Added {formatDate(location.created_at)}
                    </div>
                  </div>
                </div>

                {/* Favorite Button */}
                {onToggleFavorite && (
                  <button
                    onClick={handleFavoriteToggle}
                    style={{
                      background: localIsFavorited ? "#FEE2E2" : "var(--tg-theme-bg-color)",
                      border: `2px solid ${localIsFavorited ? "#EF4444" : "#D1D5DB"}`,
                      borderRadius: "50%",
                      width: "44px",
                      height: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "20px",
                      pointerEvents: "auto",
                      touchAction: "manipulation",
                      transition: "all 0.2s ease",
                    }}
                    title={localIsFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    {localIsFavorited ? "❤️" : "🤍"}
                  </button>
                )}
              </div>
            </Section>

            {/* Location Details */}
            <Section header="📍 Location Details">
              <Cell
                before={
                  <MapPin
                    size={20}
                    style={{ color: "var(--tg-theme-accent-text-color)" }}
                  />
                }
                subtitle={`${location.latitude.toFixed(
                  6
                )}, ${location.longitude.toFixed(6)}`}
                after={
                  <Button
                    size="s"
                    mode="plain"
                    onClick={() =>
                      onLocationClick?.(location.latitude, location.longitude)
                    }
                  >
                    View
                  </Button>
                }
              >
                Location
              </Cell>

              {location.description && (
                <Cell
                  before={
                    <MessageCircle
                      size={20}
                      style={{ color: "var(--tg-theme-accent-text-color)" }}
                    />
                  }
                  multiline
                >
                  {location.description}
                </Cell>
              )}
            </Section>

            {/* Rating Section */}
            <Section header="⭐ Rating & Reviews">
              <Cell before={<Star size={20} style={{ color: "#F59E0B" }} />}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <StarRating
                    rating={rating.average}
                    readonly
                    size="md"
                    count={rating.count}
                  />

                  {telegramUser && (
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          marginBottom: "8px",
                          color: "var(--tg-theme-text-color)",
                        }}
                      >
                        Your Rating:
                      </div>
                      <StarRating
                        rating={userRating}
                        onRatingChange={submitRating}
                        size="md"
                      />
                    </div>
                  )}
                </div>
              </Cell>
            </Section>

            {/* Comments Section */}
            <Section header="💬 Comments">
              {telegramUser && (
                <Cell>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      width: "100%",
                    }}
                  >
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience..."
                      header=""
                    />

                    <Input
                      value={newCommentImage}
                      onChange={(e) => setNewCommentImage(e.target.value)}
                      placeholder="Image URL (optional)"
                      header=""
                      type="url"
                    />

                    {/* Image Preview */}
                    {newCommentImage && (
                      <div
                        style={{
                          position: "relative",
                          display: "inline-block",
                          alignSelf: "flex-start",
                        }}
                      >
                        <img
                          src={newCommentImage}
                          alt="Preview"
                          style={{
                            maxWidth: "150px",
                            maxHeight: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "2px solid var(--tg-theme-accent-text-color)",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <button
                          onClick={clearImage}
                          style={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            background: "var(--tg-theme-destructive-text-color)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "14px",
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
                      style={{ alignSelf: "flex-start" }}
                    >
                      {isSubmitting ? (
                        "Posting..."
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Send size={14} />
                          Post Comment
                        </div>
                      )}
                    </Button>
                  </div>
                </Cell>
              )}

              {isLoadingComments ? (
                <Cell>Loading comments...</Cell>
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
                      <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                        {comment.users?.nickname || "Anonymous"}
                      </div>
                      <div
                        style={{
                          color: "var(--tg-theme-text-color)",
                          lineHeight: "1.4",
                        }}
                      >
                        {comment.content}
                      </div>
                      {comment.image_url && (
                        <div style={{ marginTop: "8px" }}>
                          <img
                            src={comment.image_url}
                            alt="Comment image"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: "8px",
                              maxHeight: "200px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
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
                      textAlign: "center",
                      color: "var(--tg-theme-hint-color)",
                      padding: "20px 0",
                    }}
                  >
                    No comments yet. Be the first to share your experience!
                  </div>
                </Cell>
              )}
            </Section>
          </List>
        </div>
      </div>
    </div>
  );
}
