import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Camera, Save, X, MapPin } from "lucide-react";
import {
  Button,
  Cell,
  Section,
  List,
  Avatar,
  Caption,
  Subheadline,
  Title,
  Text,
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
        // Create new user if not found
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
    setEditData({
      nickname: profile?.nickname || "",
      avatar_url: profile?.avatar_url || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <Section
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--tg-color-separator)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={24}
              style={{ backgroundColor: "var(--tg-color-accent)" }}
            >
              <User size={16} />
            </Avatar>
            <div>
              <Title level="2">Profile</Title>
              <Caption>Manage your account settings</Caption>
            </div>
          </div>
          <IconButton mode="outline" size="s" onClick={() => navigate("/")}>
            <X size={16} />
          </IconButton>
        </div>
      </Section>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        {/* Profile Card */}
        <Section style={{ marginBottom: 16 }}>
          {/* Avatar Section */}
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                size={96}
                src={
                  editData.avatar_url ||
                  profile.avatar_url ||
                  telegramUser?.photo_url ||
                  undefined
                }
                style={{
                  border: "4px solid var(--tg-color-bg)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                }}
              />
              {isEditing && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 32,
                    height: 32,
                    backgroundColor: "var(--tg-color-accent)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <Camera size={16} color="white" />
                </div>
              )}
            </div>

            {/* Display name under avatar */}
            {!isEditing && (
              <div style={{ marginTop: 16 }}>
                <Title level="1" style={{ marginBottom: 4 }}>
                  {profile.nickname}
                </Title>
                {telegramUser?.username && (
                  <Caption>@{telegramUser.username}</Caption>
                )}
              </div>
            )}
          </div>

          {/* Profile Form */}
          <List>
            {isEditing && (
              <Cell
                Component="label"
                multiline
                subtitle={
                  <input
                    type="url"
                    value={editData.avatar_url}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        avatar_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/avatar.jpg"
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "1px solid var(--tg-color-separator)",
                      borderRadius: 8,
                      backgroundColor: "var(--tg-color-bg-secondary)",
                      color: "var(--tg-color-text)",
                      fontSize: 14,
                    }}
                  />
                }
              >
                <Subheadline>Avatar URL</Subheadline>
              </Cell>
            )}

            <Cell
              Component="label"
              multiline
              subtitle={
                isEditing ? (
                  <input
                    type="text"
                    value={editData.nickname}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        nickname: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "1px solid var(--tg-color-separator)",
                      borderRadius: 8,
                      backgroundColor: "var(--tg-color-bg-secondary)",
                      color: "var(--tg-color-text)",
                      fontSize: 16,
                    }}
                  />
                ) : (
                  <Text>{profile.nickname}</Text>
                )
              }
            >
              <Subheadline>Display Name</Subheadline>
            </Cell>

            <Cell subtitle={<Caption>{profile.telegram_id}</Caption>}>
              <Subheadline>Telegram ID</Subheadline>
            </Cell>

            <Cell
              subtitle={
                <Badge
                  type="number"
                  mode="secondary"
                  style={{ textTransform: "capitalize" }}
                >
                  {profile.role}
                </Badge>
              }
            >
              <Subheadline>Role</Subheadline>
            </Cell>

            <Cell
              subtitle={
                <Caption>
                  {new Date(profile.created_at).toLocaleDateString()}
                </Caption>
              }
            >
              <Subheadline>Member Since</Subheadline>
            </Cell>
          </List>

          {/* Action Buttons */}
          <div style={{ padding: 16 }}>
            {isEditing ? (
              <div style={{ display: "flex", gap: 12 }}>
                <Button
                  size="l"
                  stretched
                  onClick={handleSave}
                  disabled={isSaving || !editData.nickname.trim()}
                  before={isSaving ? null : <Save size={20} />}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="l"
                  mode="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="l" stretched onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </Section>

        {/* Stats Card */}
        <Section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              paddingBottom: 8,
            }}
          >
            <Avatar
              size={28}
              style={{ backgroundColor: "var(--tg-color-accent)" }}
            >
              <MapPin size={16} />
            </Avatar>
            <Title level="2">Your Activity</Title>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: 16,
                backgroundColor: "var(--tg-color-bg-secondary)",
                borderRadius: 12,
                border: "1px solid var(--tg-color-separator)",
              }}
            >
              <Title
                level="1"
                style={{ color: "var(--tg-color-accent)", marginBottom: 4 }}
              >
                0
              </Title>
              <Caption>Locations Added</Caption>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: 16,
                backgroundColor: "var(--tg-color-bg-secondary)",
                borderRadius: 12,
                border: "1px solid var(--tg-color-separator)",
              }}
            >
              <Title
                level="1"
                style={{
                  color: "var(--tg-color-destructive)",
                  marginBottom: 4,
                }}
              >
                0
              </Title>
              <Caption>Favorites</Caption>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
