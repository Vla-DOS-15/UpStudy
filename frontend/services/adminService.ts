import api from '@/lib/axios';

export const adminService = {
  getPendingVerifications: async () => {
    const { data } = await api.get('/Admin/verifications');
    return data;
  },
  
  getVerificationDetails: async (userId: string) => {
    const { data } = await api.get(`/Admin/verifications/${userId}`);
    return data;
  },

  approveUser: async (userId: string) => {
    return await api.post(`/Admin/verifications/${userId}/approve`);
  },

  rejectUser: async (userId: string, reason: string) => {
    return await api.post(`/Admin/verifications/${userId}/reject`, { reason });
  },

  getAllUsers: async () => {
    const { data } = await api.get<any[]>('/Admin/users'); // Припускаємо такий ендпоінт, треба додати в контролер
    return data;
  },
  
    toggleBlockUser: async (userId: string, isBlocked: boolean) => {
        return await api.post(`/Admin/users/${userId}/block`, { isBlocked });
    }
};