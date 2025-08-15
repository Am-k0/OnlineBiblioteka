<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ user?.first_name }} {{ user?.last_name }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="handleBackClick">Svi korisnici</span> / Korisničko ime: {{ route.params.username || 'Nije definisano' }}
        </p>
      </div>
      <ActionMenu
        v-if="user"
        :item="user"
        :hideViewOption="true"
        :entityName="isStudent ? 'studenta' : 'bibliotekara'"
        titleProperty="first_name"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="showSnackbar($event, 'error')"
      />
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <v-tabs
        v-if="isStudent"
        v-model="tab"
        background-color="white"
        grow
        class="custom-tabs"
        slider-color="#3392EA"
        style="width: 368px; height: 48px; margin-bottom: 0;"
      >
        <v-tab value="one" :class="tab === 'one' ? 'active-tab' : 'inactive-tab'">Osnovni detalji</v-tab>
        <v-tab value="two" :class="tab === 'two' ? 'active-tab' : 'inactive-tab'">
          Evidencija {{ isStudent ? 'studenta' : 'bibliotekara' }}
        </v-tab>
      </v-tabs>

      <v-window v-model="tab" class="window-content" style="margin-top: 0;">
        <v-window-item value="one">
          <div v-if="loading" class="text-center mt-5">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Učitavam korisnika...</p>
          </div>

          <v-alert v-else-if="globalError" type="error" class="error-message mt-4">
            {{ globalError }}
            <div class="mt-2">
              <v-btn @click="globalError = null; fetchUser()" color="white" small>Pokušaj ponovo</v-btn>
              <v-btn @click="handleBackClick" color="white" small class="ml-2">Nazad na listu</v-btn>
            </div>
          </v-alert>

          <div v-else-if="user" class="user-details-section">
            <img :src="getProfilePictureUrl(user.profile_picture)" :alt="`Avatar ${isStudent ? 'studenta' : 'bibliotekara'}`" class="user-avatar" />

            <div class="user-info-form-wrapper">
              <div class="user-field">
                <span class="user-label">Ime i Prezime</span>
                <div class="user-value">{{ user.first_name }} {{ user.last_name }}</div>
              </div>
              
              <div class="user-field">
                <span class="user-label">Email</span>
                <div class="user-value">{{ user.email }}</div>
              </div>
              
              <div class="user-field">
                <span class="user-label">Korisničko ime</span>
                <div class="user-value">{{ user.username }}</div>
              </div>
              
              <div class="user-field">
                <span class="user-label">JMBG</span>
                <div class="user-value">{{ user.jmbg || 'Nije unet' }}</div>
              </div>

              <div class="user-field">
                <span class="user-label">Broj logovanja</span>
                <div class="user-value">{{ user.login_count ?? 0 }}</div>
              </div>
              
              <div class="user-field">
                <span class="user-label">Poslednji put logovan/a</span>
                <div class="user-value">{{ formatDate(user.updated_at) }}</div>
              </div>
            </div>
          </div>

          <p v-else-if="!user && !loading && !globalError" class="no-user-message">
            Korisnik nije pronađen ili podaci nisu učitani.
          </p>
        </v-window-item>

        <v-window-item v-if="user && isStudent" value="two">
          <div class="iznajmljivanje-layout">
            <nav class="side-menu">
              <v-list nav dense class="pa-0">
                <v-list-item
                  v-for="(item, i) in stavke"
                  :key="i"
                  :active="menuTab === i"
                  @click="selectMenuItem(i)"
                  class="side-menu-item"
                >
                  <template v-slot:prepend>
                    <v-icon :color="menuTab === i ? 'primary' : 'grey'" size="24">{{ item.icon }}</v-icon>
                  </template>
                  <v-list-item-title :class="['side-menu-text', menuTab === i ? 'font-weight-bold blue--text' : '']">
                    {{ item.label }}
                  </v-list-item-title>
                </v-list-item>
                <div class="menu-divider-wrap">
                  <v-divider class="custom-divider" />
                </div>
              </v-list>
            </nav>
            <div class="main-content">
              <p>Evidencija {{ isStudent ? 'studenta' : 'bibliotekara' }} nije dostupna za ovaj prikaz.</p>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </div>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ActionMenu from '~/components/ActionMenu.vue'
import api from '@/axios'

interface User {
  id: number;
  first_name: string;
  last_name: string;
  jmbg?: string | null;
  email: string;
  username: string;
  role_id: number;
  profile_picture?: string | null;
  created_at: string;
  updated_at: string;
  login_count?: number;
}

const route = useRoute()
const router = useRouter()

const user = ref<User | null>(null)
const globalError = ref<string | null>(null)
const loading = ref(false)
const tab = ref('one')
const menuTab = ref(0)

const defaultAvatar = '/images/default-user-1.jpg'

const stavke = [
  { label: 'Izdate knjige', icon: 'mdi-file-document-outline', component: null },
  { label: 'Vraćanje knjige', icon: 'mdi-file-restore-outline', component: null },
  { label: 'Knjige u prekoračenju', icon: 'mdi-alert-outline', component: null },
  { label: 'Aktivne rezervacije', icon: 'mdi-calendar-clock', component: null },
  { label: 'Arhivirane rezervacije', icon: 'mdi-archive-outline', component: null }
]

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 3000,
})

const isStudent = computed(() => user.value?.role_id === 1)

const showSnackbar = (message: string, color: string = 'info', timeout: number = 3000) => {
  snackbar.value = { show: true, message, color, timeout }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS') + ' ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
}

const getProfilePictureUrl = (picturePath: string | null | undefined) => {
  if (picturePath) {
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    return `http://localhost:8000/storage/${picturePath}`;
  }
  return defaultAvatar;
}

const fetchUser = async () => {
  const username = route.params.username as string
  if (!username) {
    globalError.value = 'Korisničko ime nije definisano u URL-u.'
    showSnackbar(globalError.value || '', 'error')
    return
  }

  loading.value = true
  globalError.value = null

  try {
    console.log('Dohvatam korisnika:', username)
    const response = await api.get(`/users/${username}`)
    console.log('Odgovor servera:', response.data)
    
    // ISPRAVKA: Backend vraća podatke kao niz, uzimamo prvi element
    if (Array.isArray(response.data) && response.data.length > 0) {
      user.value = response.data[0]
    } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // Slučaj kada backend vraća objekat direktno
      user.value = response.data
    } else {
      throw new Error('Neočekivan format odgovora od servera')
    }
    
    console.log('User podatci:', user.value)
  } catch (error: any) {
    console.error('Greška pri dohvatanju korisnika:', error)
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error response:', error.response.data)
      if (error.response.status === 404) {
        globalError.value = `Korisnik sa korisničkim imenom "${username}" nije pronađen.`
      } else if (error.response.status === 403) {
        globalError.value = 'Nemate dozvolu za pristup ovom korisniku.'
      } else if (error.response.status === 401) {
        globalError.value = 'Neautorizovan pristup. Molimo prijavite se ponovo.'
      } else {
        globalError.value = `Došlo je do greške (${error.response.status}): ${error.response.data?.message || 'Nepoznata greška'}`
      }
    } else {
      globalError.value = 'Došlo je do mrežne greške ili greške servera.'
    }
    showSnackbar(globalError.value ?? '', 'error')
    user.value = null
  } finally {
    loading.value = false
  }
}

const handleEdit = () => {
  if (user.value?.username) {
    console.log('Navigiram na edit stranicu za korisnika:', user.value.username)
    router.push(`/users/${user.value.username}/edit`)
      .then(() => {
        console.log('Navigacija uspešna')
      })
      .catch((error) => {
        console.error('Greška pri navigaciji:', error)
        showSnackbar('Greška pri navigaciji na stranicu za uređivanje.', 'error')
      })
  } else {
    showSnackbar('Podaci o korisniku nisu dostupni za uređivanje.', 'error')
  }
}

const handleDelete = async (item: User) => {
  const confirmed = confirm(`Da li ste sigurni da želite da obrišete ${isStudent.value ? 'studenta' : 'bibliotekara'} ${item.first_name} ${item.last_name}?`)
  if (!confirmed) return

  loading.value = true
  try {
    await api.delete(`/users`, { data: { users_id: [item.id] } })
    showSnackbar(`${isStudent.value ? 'Student' : 'Bibliotekar'} uspješno obrisan!`, 'success')
    handleBackClick()
  } catch (error: any) {
    console.error('Greška pri brisanju korisnika:', error)
    if (axios.isAxiosError(error) && error.response) {
      showSnackbar(`Greška pri brisanju: ${error.response.data.message || 'Nepoznata greška'}`, 'error')
    } else {
      showSnackbar('Došlo je do mrežne greške ili greške servera pri brisanju.', 'error')
    }
  } finally {
    loading.value = false
  }
}

const handleBackClick = () => {
  if (isStudent.value) {
    router.push('/students')
  } else {
    router.push('/thelibrarian')
  }
}

const selectMenuItem = (index: number) => {
  menuTab.value = index
}

onMounted(() => {
  fetchUser()
})

watch(() => route.params.username, (newUsername) => {
  if (newUsername) {
    fetchUser()
  }
})
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; 
}
.app-header {
  padding: 6px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-family: 'Roboto', sans-serif !important;
  font-size: 20px;
  font-weight: 500;
  color: #222;
  line-height: 100%;
  letter-spacing: 0.15px;
  vertical-align: middle;
  margin: 0;
}
.page-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
  margin-top: 2px;
}
.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}
.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 10px;
  margin-bottom: 24px;
}
.page-content {
  padding: 0 24px;
  flex-grow: 1;
  display: flex; 
  flex-direction: column;
}
.custom-tabs {
  background-color: white !important;
  box-shadow: none !important; 
  border-radius: 0 !important; 
}
.active-tab {
  text-transform: none !important;
  font-weight: 600;
  color: #3392EA !important;
}
.inactive-tab {
  text-transform: none !important;
  font-weight: 600;
  color: #444444;
}
.v-tabs-slider {
  background-color: #3392EA !important;
}
.window-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
}
.user-details-section { 
  background-color: #fff;
  border-radius: 0; 
  box-shadow: none; 
  padding: 0; 
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%; 
}
.user-avatar {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
  align-self: flex-start;
}
.user-info-form-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start; 
  gap: 16px; 
}
.user-field {
  margin-bottom: 8px;
}
.user-label {
  display: block;
  color: #888;
  font-size: 15px;
  margin-bottom: 2px;
}
.user-value {
  font-weight: 400;
  color: #222;
  font-size: 16px;
  word-break: break-all;
}
.label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 8px;
  margin-bottom: 4px;
  width: 100%;
  text-align: left;
}
.user-input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ddd; 
  border-radius: 4px;
  margin-bottom: 12px;
}
.error-message {
  color: red;
  background-color: #ffebee;
  border-left: 5px solid #ef5350;
  padding: 12px;
  margin-top: 16px;
  border-radius: 4px;
}
.no-user-message {
  color: #555;
  margin-top: 16px;
  font-style: italic;
}
.iznajmljivanje-layout {
  display: flex;
  flex-grow: 1;
}
.side-menu {
  width: 247px;
  min-width: 247px;
  max-width: 247px;
  height: auto; 
  background: #fafbfc;
  padding-top: 12px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  box-shadow: none; 
  border-radius: 0; 
}
.side-menu-item {
  display: flex;
  align-items: center;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  padding: 0 8px 0 8px;
  cursor: pointer;
  background: transparent;
  margin-bottom: 0;
}
.side-menu-text {
  font-weight: 400;
  font-size: 16px;
  line-height: 100%;
  letter-spacing: 0.5px;
  color: #222;
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.side-menu-item.v-list-item--active,
.side-menu-item.v-list-item--active .v-icon {
  background: #e3f2fd !important;
  color: #1976d2 !important;
}
.menu-divider-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0 16px 0;
}
.custom-divider {
  width: 200px;
  height: 1px;
  background: #e0e0e0;
  margin: 0;
}
.main-content {
  flex: 1;
  padding: 24px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>