export default defineNuxtRouteMiddleware((to, from) => {
  // Skladište za korisnika
  const user = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  
  // Provjerite postojanje 'auth_token' u localStorage-u kao primarni indikator prijave
  const authToken = process.client ? localStorage.getItem('auth_token') : null;

  // Lista javnih putanja kojima se može pristupiti bez prijave
  const publicRoutes = ['/login', '/register'];

 
  const isPublicRoute = publicRoutes.includes(to.path);
  
  
  if (!authToken && !isPublicRoute) {
    
    return navigateTo('/login');
  }


  if (authToken && isPublicRoute) {
    
    return navigateTo('/dashboard');
  }
});