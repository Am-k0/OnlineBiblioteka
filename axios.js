// U Nuxt.js, ovo bi obično bilo u `plugins/axios.js`
// U Vue CLI projektu, može biti u `src/utils/axios.js` ili slično

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:80/api', // POTVRDI DA JE OVO TVOJ ISPRAVAN BACKEND API URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Dodaje token pre slanja zahteva
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // Ključ mora biti identičan onom pri prijavi!
    console.log('[Axios Interceptor] Pokušavam da dohvatim token iz localStorage. Token:', token);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('[Axios Interceptor] Authorization header postavljen:', config.headers['Authorization']);
    } else {
      console.warn('[Axios Interceptor] Token nije pronađen u localStorage. Authorization header neće biti postavljen.');
    }
    return config;
  },
  (error) => {
    console.error('[Axios Interceptor] Greška u request interceptoru:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Rukovanje greškama (npr. 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    console.log('[Axios Interceptor] Odgovor primljen:', response);
    return response;
  },
  (error) => {
    console.error('[Axios Interceptor] Greška u response interceptoru:', error.response || error.message || error);
    if (error.response && error.response.status === 401) {
      console.error('[Axios Interceptor] 401 Unauthorized! Brišem token i preusmeravam na login.');
      localStorage.removeItem('auth_token'); // Ukloni nevažeći token
      // OVDJE POTREBNO PREUSMERAVANJE NA LOGIN STRANICU
      // Ovo zavisi od tvog router setup-a.
      // Ako koristiš Nuxt.js:
      // import { useRouter } from '#app';
      // const router = useRouter(); router.push('/login');
      //
      // Za običan Vue Router:
      // import router from '@/router'; // Potreban ti je globalni router instance
      // router.push('/login');
      //
      // Brzo ali manje elegantno rešenje:
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;