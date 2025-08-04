// middleware/auth.global.js
export default defineNuxtRouteMiddleware((to, from) => {
  // Provjeri da li je u browser okruženju
  if (process.server) return;
  
  // Dobij token iz localStorage
  const isAuthenticated = localStorage.getItem('auth_token');
  
  // Ako korisnik pokušava da pristupi bilo kojoj stranici koja nije '/login' i nije prijavljen
  if (to.path !== '/login' && !isAuthenticated) {
    // Preusmjeri ga na login stranicu
    return navigateTo('/login');
  }
  
  // Ako korisnik pokušava da pristupi '/login' stranici, a već je prijavljen
  if (to.path === '/login' && isAuthenticated) {
    // Preusmjeri ga na početnu stranicu
    return navigateTo('/');
  }
});