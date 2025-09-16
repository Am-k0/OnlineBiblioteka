export default defineNuxtRouteMiddleware((to, from) => {
 
  const loggedInUser = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null

  if (!loggedInUser) {
    return navigateTo('/login')
  }
  const requestedUsername = to.params.username as string

  if (loggedInUser.role === 'librarian') {
    return // Ne radi ništa, samo nastavi na stranicu
  }

  if (loggedInUser.username === requestedUsername) {
    return // Korisnik gleda svoj profil, dozvoli pristup.
  }

  return navigateTo('/') 
})