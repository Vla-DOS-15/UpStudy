// lib/axios.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Інтерцептор запиту: Додаємо токен
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Інтерцептор відповіді: Обробка 401 та Refresh Token Rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Якщо помилка 401 і ми ще не пробували оновити токен для цього запиту
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const oldAccessToken = Cookies.get('accessToken');
        const oldRefreshToken = Cookies.get('refreshToken');

        if (!oldAccessToken || !oldRefreshToken) {
          throw new Error('No tokens found');
        }

        // ВАЖЛИВО: Використовуємо чистий axios, щоб уникнути зациклення інтерцепторів
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7255/api'}/Auth/refresh-token`,
          {
            accessToken: oldAccessToken,
            refreshToken: oldRefreshToken,
          }
        );

        if (response.data && response.data.isSuccess) {
          const { accessToken, refreshToken } = response.data;

          // 1. Оновлюємо куки
          Cookies.set('accessToken', accessToken);
          Cookies.set('refreshToken', refreshToken);

          // 2. Оновлюємо заголовок в оригінальному запиті
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // 3. Повторюємо оригінальний запит з новим токеном
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Якщо оновити не вдалося (токен протух або невалідний)
        console.error('Refresh token failed:', refreshError);
        
        // Чистимо куки
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        
        // Редірект на логін
        window.location.href = '/'; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;