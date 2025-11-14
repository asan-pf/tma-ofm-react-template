import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Camera, Save, X, MapPin } from "lucide-react";
import {
  Button,
  Avatar,
  Caption,
  Title,
  IconButton,
  Badge,
  Placeholder,
} from "@telegram-apps/telegram-ui";
import { useSignal, initDataState } from "@telegram-apps/sdk-react";

interface UserProfile {
  id: number;
  telegram_id: string;
  nickname: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    nickname: "",
    avatar_url: "",
  });

  const navigate = useNavigate();
  const initData = useSignal(initDataState);
  const telegramUser = initData?.user;

  useEffect(() => {
    if (telegramUser) {
      loadProfile();
    }
  }, [telegramUser]);

  const loadProfile = async () => {
    if (!telegramUser) return;

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      let profileData;
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/users/${telegramUser.id}`
        );
        if (response.ok) {
          profileData = await response.json();
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        const createResponse = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegramId: telegramUser.id.toString(),
            nickname:
              telegramUser.username ||
              `${telegramUser.first_name} ${
                telegramUser.last_name || ""
              }`.trim(),
            avatarUrl: null,
          }),
        });
        profileData = await createResponse.json();
      }

      setProfile(profileData);
      setEditData({
        nickname: profileData.nickname,
        avatar_url: profileData.avatar_url || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      const response = await fetch(
        `${BACKEND_URL}/api/users/update/${profile.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: editData.nickname,
            avatarUrl: editData.avatar_url || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;

    setEditData({
      nickname: profile.nickname,
      avatar_url: profile.avatar_url || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="profile-page__loading">
        <Placeholder
          header="Loading Profile..."
          description="Please wait while we load your profile information"
        >
          <User size={48} color="var(--tg-color-text-accent)" />
        </Placeholder>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page__loading">
        <Placeholder
          header="Profile Error"
          description="Failed to load profile information"
          action={
            <Button size="s" onClick={() => navigate("/")}>
              Back to Map
            </Button>
          }
        >
          <X size={48} color="var(--tg-color-destructive)" />
        </Placeholder>
      </div>
    );
  }

  const currentAvatar =
    editData.avatar_url || profile.avatar_url || telegramUser?.photo_url || undefined;

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__header">
          <div className="profile-hero__title">
            <Avatar size={28} style={{ backgroundColor: "var(--tg-color-accent)" }}>
              <User size={18} />
            </Avatar>
            <div>
              <Title level="2">Profile</Title>
              <Caption>Manage your account settings</Caption>
            </div>
          </div>
          <div className="profile-hero__actions">
            {!isEditing && (
              <Button size="s" mode="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
            <IconButton mode="outline" size="s" onClick={() => navigate("/")}>
              <X size={16} />
            </IconButton>
          </div>
        </div>

        <div className="profile-hero__body">
          <div className="profile-avatar">
            <Avatar
              size={96}
              src={currentAvatar}
              style={{
                border: "4px solid rgba(255,255,255,0.9)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
              }}
            />
            {isEditing && (
              <button className="profile-avatar__edit" aria-label="Change avatar">
                <Camera size={16} />
              </button>
            )}
          </div>
          <div className="profile-identity">
            <Title level="1">{profile.nickname}</Title>
            {telegramUser?.username && (
              <Caption>@{telegramUser.username}</Caption>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-card__header">
            <Title level="3">Account Details</Title>
            <Caption>Keep your profile information up to date</Caption>
          </div>

          <div className="profile-field">
            <label>Display Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.nickname}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    nickname: e.target.value,
                  }))
                }
                className="profile-input"
                placeholder="Enter your name"
              />
            ) : (
              <p className="profile-value">{profile.nickname}</p>
            )}
          </div>

          {isEditing && (
            <div className="profile-field">
              <label>Avatar URL</label>
              <input
                type="url"
                value={editData.avatar_url}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    avatar_url: e.target.value,
                  }))
                }
                className="profile-input"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          )}

          <div className="profile-field">
            <label>Telegram ID</label>
            <p className="profile-value muted">{profile.telegram_id}</p>
          </div>

          <div className="profile-field">
            <label>Role</label>
            <Badge mode="secondary" type="number" style={{ textTransform: "capitalize" }}>
              {profile.role}
            </Badge>
          </div>

          <div className="profile-field">
            <label>Member Since</label>
            <p className="profile-value">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>

          {isEditing && (
            <div className="profile-actions">
              <Button
                mode="filled"
                size="l"
                onClick={handleSave}
                disabled={isSaving || !editData.nickname.trim()}
                className="profile-actions__primary"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <span className="profile-actions__primary-content">
                    <Save size={16} />
                    Save Changes
                  </span>
                )}
              </Button>
              <Button
                mode="outline"
                size="l"
                onClick={handleCancel}
                disabled={isSaving}
                className="profile-actions__secondary"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-card__header">
            <div className="profile-card__icon">
              <MapPin size={18} />
            </div>
            <div>
              <Title level="3">Your Activity</Title>
              <Caption>Track locations you add and favorite</Caption>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <Title level="1">0</Title>
              <Caption>Locations Added</Caption>
            </div>
            <div className="profile-stat">
              <Title level="1">0</Title>
              <Caption>Favorites</Caption>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
