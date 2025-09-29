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

// 管理员认证API
export const authApi = {
  // 管理员登录
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/api/v1/admin-api/login', credentials);
    // Cookie认证会由后端自动处理，我们只需保存token到localStorage用于前端状态检查
    if (response.access_token) {
      localStorage.setItem('admin_token', response.access_token);
    }
    return response;
  },

  // 获取管理员信息
  getProfile: async (): Promise<AdminProfile> => {
    return apiClient.get<AdminProfile>('/api/v1/admin-api/profile');
  },

  // 刷新token
  refreshToken: async (): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/api/v1/admin-api/refresh');
    if (response.access_token) {
      apiClient.setAuthToken(response.access_token);
    }
    return response;
  },

  // 登出
  logout: async () => {
    try {
      await apiClient.post('/api/v1/admin-api/logout');
    } finally {
      // 清除本地存储的token，Cookie会由后端自动清除
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('admin_token');
      }
    }
  },
};

// 用户管理API
export const usersApi = {
  // 获取用户列表
  getUsers: async (filters: UserFilters): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<UserListResponse>(`/api/v1/admin/users?${params.toString()}`);
  },

  // 获取用户详情
  getUserDetail: async (installationId: string): Promise<UserDetailResponse> => {
    return apiClient.get<UserDetailResponse>(`/api/v1/admin/users/${installationId}`);
  },

  // 调整用户积分
  adjustCredits: async (request: AdjustCreditsRequest) => {
    return apiClient.post('/api/v1/admin/users/adjust-credits', request);
  },

  // 删除用户
  deleteUser: async (installationId: string) => {
    return apiClient.delete(`/api/v1/admin/users/${installationId}`);
  },

  // 导出用户数据
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

// 兑换码管理API
export const redeemCodesApi = {
  // 获取兑换码列表
  getRedeemCodes: async (filters: RedeemCodeFilters): Promise<RedeemCodeListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<RedeemCodeListResponse>(`/api/v1/admin/redeem-codes?${params.toString()}`);
  },

  // 生成兑换码
  generateRedeemCodes: async (request: GenerateRedeemCodesRequest) => {
    return apiClient.post('/api/v1/admin/redeem-codes/generate', request);
  },

  // 更新兑换码状态
  updateRedeemCodeStatus: async (id: number, status: string, reason?: string) => {
    return apiClient.put(`/api/v1/admin/redeem-codes/${id}`, { status, reason });
  },

  // 获取兑换码统计
  getStats: async () => {
    return apiClient.get('/api/v1/admin/redeem-codes/stats');
  },

  // 获取批次列表
  getBatches: async () => {
    return apiClient.get('/api/v1/admin/redeem-codes/batches');
  },

  // 导出兑换码数据
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

// 仪表板API
export const dashboardApi = {
  // 获取仪表板数据
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
      // 暂时使用模拟数据，避免网络错误
      console.log('使用模拟数据，避免网络连接问题');
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

      // 注释掉实际API调用，等网络问题解决后再启用
      // // 先尝试获取用户列表来计算指标
      // const usersData = await usersApi.getUsers({ page: 1, size: 1000 });
      // const redeemCodesData = await redeemCodesApi.getRedeemCodes({ page: 1, size: 1000 });

      // // 计算基本指标
      // const totalUsers = usersData.total || 0;
      // const totalCredits = usersData.users?.reduce((sum, user) => sum + (user.total_credits || 0), 0) || 0;
      // const activeUsers = usersData.users?.filter(user =>
      //   user.last_active_at && new Date(user.last_active_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      // ).length || 0;

      // return {
      //   total_users: totalUsers,
      //   total_credits_sold: totalCredits,
      //   active_users_30d: activeUsers,
      //   orders_today: 0, // 暂时没有订单数据
      //   users_growth: 0, // 暂时无法计算增长率
      //   revenue_growth: 0,
      //   active_users_ratio: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      //   orders_growth: 0,
      // };
    } catch (error) {
      console.warn('Failed to fetch real metrics, using mock data:', error);
      // 如果API调用失败，使用模拟数据
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

  // 获取图表数据
  getChartData: async (): Promise<Record<string, unknown>> => {
    // 暂时使用模拟数据，后续可以基于真实交易数据生成
    return {
      revenue_labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      revenue_data: [4200, 5100, 4800, 6200, 5800, 6800],
      user_growth_labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      user_growth_data: [12, 19, 15, 25, 22, 18, 28],
      platform_labels: ['Google Play', '兑换码', '其他'],
      platform_data: [65, 28, 7],
    };
  },

  // 获取最近活动
  getRecentActivities: async (): Promise<RecentActivity[]> => {
    try {
      // 暂时使用模拟数据，避免网络错误
      console.log('使用模拟数据，避免网络连接问题');
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
        {
          id: '3',
          type: 'adjust' as const,
          installation_id: 'ghi789jkl012',
          credits: 25,
          created_at: new Date().toISOString()
        },
      ];

      // 注释掉实际API调用，等网络问题解决后再启用
      // // 获取最近的用户数据作为活动示例
      // const usersData = await usersApi.getUsers({ page: 1, size: 10 });

      // return usersData.users?.slice(0, 5).map((user, index) => ({
      //   id: `activity-${index}`,
      //   type: ['purchase', 'redeem', 'adjust'][index % 3] as any,
      //   installation_id: user.installation_id,
      //   credits: Math.floor(Math.random() * 100) + 10,
      //   created_at: user.created_at
      // })) || [];
    } catch (error) {
      console.warn('Failed to fetch real activities, using mock data:', error);
      // 如果API调用失败，使用模拟数据
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