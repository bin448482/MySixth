import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

const TOKEN_KEY = 'user_jwt_token';
const USER_ID_KEY = 'user_id';
const TOKEN_EXPIRY_KEY = 'token_expiry';

interface AnonymousUserResponse {
  user_id: string;
  token: string;
  expires_in: number;
}

class AuthService {
  private static instance: AuthService;
  private baseUrl: string = __DEV__
    ? 'http://192.168.71.2:8001'
    : 'https://api.yourdomain.com';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async registerAnonymousUser(): Promise<AnonymousUserResponse> {
    try {
      const installationId = Application.androidId || Device.modelName || 'unknown';

      const response = await fetch(`${this.baseUrl}/auth/anon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          installation_id: installationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AnonymousUserResponse = await response.json();

      await this.saveToken(data.token);
      await SecureStore.setItemAsync(USER_ID_KEY, data.user_id);

      const expiryTime = Date.now() + data.expires_in * 1000;
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());

      console.log('✅ Anonymous user registered successfully:', data.user_id);
      return data;
    } catch (error) {
      console.error('❌ Failed to register anonymous user:', error);
      throw error;
    }
  }

  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!token) {
        return null;
      }

      const isValid = await this.validateToken();
      if (!isValid) {
        await this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      if (!expiryStr) {
        return false;
      }

      const expiryTime = parseInt(expiryStr, 10);
      const now = Date.now();

      return now < expiryTime;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      console.log('🗑️ Token cleared');
    } catch (error) {
      console.error('Failed to clear token:', error);
      throw error;
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  async initializeUser(): Promise<boolean> {
    try {
      const existingToken = await this.getToken();

      if (existingToken) {
        console.log('✅ Existing valid token found');
        return true;
      }

      console.log('🔄 No valid token, registering anonymous user...');
      await this.registerAnonymousUser();
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize user:', error);
      return false;
    }
  }
}

export default AuthService;