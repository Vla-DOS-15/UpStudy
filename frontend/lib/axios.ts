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
    'ngrok-skip-browser-warning': 'true',
  },
});

// Queue to handle concurrent refreshes
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const oldAccessToken = Cookies.get('accessToken');
        const oldRefreshToken = Cookies.get('refreshToken');

        if (!oldRefreshToken) {
          throw new Error('No refresh token available');
        }

        // ВАЖЛИВО: Використовуємо чистий axios, щоб уникнути зациклення інтерцепторів
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7255/api'}/Auth/refresh-token`,
          {
            accessToken: oldAccessToken || '', // Pass empty string if missing, backend might need it
            refreshToken: oldRefreshToken,
          },
          {
            headers: {
              'ngrok-skip-browser-warning': 'true'
            },
            httpsAgent // <--- 4. ВАЖЛИВО: Додаємо агент і сюди, щоб рефреш працював на сервері
          }
        );

        if (response.data && response.data.isSuccess) {
          const { accessToken, refreshToken } = response.data;

          // 1. Оновлюємо куки
          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 7 });

          // 2. Оновлюємо заголовок в оригінальному запиті
          api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken; // Update default header just in case
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests
          processQueue(null, accessToken);
          isRefreshing = false;

          // 3. Повторюємо оригінальний запит з новим токеном
          return api(originalRequest);
        } else {
          // Server returned 200 but isSuccess is false (e.g. invalid refresh token)
          throw new Error(response.data?.message || 'Refresh failed via backend response');
        }
      } catch (refreshError) {
        // Якщо оновити не вдалося (токен протух або невалідний)
        console.error('Refresh token failed:', refreshError);

        processQueue(refreshError, null);
        isRefreshing = false;

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