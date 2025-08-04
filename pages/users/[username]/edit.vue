<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Korisnik: {{ korisnickoIme || 'Učitavam...' }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="handleBackClick">Evidencija korisnika</span> / Uređivanje: {{ korisnickoIme || 'Učitavam...' }}
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="main-form-content">
        <div v-if="pageLoading" class="loading-overlay">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Učitavam podatke korisnika...</p>
        </div>
        
        <div v-else-if="fetchError" class="error-message global-error">
          {{ fetchError }}
          <div class="mt-2">
            <v-btn @click="fetchUserData" color="white" small>Pokušaj ponovo</v-btn>
            <v-btn @click="handleBackClick" color="white" small class="ml-2">Nazad</v-btn>
          </div>
        </div>
        
        <div v-else class="form-section">
          <div class="photo-section">
            <div class="photo-upload-box" @click="triggerFileInput">
              <v-icon v-if="!slikaUrl" size="large" color="#757575">mdi-image</v-icon>
              <input type="file" ref="fileInput" accept="image/*" @change="handleFileUpload" style="display: none">
              <div v-if="!slikaUrl" class="upload-text">Promenite fotografiju</div>
              <v-img v-if="slikaUrl" :src="slikaUrl" class="image-preview"></v-img>
            </div>
          </div>
  
          <div class="form-container">
            <v-text-field
              v-model="firstName"
              label="Unesite ime..."
              variant="outlined"
              hide-details
              class="form-field"
              :error="!!localError.firstName"
            ></v-text-field>
            <div v-if="localError.firstName" class="error-message">{{ localError.firstName }}</div>
  
            <v-text-field
              v-model="lastName"
              label="Unesite prezime..."
              variant="outlined"
              hide-details
              class="form-field"
              :error="!!localError.lastName"
            ></v-text-field>
            <div v-if="localError.lastName" class="error-message">{{ localError.lastName }}</div>
  
            <v-select
              v-model="selectedRole"
              :items="roleOptions"
              item-title="name"
              item-value="id"
              label="Tip korisnika"
              variant="outlined"
              hide-details
              class="form-field"
              disabled
            ></v-select>
  
            <v-text-field
              v-model="jmbg"
              label="Unesite JMBG..."
              variant="outlined"
              hide-details
              class="form-field"
              type="text"
              maxlength="13"
              :error="!!localError.jmbg"
              @keypress="samoBrojevi($event)"
            ></v-text-field>
            <div v-if="localError.jmbg" class="error-message">{{ localError.jmbg }}</div>
  
            <v-text-field
              v-model="email"
              label="Unesite e-mail..."
              variant="outlined"
              hide-details
              class="form-field"
              type="email"
              :error="!!localError.email"
            ></v-text-field>
            <div v-if="localError.email" class="error-message">{{ localError.email }}</div>
  
            <v-text-field
              v-model="korisnickoIme"
              label="Unesite korisničko ime..."
              variant="outlined"
              hide-details
              class="form-field"
              :error="!!localError.korisnickoIme"
              disabled
            ></v-text-field>
            <div v-if="localError.korisnickoIme" class="error-message">{{ localError.korisnickoIme }}</div>
  
            <v-text-field
              v-model="password"
              label="Nova šifra (opciono)..."
              variant="outlined"
              :type="vidljivoLozinka ? 'text' : 'password'"
              :append-inner-icon="vidljivoLozinka ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="vidljivoLozinka = !vidljivoLozinka"
              hide-details
              class="form-field"
              :error="!!localError.password"
            ></v-text-field>
            <div v-if="localError.password" class="error-message">{{ localError.password }}</div>
  
            <v-text-field
              v-model="ponoviLozinku"
              label="Ponovi novu šifru..."
              variant="outlined"
              :type="vidljivoPonoviLozinku ? 'text' : 'password'"
              :append-inner-icon="vidljivoPonoviLozinku ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="vidljivoPonoviLozinku = !vidljivoPonoviLozinku"
              hide-details
              class="form-field"
              :error="!!localError.ponoviLozinku"
            ></v-text-field>
            <div v-if="localError.ponoviLozinku" class="error-message">{{ localError.ponoviLozinku }}</div>
  
            <div v-if="displayGlobalError" class="error-message global-error">{{ displayGlobalError }}</div>
  
            <ActionButtons
              @save="handleSave"
              @cancel="handleCancel"
              :loading="loading"
              container-class="mt-4"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import ActionButtons from '~/components/ActionButtons.vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/axios'

// Dodaj meta informacije za stranicu
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()

// Reactive data
const slikaUrl = ref('')
const fotografija = ref<File | null>(null)
const firstName = ref('')
const lastName = ref('')
const jmbg = ref('')
const email = ref('')
const korisnickoIme = ref('')
const password = ref('')
const ponoviLozinku = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const vidljivoLozinka = ref(false)
const vidljivoPonoviLozinku = ref(false)
const loading = ref(false)
const pageLoading = ref(true)
const fetchError = ref<string | null>(null)
const userId = ref<number | null>(null)

const selectedRole = ref<number | null>(null)
const roleOptions = ref([
  { id: 1, name: 'Učenik' },
  { id: 2, name: 'Bibliotekar' }
])

const localError = ref({
  firstName: '',
  lastName: '',
  jmbg: '',
  email: '',
  korisnickoIme: '',
  password: '',
  ponoviLozinku: '',
  opsta: ''
})

const displayGlobalError = ref<string | null>(null)

// Methods
const samoBrojevi = (evt: KeyboardEvent) => {
  const charCode = evt.which ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault()
  }
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      localError.value.opsta = 'Slika je prevelika! Maksimalna veličina je 5MB.'
      return
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      localError.value.opsta = 'Neispravna vrsta datoteke! Dozvoljene su samo JPEG, PNG, JPG i GIF slike.'
      return
    }
    fotografija.value = file
    slikaUrl.value = URL.createObjectURL(file)
    localError.value.opsta = ''
  }
}

const clearErrors = () => {
  localError.value = {
    firstName: '',
    lastName: '',
    jmbg: '',
    email: '',
    korisnickoIme: '',
    password: '',
    ponoviLozinku: '',
    opsta: ''
  }
  displayGlobalError.value = null
}

const validateForm = () => {
  let hasErrors = false
  clearErrors()
  
  if (!firstName.value.trim()) {
    localError.value.firstName = 'Morate uneti ime!'
    hasErrors = true
  }
  
  if (!lastName.value.trim()) {
    localError.value.lastName = 'Morate uneti prezime!'
    hasErrors = true
  }
  
  if (!jmbg.value.trim()) {
    localError.value.jmbg = 'Morate uneti JMBG!'
    hasErrors = true
  } else if (jmbg.value.length !== 13) {
    localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!'
    hasErrors = true
  }
  
  if (!email.value.trim()) {
    localError.value.email = 'Morate uneti e-mail!'
    hasErrors = true
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    localError.value.email = 'Unesite validan e-mail format!'
    hasErrors = true
  }
  
  if (password.value) {
    if (password.value.length < 8) {
      localError.value.password = 'Šifra mora imati najmanje 8 karaktera!'
      hasErrors = true
    }
    if (password.value !== ponoviLozinku.value) {
      localError.value.ponoviLozinku = 'Šifre se ne poklapaju!'
      hasErrors = true
    }
  } else if (ponoviLozinku.value) {
    localError.value.password = 'Morate uneti i novu šifru!'
    hasErrors = true
  }
  
  return !hasErrors
}

const fetchUserData = async () => {
  const username = route.params.username as string
  if (!username) {
    fetchError.value = 'Username nije definisan u URL-u.'
    pageLoading.value = false
    return
  }

  pageLoading.value = true
  fetchError.value = null
  
  try {
    console.log('Fetching user data for:', username)
    const response = await api.get(`/users/${username}`)
    const user = response.data.data
    
    // Popuni formu sa podacima korisnika
    userId.value = user.id
    firstName.value = user.first_name || ''
    lastName.value = user.last_name || ''
    korisnickoIme.value = user.username || ''
    jmbg.value = user.jmbg || ''
    email.value = user.email || ''
    selectedRole.value = user.role_id
    
    // Postavi sliku profila
    if (user.profile_picture) {
      slikaUrl.value = user.profile_picture.startsWith('http') 
        ? user.profile_picture
        : `http://localhost:8000/storage/${user.profile_picture}`
    } else {
      slikaUrl.value = '/images/default-user-1.jpg'
    }
    
    console.log('User data loaded successfully:', user)
  } catch (error: any) {
    console.error('Failed to fetch user data:', error)
    if (error.response) {
      if (error.response.status === 404) {
        fetchError.value = 'Korisnik nije pronađen.'
      } else if (error.response.status === 403) {
        fetchError.value = 'Nemate dozvolu za pristup ovom korisniku.'
      } else {
        fetchError.value = `Greška ${error.response.status}: ${error.response.data?.message || 'Nepoznata greška'}`
      }
    } else {
      fetchError.value = 'Došlo je do greške prilikom učitavanja podataka.'
    }
  } finally {
    pageLoading.value = false
  }
}

const handleSave = async () => {
  if (!validateForm()) {
    return
  }
  
  if (!userId.value) {
    displayGlobalError.value = 'ID korisnika nije dostupan.'
    return
  }
  
  const formData = new FormData()
  
  formData.append('_method', 'PATCH')
  
  formData.append('first_name', firstName.value.trim())
  formData.append('last_name', lastName.value.trim())
  formData.append('email', email.value.trim())
  formData.append('jmbg', jmbg.value.trim())
  
  if (password.value) {
    formData.append('password', password.value)
  }
  
  if (fotografija.value) {
    formData.append('profile_picture', fotografija.value)
  } else if (!slikaUrl.value || slikaUrl.value.includes('default-user-1.jpg')) {
    formData.append('profile_picture', '')
  }
  
  try {
    loading.value = true
    console.log('Updating user with ID:', userId.value)
    
    const response = await api.post(`/users/${userId.value}`, formData)
    
    if (response.status === 200) {
      console.log('User updated successfully')
      displayGlobalError.value = null
      router.push(`/users/${korisnickoIme.value}`)
    }
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error.response) {
      if (error.response.status === 422) {
        const backendErrors = error.response.data.errors
        localError.value = {
          firstName: backendErrors.first_name?.[0] || '',
          lastName: backendErrors.last_name?.[0] || '',
          jmbg: backendErrors.jmbg?.[0] || '',
          email: backendErrors.email?.[0] || '',
          korisnickoIme: backendErrors.username?.[0] || '',
          password: backendErrors.password?.[0] || '',
          ponoviLozinku: '',
          opsta: backendErrors.profile_picture?.[0] || ''
        }
      } else {
        displayGlobalError.value = `Došlo je do greške (${error.response.status}): ${error.response.data?.message || 'Nepoznata greška'}`
      }
    } else {
      displayGlobalError.value = 'Došlo je do neočekivane greške.'
    }
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push(`/users/${korisnickoIme.value}`)
}

const handleBackClick = () => {
  if (selectedRole.value === 1) {
    router.push('/students');
  } else if (selectedRole.value === 2) {
    router.push('/thelibrarian');
  } else {
    router.push('/users');
  }
}

// Watcher za ažuriranje globalne greške
watch(() => displayGlobalError.value, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      displayGlobalError.value = null
    }, 5000) // Sakriva grešku posle 5 sekundi
  }
})

// Lifecycle hook za učitavanje podataka pri ulasku na stranicu
onMounted(() => {
  console.log('Edit page mounted, route params:', route.params)
  fetchUserData()
})

// Watcher za promenu username parametra
watch(() => route.params.username, (newUsername) => {
  if (newUsername) {
    console.log('Username changed to:', newUsername)
    fetchUserData()
  }
})
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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
  margin-top: 15px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.main-form-content {
  display: flex;
  flex-direction: column;
}

.form-section {
  display: flex;
  flex-direction: column;
}

.photo-upload-box {
  width: 200px;
  height: 160px;
  border: 1px dashed #BDBDBB;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #FAFAFA;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
  margin-left: 5px;
  margin-bottom: 15px;
}

.photo-upload-box:hover {
  border-color: #3392EA;
}

.upload-text {
  margin-top: 8px;
  color: #757575;
  font-size: 14px;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.form-container {
  max-width: 463px;
  width: 100%;
  margin-left: 5px;
}

.form-field {
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}

.global-error {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.v-text-field--error .v-field__outline {
  border-color: #ff5252 !important;
}

.v-text-field--error .v-field__outline:hover {
  border-color: #ff5252 !important;
}
</style>