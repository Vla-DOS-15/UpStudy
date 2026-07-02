// services/orderService.ts
import api from '@/lib/axios';

export interface CreateOrderData {
  title: string;
  description: string;
  isNegotiable: boolean;
  price?: number;
  deadline: Date;
  disciplineId: string;
  workTypeId: string;
  files?: FileList | null;
}

export const orderService = {
  async create(data: CreateOrderData) {
    const formData = new FormData();

    formData.append('Title', data.title);
    formData.append('Description', data.description);
    formData.append('IsNegotiable', String(data.isNegotiable)); // "true" або "false"

    // Якщо ціна є, додаємо. Важливо передати рядок.
    if (data.price) {
      formData.append('Price', data.price.toString());
    }

    formData.append('Deadline', data.deadline.toISOString());
    formData.append('DisciplineId', data.disciplineId);
    formData.append('WorkTypeId', data.workTypeId);

    if (data.files && data.files.length > 0) {
      for (let i = 0; i < data.files.length; i++) {
        // 'Files' має співпадати з іменем в DTO на бекенді (List<IFormFile> Files)
        formData.append('Files', data.files[i]);
      }
    }

    // 🔥 ВИПРАВЛЕННЯ:
    // Передаємо конфігурацію заголовків третім аргументом.
    // 'Content-Type': 'multipart/form-data' ставити ВРУЧНУ НЕ МОЖНА,
    // бо тоді не додасться boundary. Треба видалити 'application/json'.
    const response = await api.post('/Orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Axios перехопить це і зробить правильно з boundary
      },
    });

    return response.data;
  },

  async update(id: string, data: any) {
    // Для update ми використовуємо JSON, бо файли зазвичай не оновлюються через це поле, або треба окрему логіку.
    // DTO: UpdateOrderDto { Title, Description, IsNegotiable, Price, Deadline, DisciplineId, WorkTypeId }
    // Якщо треба файли - це окремий endpoint або multipart.
    // Поки припустимо, що files не оновлюємо тут.
    const response = await api.put(`/Orders/${id}`, data);
    return response.data;
  },

  async deleteOrder(id: string) {
    const response = await api.delete(`/Orders/${id}`);
    return response.data;
  },

  // ... інші методи без змін
  async createProposal(data: { orderId: string; price: number; comment?: string }) {
    const response = await api.post('/Proposals', data);
    return response.data;
  },

  async acceptExecutor(orderId: string, proposalId: string) {
    const response = await api.post(`/Orders/${orderId}/accept-executor`, { proposalId });
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get('/Orders/my-orders');
    return response.data;
  },

  async getOrderById(id: string) {
    const response = await api.get(`/Orders/${id}`);
    return response.data;
  },

  async getProposals(orderId: string) {
    const response = await api.get(`/Orders/${orderId}/proposals`);
    return response.data;
  },

  async getAllOrders(query?: any) {
    const response = await api.get('/Orders', { params: query });
    return response.data;
  },

  async getPendingOrders() {
    const response = await api.get('/Orders/executor/pending');
    return response.data;
  },

  async getArchivedOrders() {
    const response = await api.get('/Orders/executor/archive');
    return response.data;
  },
};