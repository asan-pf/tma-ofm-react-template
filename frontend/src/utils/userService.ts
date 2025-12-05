interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface UserProfile {
  id: number;
  telegram_id: string;
  nickname: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export class UserService {
  private static baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  /**
   * Get or create user - handles the duplicate key error gracefully
   * Now uses hashed IDs and random nicknames for privacy
   */
  static async getOrCreateUser(telegramUser: TelegramUser): Promise<UserProfile | null> {
    try {
      const telegramId = telegramUser.id.toString();
      
      // First try to get existing user (backend will hash the ID)
      try {
        const response = await fetch(`${this.baseUrl}/api/users/${telegramUser.id}`);
        if (response.ok) {
          return await response.json();
        }
        // If 404, user doesn't exist, proceed to create
      } catch (error) {
        console.log('User not found, will create new user');
      }

      // Create new user (backend will hash ID and generate random nickname)
      const createResponse = await fetch(`${this.baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          nickname: '', // Backend will generate random nickname
          avatarUrl: null
        })
      });

      if (createResponse.ok) {
        return await createResponse.json();
      } else if (createResponse.status === 409 || createResponse.status === 400) {
        // User already exists (race condition), try to get it again
        const getResponse = await fetch(`${this.baseUrl}/api/users/${telegramUser.id}`);
        if (getResponse.ok) {
          return await getResponse.json();
        }
      }

      throw new Error('Failed to get or create user');
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: number, updates: Partial<{ avatar_url: string }>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/update/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: number): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
}
