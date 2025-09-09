export default defineNuxtRouteMiddleware((to, from) => {
  const user = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null

  if (!user) {

    return navigateTo('/login')
  }

  if (user.role !== 'librarian') {
   
    return navigateTo('/')
  }
})
