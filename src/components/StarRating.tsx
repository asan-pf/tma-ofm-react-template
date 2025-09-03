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
    if (!readonly && onRatingChange) {
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
    <div className="flex items-center gap-1">
      <div className="flex items-center" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${readonly ? "cursor-default" : "cursor-pointer"} ${
              !readonly ? "hover:scale-110 transition-transform" : ""
            }`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={readonly}
          >
            <Star
              size={starSize}
              className={`${
                star <= displayRating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              } transition-colors`}
            />
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
