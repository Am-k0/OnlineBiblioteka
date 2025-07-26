// src/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Accept': 'application/json' },
   withCredentials: false
});

// Dodavanje tokena na svaki zahtjev (ako postoji)
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

export default instance; 