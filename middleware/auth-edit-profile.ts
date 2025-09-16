export default defineNuxtRouteMiddleware((to, from) => {

  const loggedInUser = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null

  if (!loggedInUser) {
    return navigateTo('/login')
  }

  const requestedUsername = to.params.username as string

  if (loggedInUser.username !== requestedUsername) {
  
    return navigateTo(`/`)
  }
  return
})