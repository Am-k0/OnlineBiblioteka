export default defineNuxtRouteMiddleware((to, from) => {
  
  const user = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  

  const authToken = process.client ? localStorage.getItem('auth_token') : null;

  
  const publicRoutes = ['/login', '/register'];

 
  const isPublicRoute = publicRoutes.includes(to.path);
  
  
  if (!authToken && !isPublicRoute) {
    
    return navigateTo('/login');
  }


  if (authToken && isPublicRoute) {
    
    return navigateTo('/dashboard');
  }
});