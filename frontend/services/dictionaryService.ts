import api from '@/lib/axios';

export interface DictionaryItem {
  id: number;
  name: string;
}

export const dictionaryService = {
  async getDisciplines(): Promise<DictionaryItem[]> {
    const response = await api.get('/Dictionary/disciplines');
    return response.data;
  },

  async getWorkTypes(): Promise<DictionaryItem[]> {
    const response = await api.get('/Dictionary/work-types');
    return response.data;
  },

  async getDirections() {
    const res = await api.get('/Dictionary/directions');
    return res.data;
  }
};