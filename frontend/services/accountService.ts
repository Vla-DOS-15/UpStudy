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
  }
};