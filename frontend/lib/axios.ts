// lib/axios.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import https from 'https'; // <--- 1. Імпортуємо https

// <--- 2. Створюємо агент для ігнорування SSL помилок (тільки для Node.js середовища)
const httpsAgent = new https.Agent({
  // У режимі development дозволяємо самопідписані сертифікати (false),
  // у production перевіряємо суворо (true)
  rejectUnauthorized: process.env.NODE_ENV === 'production',
});

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  httpsAgent, // <--- 3. Додаємо агент сюди
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
          },
          {
            httpsAgent // <--- 4. ВАЖЛИВО: Додаємо агент і сюди, щоб рефреш працював на сервері
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
        
        // Редірект на логін (працює тільки в браузері)
        if (typeof window !== 'undefined') {
            window.location.href = '/'; 
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;