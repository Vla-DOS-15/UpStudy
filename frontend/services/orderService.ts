// services/orderService.ts
import api from '@/lib/axios';

export interface CreateOrderData {
  title: string;
  description: string;
  isNegotiable: boolean;
  price?: number;
  deadline: Date;
  disciplineId: string; // Select повертає string, конвертуємо перед відправкою
  workTypeId: string;
  files?: FileList | null;
}

export const orderService = {
  async create(data: CreateOrderData) {
    const formData = new FormData();

    formData.append('Title', data.title);
    formData.append('Description', data.description);
    formData.append('IsNegotiable', String(data.isNegotiable));
    
    // Якщо ціна не договірна, додаємо її. Якщо договірна - бекенд може приймати null або ігнорувати
    if (!data.isNegotiable && data.price) {
      formData.append('Price', String(data.price));
    }

    formData.append('Deadline', data.deadline.toISOString());
    formData.append('DisciplineId', data.disciplineId);
    formData.append('WorkTypeId', data.workTypeId);

    if (data.files && data.files.length > 0) {
      for (let i = 0; i < data.files.length; i++) {
        formData.append('Files', data.files[i]);
      }
    }

    // Важливо: axios сам встановить заголовок 'Content-Type': 'multipart/form-data'
    const response = await api.post('/Orders', formData);
    return response.data;
  },
};