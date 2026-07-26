import api from '@/lib/axios';
import { ConsultantPreviewDto } from '@/types';

export const consultantService = {
  getConsultants: async (): Promise<ConsultantPreviewDto[]> => {
    try {
      const response = await api.get('/Consultants');
      return response.data;
    } catch (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }
  },
};
