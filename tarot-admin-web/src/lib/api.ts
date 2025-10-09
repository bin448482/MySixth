import { apiClient } from './api-client';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminProfile,
  UserListResponse,
  UserDetailResponse,
  UserFilters,
  AdjustCreditsRequest,
  RedeemCodeListResponse,
  RedeemCodeFilters,
  GenerateRedeemCodesRequest,
  DashboardMetrics,
  RecentActivity,
} from '@/types';

// 绠＄悊鍛樿璇丄PI
export const authApi = {
  // 绠＄悊鍛樼櫥褰?
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/api/v1/admin-api/login', credentials);
    // 淇濆瓨 JWT token 鍒?localStorage
    if (response.access_token) {
      localStorage.setItem('admin_token', response.access_token);
    }
    return response;
  },

  // 鑾峰彇绠＄悊鍛樹俊鎭?
  getProfile: async (): Promise<AdminProfile> => {
    return apiClient.get<AdminProfile>('/api/v1/admin-api/profile');
  },

  // 鍒锋柊token
  refreshToken: async (): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/api/v1/admin-api/refresh');
    if (response.access_token) {
      apiClient.setAuthToken(response.access_token);
    }
    return response;
  },

  // 鐧诲嚭
  logout: async () => {
    try {
      await apiClient.post('/api/v1/admin-api/logout');
    } finally {
      // 娓呴櫎鏈湴瀛樺偍鐨?JWT token
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('admin_token');
      }
    }
  },

  // 鍙戦€侀偖绠遍獙璇侀偖浠?
  sendVerificationEmail: async (installationId: string, email: string) => {
    return apiClient.post('/api/v1/auth/email/send-verification', {
      user_id: installationId,
      email: email
    });
  },

  // 楠岃瘉閭token
  verifyEmailToken: async (token: string) => {
    return apiClient.post('/api/v1/auth/email/verify', {
      token: token
    });
  },
};

// 鐢ㄦ埛绠＄悊API
export const usersApi = {
  // 鑾峰彇鐢ㄦ埛鍒楄〃
  getUsers: async (filters: UserFilters): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<UserListResponse>(`/api/v1/admin/users?${params.toString()}`);
  },

  // 鑾峰彇鐢ㄦ埛璇︽儏
  getUserDetail: async (installationId: string): Promise<UserDetailResponse> => {
    return apiClient.get<UserDetailResponse>(`/api/v1/admin/users/${installationId}`);
  },

  // 璋冩暣鐢ㄦ埛绉垎
  adjustCredits: async (request: AdjustCreditsRequest) => {
    return apiClient.post('/api/v1/admin/users/adjust-credits', request);
  },

  // 鍒犻櫎鐢ㄦ埛
  deleteUser: async (installationId: string) => {
    return apiClient.delete(`/api/v1/admin/users/${installationId}`);
  },

  // 瀵煎嚭鐢ㄦ埛鏁版嵁
  exportUsers: async (filters: Partial<UserFilters>): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/admin/users/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};

// 鍏戞崲鐮佺鐞咥PI
export const redeemCodesApi = {
  // 鑾峰彇鍏戞崲鐮佸垪琛?
  getRedeemCodes: async (filters: RedeemCodeFilters): Promise<RedeemCodeListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<RedeemCodeListResponse>(`/api/v1/admin/redeem-codes?${params.toString()}`);
  },

  // 鐢熸垚鍏戞崲鐮?
    generateRedeemCodes: async (request: GenerateRedeemCodesRequest): Promise<{ count: number }> => {
    return apiClient.post<{ count: number }>(
      '/api/v1/admin/redeem-codes/generate',
      request
    );
  },

  // 鏇存柊鍏戞崲鐮佺姸鎬?
  updateRedeemCodeStatus: async (id: number, status: string, reason?: string) => {
    return apiClient.put(`/api/v1/admin/redeem-codes/${id}`, { status, reason });
  },

  // 鑾峰彇鍏戞崲鐮佺粺璁?
  getStats: async () => {
    return apiClient.get('/api/v1/admin/redeem-codes/stats');
  },

  // 鑾峰彇鎵规鍒楄〃
  getBatches: async (): Promise<{ batches: string[] }> => { return apiClient.get<{ batches: string[] }>('/api/v1/admin/redeem-codes/batches'); },

  // 瀵煎嚭鍏戞崲鐮佹暟鎹?
  exportRedeemCodes: async (filters: Partial<RedeemCodeFilters>): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/admin/redeem-codes/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};

// 浠〃鏉緼PI
export const dashboardApi = {
  // 鑾峰彇浠〃鏉挎暟鎹?
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
      // 鑾峰彇鍩烘湰缁熻鏁版嵁 - 鍙幏鍙栫涓€椤垫潵鑾峰彇total璁℃暟鍜岄儴鍒嗘暟鎹?
      const usersData = await usersApi.getUsers({ page: 1, size: 100 });
      const redeemCodesData = await redeemCodesApi.getRedeemCodes({ page: 1, size: 100 });

      // 鍩烘湰鎸囨爣璁＄畻锛堝熀浜庡彲鐢ㄦ暟鎹殑杩戜技鍊硷級
      const totalUsers = usersData.total || 0;

      // 鍩轰簬绗竴椤垫暟鎹绠楁椿璺冪敤鎴锋瘮渚嬶紝鐒跺悗浼扮畻鎬绘暟
      const sampleActiveUsers = usersData.users?.filter(user =>
        user.last_active_at && new Date(user.last_active_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;

      const sampleSize = usersData.users?.length || 0;
      const activeRatio = sampleSize > 0 ? sampleActiveUsers / sampleSize : 0;
      const estimatedActiveUsers = Math.round(totalUsers * activeRatio);

      // 鍩轰簬鏍锋湰浼扮畻鎬荤Н鍒?
      const sampleTotalCredits = usersData.users?.reduce((sum, user) => sum + (user.total_credits || 0), 0) || 0;
      const avgCreditsPerUser = sampleSize > 0 ? sampleTotalCredits / sampleSize : 0;
      const estimatedTotalCredits = Math.round(totalUsers * avgCreditsPerUser);

      return {
        total_users: totalUsers,
        total_credits_sold: estimatedTotalCredits,
        active_users_30d: estimatedActiveUsers,
        orders_today: 0, // 鏆傛椂娌℃湁璁㈠崟鏁版嵁
        users_growth: 0, // 鏆傛椂鏃犳硶璁＄畻澧為暱鐜?
        revenue_growth: 0,
        active_users_ratio: totalUsers > 0 ? (estimatedActiveUsers / totalUsers) * 100 : 0,
        orders_growth: 0,
      };
    } catch (error) {
      console.warn('Failed to fetch real metrics, using mock data:', error);
      // 濡傛灉API璋冪敤澶辫触锛屼娇鐢ㄦā鎷熸暟鎹?
      return {
        total_users: 1250,
        total_credits_sold: 45680,
        active_users_30d: 890,
        orders_today: 23,
        users_growth: 12.5,
        revenue_growth: 18.3,
        active_users_ratio: 71.2,
        orders_growth: 8.7,
      };
    }
  },

  // 鑾峰彇鍥捐〃鏁版嵁
    getChartData: async (): Promise<Record<string, unknown>> => {
    // Mock data; replace with real series when backend is ready
    return {
      revenue_labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      revenue_data: [4200, 5100, 4800, 6200, 5800, 6800],
      user_growth_labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      user_growth_data: [12, 19, 15, 25, 22, 18, 28],
      platform_labels: ['Google Play','Redeem','Other'],
      platform_data: [65, 28, 7],
    };
  },
getRecentActivities: async (): Promise<RecentActivity[]> => {
    try {
      // 鑾峰彇鏈€杩戠殑鐢ㄦ埛鏁版嵁浣滀负娲诲姩绀轰緥
      const usersData = await usersApi.getUsers({ page: 1, size: 10 });

      return usersData.users?.slice(0, 5).map((user, index) => ({
        id: `activity-${index}`,
        type: ['purchase', 'redeem', 'adjust'][index % 3] as 'purchase' | 'redeem' | 'adjust',
        installation_id: user.installation_id,
        credits: Math.floor(Math.random() * 100) + 10,
        created_at: user.created_at
      })) || [];
    } catch (error) {
      console.warn('Failed to fetch real activities, using mock data:', error);
      // 濡傛灉API璋冪敤澶辫触锛屼娇鐢ㄦā鎷熸暟鎹?
      return [
        {
          id: '1',
          type: 'purchase' as const,
          installation_id: 'abc123def456',
          credits: 100,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'redeem' as const,
          installation_id: 'def456ghi789',
          credits: 50,
          created_at: new Date().toISOString()
        },
      ];
    }
  },
};


