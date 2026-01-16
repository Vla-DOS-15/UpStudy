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
});

// Інтерцептор відповіді: Обробка 401 (тут буде логіка Refresh Token пізніше)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Тут можна додати логіку оновлення токена або редірект на логін
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      // window.location.href = '/login'; // Обережно з цим у Next.js
    }
    return Promise.reject(error);
  }
);

export default api;