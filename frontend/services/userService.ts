import api from '@/lib/axios';

export const userService = {
  async getUserProfile(userId: string) {
    const response = await api.get(`/Users/${userId}/profile`);
    return response.data;
  },
  
  async getUsers() {
    const response = await api.get('/Consultants'); // we still use Consultants for the list for now
    return response.data;
  }
};
