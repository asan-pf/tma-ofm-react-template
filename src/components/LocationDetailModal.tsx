import { useState, useEffect } from 'react';
import { 
  Modal, 
  List, 
  Section, 
  Cell, 
  Button, 
  Input,
  Avatar
} from '@telegram-apps/telegram-ui';
import { MapPin, MessageCircle, Star, Calendar, User, Send } from 'lucide-react';
import { StarRating } from './StarRating';
import { initDataState, useSignal } from '@telegram-apps/sdk-react';

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: 'grocery' | 'restaurant-bar' | 'other';
  created_at: string;
}

interface Comment {
  id: number;
  content: string;
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
}

export function LocationDetailModal({ 
  location, 
  isOpen, 
  onClose, 
  onLocationClick 
}: LocationDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState<Rating>({ average: 0, count: 0 });
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initData = useSignal(initDataState);
  const telegramUser = initData?.user;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'grocery': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'restaurant-bar': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/comments?location_id=${location.id}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadRating = async () => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/ratings?location_id=${location.id}`);
      if (response.ok) {
        const data = await response.json();
        setRating({ average: data.average, count: data.count });
      }
    } catch (error) {
      console.error('Error loading rating:', error);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !telegramUser) return;
    
    try {
      setIsSubmitting(true);
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      // First create/get user
      const userResponse = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: telegramUser.id.toString(),
          nickname: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
          avatarUrl: null
        })
      });
      
      let userId = null;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userId = userData.id;
      }

      const response = await fetch(`${BACKEND_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: location.id,
          user_id: userId,
          content: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        loadComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRating = async (stars: number) => {
    if (!telegramUser) return;
    
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      // First create/get user
      const userResponse = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: telegramUser.id.toString(),
          nickname: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
          avatarUrl: null
        })
      });
      
      let userId = null;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userId = userData.id;
      }

      const response = await fetch(`${BACKEND_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: location.id,
          user_id: userId,
          stars
        })
      });

      if (response.ok) {
        setUserRating(stars);
        loadRating(); // Refresh rating
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  useEffect(() => {
    if (isOpen && location) {
      loadComments();
      loadRating();
    }
  }, [isOpen, location]);

  return (
    <Modal
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
          <div style={{
            background: getCategoryColor(location.category).includes('green') ? '#34D399' :
                       getCategoryColor(location.category).includes('orange') ? '#F59E0B' : '#8B5CF6',
            borderRadius: '12px',
            padding: '8px',
            fontSize: '18px'
          }}>
            {getCategoryIcon(location.category)}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--tg-theme-text-color)' }}>
              {location.name}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
              {formatCategory(location.category)}
            </div>
          </div>
        </div>
      }
      open={isOpen}
      onOpenChange={onClose}
    >
      <List>
        {/* Location Info */}
        <Section>
          <Cell
            before={<MapPin size={20} style={{ color: 'var(--tg-theme-accent-text-color)' }} />}
            subtitle={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            after={
              <Button size="s" mode="plain" onClick={() => onLocationClick?.(location.latitude, location.longitude)}>
                View
              </Button>
            }
          >
            Location
          </Cell>
          
          {location.description && (
            <Cell
              before={<MessageCircle size={20} style={{ color: 'var(--tg-theme-accent-text-color)' }} />}
              multiline
            >
              {location.description}
            </Cell>
          )}
          
          <Cell
            before={<Calendar size={20} style={{ color: 'var(--tg-theme-accent-text-color)' }} />}
          >
            Added {formatDate(location.created_at)}
          </Cell>
        </Section>

        {/* Rating Section */}
        <Section header="⭐ Rating & Reviews">
          <Cell
            before={<Star size={20} style={{ color: '#F59E0B' }} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <StarRating 
                rating={rating.average} 
                readonly 
                size="md" 
                count={rating.count} 
              />
              
              {telegramUser && (
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--tg-theme-text-color)' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience..."
                  header=""
                />
                <Button 
                  size="s" 
                  onClick={submitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isSubmitting ? 'Posting...' : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {comment.users?.nickname || 'Anonymous'}
                  </div>
                  <div style={{ color: 'var(--tg-theme-text-color)', lineHeight: '1.4' }}>
                    {comment.content}
                  </div>
                </div>
              </Cell>
            ))
          ) : (
            <Cell>
              <div style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)', padding: '20px 0' }}>
                No comments yet. Be the first to share your experience!
              </div>
            </Cell>
          )}
        </Section>
      </List>
    </Modal>
  );
}