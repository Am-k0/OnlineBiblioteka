import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:80/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    console.log('[Axios Interceptor] Pokušavam da dohvatim token iz localStorage. Token:', token ? 'Pronađen' : 'Nije pronađen');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Axios Interceptor] Greška u request interceptoru:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('[Axios Interceptor] 401 Unauthorized! Brišem token i preusmeravam na login.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;