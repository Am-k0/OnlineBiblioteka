export default defineNuxtRouteMiddleware((to, from) => {
  // Dohvati ulogovanog korisnika iz localStorage-a
  const loggedInUser = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null

  // Ako iz nekog razloga korisnik nije ulogovan, vrati ga na login
  // Iako bi ovo trebalo da riješi 'auth.ts', ovo je dodatna zaštita
  if (!loggedInUser) {
    return navigateTo('/login')
  }

  // Dohvati korisničko ime iz URL-a (npr. 'amel' iz '/users/amel')
  const requestedUsername = to.params.username as string

  // PRAVILO 1: Ako je ulogovani korisnik bibliotekar, dozvoli mu pristup.
  if (loggedInUser.role === 'librarian') {
    return // Ne radi ništa, samo nastavi na stranicu
  }

  // PRAVILO 2: Ako korisnik NIJE bibliotekar, provjeri da li gleda SVOJ profil.
  if (loggedInUser.username === requestedUsername) {
    return // Korisnik gleda svoj profil, dozvoli pristup.
  }

  // AKO NIJEDAN USLOV NIJE ZADOVOLJEN: Korisnik je student koji pokušava da vidi tuđi profil.
  // Preusmjeri ga na početnu stranicu ili stranicu za zabranjen pristup.
  return navigateTo('/') 
})