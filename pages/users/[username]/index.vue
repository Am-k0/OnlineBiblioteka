<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ user?.first_name }} {{ user?.last_name }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="handleBackClick">Svi korisnici</span> / Korisničko ime: {{ route.params.username || 'Nije definisano' }}
        </p>
      </div>
      <div class="header-actions">
        <v-btn
          v-if="user"
          @click="handleResetPassword"
          color="white"
          class="change-password-btn"
          small
          plain
        >
          <v-icon left>mdi-lock-reset</v-icon>
          Promijeni šifru
        </v-btn>
        <ActionMenu
          v-if="user"
          :item="user"
          :showView="false"
          :showEdit="true"
          :showDelete="isViewerLibrarian"
          :entityName="isStudent ? 'studenta' : 'bibliotekara'"
          titleProperty="first_name"
          @edit="handleEdit"
          @delete="handleDelete"
          @error="showSnackbar($event, 'error')"
        />
      </div>
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
        style="width: 368px; height: 48px; margin-bottom: 24px;"
      >
        <v-tab value="one" :class="tab === 'one' ? 'active-tab' : 'inactive-tab'">Osnovni detalji</v-tab>
        <v-tab value="two" :class="tab === 'two' ? 'active-tab' : 'inactive-tab'">
          Evidencija studenta
        </v-tab>
      </v-tabs>

      <v-window v-if="isStudent" v-model="tab" class="window-content">
        <v-window-item value="one" class="tab-content">
          <div v-if="loading" class="loading-container">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Učitavam korisnika...</p>
          </div>

          <v-alert v-else-if="globalError" type="error" class="error-message">
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

        <v-window-item value="two" class="tab-content">
          <div class="student-record-wrapper">
            <StudentRecordManagement />
          </div>
        </v-window-item>
      </v-window>

      <div v-else>
        <div v-if="loading" class="loading-container">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Učitavam korisnika...</p>
        </div>

        <v-alert v-else-if="globalError" type="error" class="error-message">
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
      </div>
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
definePageMeta({
  middleware: ['auth', 'auth-user-profile']
})

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ActionMenu from '~/components/ActionMenu.vue'
import api from '@/axios'
import StudentRecordManagement from '~/components/StudentRecordManagement.vue'

// Dohvati podatke o trenutno ulogovanom korisniku koji gleda stranicu
const loggedInUser = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null;

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

const defaultAvatar = '/images/default-user-1.jpg'

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 3000,
})

// Provjerava da li je korisnik koji gleda stranicu bibliotekar
const isViewerLibrarian = computed(() => {
  return loggedInUser?.role === 'librarian';
});

// Provjerava da li je korisnik čiji se profil prikazuje student
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
    const response = await api.get(`/users/${username}`)
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      user.value = response.data[0]
    } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      user.value = response.data
    } else {
      throw new Error('Neočekivan format odgovora od servera')
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
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
    router.push(`/users/${user.value.username}/edit`)
      .catch(() => {
        showSnackbar('Greška pri navigaciji na stranicu za uređivanje.', 'error')
      })
  } else {
    showSnackbar('Podaci o korisniku nisu dostupni za uređivanje.', 'error')
  }
}

const handleDelete = async (item: User) => {
  if (!item || !item.id) {
    showSnackbar('Korisnik za brisanje nije definisan.', 'error');
    return;
  }

  loading.value = true;
  try {
    await api.delete(`/users`, { data: { users_id: [item.id] } });

    // Sačuvaj poruku u localStorage pre preusmeravanja
    const successMessage = `${item.first_name} ${item.last_name} je uspješno obrisan!`;
    localStorage.setItem('deleteSuccessMessage', successMessage);
    localStorage.setItem('deleteSnackbarColor', 'success');
    localStorage.setItem('deleteSnackbarTimeout', '1500');

    // Odmah preusmeri na listu korisnika
    handleBackClick();

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      showSnackbar(`Greška pri brisanju: ${error.response.data.message || 'Nepoznata greška'}`, 'error');
    } else {
      showSnackbar('Došlo je do mrežne greške ili greške servera pri brisanju.', 'error');
    }
  } finally {
    loading.value = false;
  }
};

const handleResetPassword = () => {
  if (route.params.username) {
    router.push(`/change-password`)
  } else {
    showSnackbar('Korisničko ime nije definisano.', 'error')
  }
}

const handleBackClick = () => {
  if (isStudent.value) {
    router.push('/students')
  } else {
    router.push('/thelibrarian')
  }
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
  padding: 0 24px 24px 24px;
  flex: 1;
  display: block !important;
  overflow-y: auto;
  height: 100%;
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
  width: 100%;
  display: block !important;
}

.tab-content {
  display: block !important;
  width: 100%;
}

.window-content .v-window-item {
  display: none !important;
}

.window-content .v-window-item--active {
  display: block !important;
}

.window-content .v-window__container {
  height: auto !important;
  display: block !important;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 0;
}

.user-details-section { 
  background-color: #fff;
  border-radius: 0; 
  box-shadow: none; 
  padding: 0; 
  width: 100%;
  margin: 0;
  display: block !important;
}

.user-avatar {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
  display: block;
  float: none;
}

.user-info-form-wrapper {
  width: 100%;
  max-width: 500px;
  display: block !important;
}

.user-field {
  width: 100%;
  margin-bottom: 16px;
  display: block;
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

.error-message {
  color: red;
  background-color: #ffebee;
  border-left: 5px solid #ef5350;
  padding: 12px;
  border-radius: 4px;
  width: 100%;
  display: block;
  margin-top: 0;
}

.no-user-message {
  color: #555;
  font-style: italic;
  display: block;
  margin-top: 0;
}

.student-record-wrapper {
  width: 100%;
  display: block !important;
  margin: 0;
  padding: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.change-password-btn {
  height: 36px !important;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.15px;
  color: #1976d2;
  box-shadow: none;
}

.change-password-btn .v-icon {
  margin-right: 8px;
  color: #1976d2;
}
</style>