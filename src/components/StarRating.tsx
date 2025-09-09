import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  count?: number;
}

export function StarRating({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = "md",
  count,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const starSize = sizes[size];

  const handleStarClick = (starValue: number) => {
    console.log('Star clicked:', starValue, 'readonly:', readonly, 'hasCallback:', !!onRatingChange);
    if (!readonly && onRatingChange) {
      console.log('Calling onRatingChange with:', starValue);
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (!readonly) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          isolation: 'isolate',
          zIndex: 9999,
          position: 'relative'
        }} 
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              console.log('STAR BUTTON CLICKED:', star, 'readonly:', readonly, 'callback:', !!onRatingChange);
              if (!readonly && onRatingChange) {
                handleStarClick(star);
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('STAR BUTTON MOUSE DOWN:', star);
              if (!readonly && onRatingChange) {
                handleStarClick(star);
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('STAR BUTTON TOUCH START:', star);
              if (!readonly && onRatingChange) {
                handleStarClick(star);
              }
            }}
            onMouseEnter={() => {
              console.log('STAR HOVER:', star);
              handleStarHover(star);
            }}
            disabled={readonly}
            style={{
              fontSize: starSize + 'px',
              color: star <= displayRating ? "#fbbf24" : "#d1d5db",
              cursor: readonly ? 'default' : 'pointer',
              userSelect: 'none',
              padding: '8px',
              margin: '0 2px',
              display: 'inline-block',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              background: 'none',
              border: 'none',
              zIndex: 10000,
              position: 'relative',
              outline: 'none',
            }}
            title={readonly ? '' : `Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            {star <= displayRating ? "⭐" : "☆"}
          </button>
        ))}
      </div>

      {count !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}

      {!readonly && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
          {hoverRating > 0
            ? `${hoverRating} star${hoverRating > 1 ? "s" : ""}`
            : "Rate this place"}
        </span>
      )}
    </div>
  );
}
