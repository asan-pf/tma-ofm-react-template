import { useState } from 'react';
import { 
  Modal, 
  List, 
  Section, 
  Cell, 
  Button, 
  Input,
  Banner
} from '@telegram-apps/telegram-ui';
import { Check, Star, MessageCircle, MapPin, X } from 'lucide-react';
import { StarRating } from './StarRating';
import { initDataState, useSignal } from '@telegram-apps/sdk-react';
import { UserService } from '@/utils/userService';

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: 'grocery' | 'restaurant-bar' | 'other';
  created_at: string;
}

interface LocationAddedModalProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onViewLocation?: (location: Location) => void;
}

export function LocationAddedModal({ 
  location, 
  isOpen, 
  onClose,
  onViewLocation 
}: LocationAddedModalProps) {
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  
  const initData = useSignal(initDataState);
  const telegramUser = initData?.user;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grocery': return '🛒';
      case 'restaurant-bar': return '🍽️';
      default: return '🏪';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'grocery': return '#10B981';
      case 'restaurant-bar': return '#F59E0B';
      default: return '#8B5CF6';
    }
  };

  const submitRating = async (stars: number) => {
    if (!telegramUser) return;
    
    try {
      setIsSubmittingRating(true);
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      // Get or create user
      const user = await UserService.getOrCreateUser(telegramUser);
      if (!user) {
        throw new Error('Failed to get user');
      }

      const response = await fetch(`${BACKEND_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: location.id,
          user_id: user.id,
          stars
        })
      });

      if (response.ok) {
        setUserRating(stars);
        setRatingSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const submitComment = async () => {
    if (!comment.trim() || !telegramUser) return;
    
    try {
      setIsSubmittingComment(true);
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      // Get or create user
      const user = await UserService.getOrCreateUser(telegramUser);
      if (!user) {
        throw new Error('Failed to get user');
      }

      const response = await fetch(`${BACKEND_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: location.id,
          user_id: user.id,
          content: comment
        })
      });

      if (response.ok) {
        setCommentSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setUserRating(0);
    setComment('');
    setRatingSubmitted(false);
    setCommentSubmitted(false);
    onClose();
  };

  return (
    <Modal
      header={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#10B981',
              borderRadius: '50%',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--tg-theme-text-color)' }}>
                Location Added!
              </div>
              <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                Share your experience
              </div>
            </div>
          </div>
          <Button size="s" mode="plain" onClick={handleClose}>
            <X size={16} />
          </Button>
        </div>
      }
      open={isOpen}
      onOpenChange={handleClose}
    >
      <List>
        {/* Success Banner */}
        <Section>
          <Banner
            header="🎉 Success!"
            subheader={`${location.name} has been added to the map and is now available for everyone to see.`}
            type="section"
          />
        </Section>

        {/* Location Details */}
        <Section header="📍 Location Details">
          <Cell
            before={
              <div style={{
                background: getCategoryColor(location.category),
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {getCategoryIcon(location.category)}
              </div>
            }
            after={
              <Button 
                size="s" 
                mode="filled" 
                onClick={() => onViewLocation?.(location)}
              >
                <MapPin size={14} style={{ marginRight: '4px' }} />
                View
              </Button>
            }
          >
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                {location.name}
              </div>
              {location.description && (
                <div style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                  {location.description}
                </div>
              )}
              <div style={{ 
                color: 'var(--tg-theme-hint-color)', 
                fontSize: '12px',
                marginTop: '4px'
              }}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            </div>
          </Cell>
        </Section>

        {/* Rate this Place */}
        <Section header="⭐ Rate this Place">
          <Cell
            before={<Star size={20} style={{ color: '#F59E0B' }} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!ratingSubmitted ? (
                <>
                  <div style={{ fontSize: '14px', color: 'var(--tg-theme-text-color)' }}>
                    How would you rate {location.name}?
                  </div>
                  <StarRating 
                    rating={userRating} 
                    onRatingChange={submitRating}
                    size="lg"
                  />
                  {isSubmittingRating && (
                    <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                      Submitting rating...
                    </div>
                  )}
                </>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#10B981'
                }}>
                  <Check size={16} />
                  <span style={{ fontSize: '14px' }}>
                    Thank you for rating {location.name}!
                  </span>
                </div>
              )}
            </div>
          </Cell>
        </Section>

        {/* Add Comment */}
        <Section header="💬 Share Your Experience">
          <Cell>
            {!commentSubmitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  header=""
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    size="s" 
                    mode="filled"
                    onClick={submitComment}
                    disabled={!comment.trim() || isSubmittingComment}
                    style={{ flex: 1 }}
                  >
                    {isSubmittingComment ? (
                      'Posting...'
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageCircle size={14} />
                        Post Comment
                      </div>
                    )}
                  </Button>
                  <Button 
                    size="s" 
                    mode="plain"
                    onClick={() => setComment('')}
                    disabled={isSubmittingComment}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#10B981',
                padding: '12px',
                background: 'var(--tg-theme-secondary-bg-color)',
                borderRadius: '12px'
              }}>
                <Check size={16} />
                <span style={{ fontSize: '14px' }}>
                  Your comment has been posted!
                </span>
              </div>
            )}
          </Cell>
        </Section>

        {/* Action Buttons */}
        <Section>
          <div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
            <Button 
              size="l" 
              mode="filled"
              onClick={() => onViewLocation?.(location)}
              style={{ flex: 1 }}
            >
              <MapPin size={16} style={{ marginRight: '8px' }} />
              View on Map
            </Button>
            <Button 
              size="l" 
              mode="plain"
              onClick={handleClose}
              style={{ flex: 1 }}
            >
              Done
            </Button>
          </div>
        </Section>
      </List>
    </Modal>
  );
}