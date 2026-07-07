import api from '@/lib/axios';

export const accountService = {
  async uploadVerificationDocs(formData: FormData) {
    // ВАЖЛИВО: Передаємо конфігурацію headers
    const response = await api.post('/Account/verify', formData, {
      headers: {
        // "multipart/form-data" змусить Axios не серіалізувати дані в JSON.
        // Браузер автоматично додасть правильний "boundary".
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/Account/me');
    return response.data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/Account/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};