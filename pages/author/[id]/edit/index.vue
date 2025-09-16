<template>
  <div class="page-container bg-white min-h-screen">
    <div
      v-if="actionMenuLoading"
      class="loading-overlay"
      :class="{
        'loading-overlay--active': actionMenuLoading
      }"
    ></div>
    <header class="app-header">
      <div>
        <h1 class="page-title">Izmijeni {{ fullName }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/author')">Evidencija autora</span> / <span class="link" @click="router.push(`/author/${route.params.id}`)">ID: {{ route.params.id }}</span> / Izmijeni
        </p>
      </div>
      <ActionMenu
        v-if="author && userRole === 'librarian'"
        :item="author"
        entity-name="autora"
        title-property="fullName"
        :show-edit="false"
        :show-delete="true"
        :show-view="true"
        @view="handleView"
        @delete="handleDelete"
        @error="setError"
        @update:loading="updateLoading"
        @update:error="updateError"
      />
    </header>

    <div
      class="header-divider"
      :class="{
        'header-divider--student': userRole === 'student'
      }"
    ></div>

    <div class="page-content">
      <div v-if="author" class="author-card">
        <div class="photo-section">
          <div class="photo-upload-box" @click="triggerFileInput">
            <v-img
              v-if="imageUrl"
              :src="imageUrl"
              class="image-preview"
            ></v-img>
            <div v-else class="upload-text">Dodaj/Promijeni fotografiju</div>
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              @change="handleFileUpload"
              style="display: none"
            >
          </div>
        </div>

        <v-text-field
          v-model="form.first_name"
          label="Unesite Ime..."
          variant="outlined"
          hide-details
          class="form-field"
          :error="!!errors.firstName"
          color="primary"
        ></v-text-field>
        <div v-if="errors.firstName" class="error-message">{{ errors.firstName }}</div>

        <v-text-field
          v-model="form.last_name"
          label="Unesite Prezime..."
          variant="outlined"
          hide-details
          class="form-field"
          :error="!!errors.lastName"
          color="primary"
        ></v-text-field>
        <div v-if="errors.lastName" class="error-message">{{ errors.lastName }}</div>

        <v-textarea
          v-model="form.biography"
          label="Unesite Biografiju..."
          variant="outlined"
          hide-details
          class="form-field"
          color="primary"
        ></v-textarea>
        
        <div class="buttons-container">
          <ActionButtons
            :loading="loading"
            :is-edit-mode="true"
            @save="saveAuthor"
            @cancel="cancelEdit"
          />
        </div>
      </div>
      <p v-else-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>

  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="bottom"
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
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionMenu from '~/components/action-menu.vue'
import ActionButtons from '~/components/action-buttons.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// Defaultna slika je postavljena na default-author-1.jpg
const defaultAvatar = '/images/default-author-1.jpg'

const author = ref(null)
const error = ref(null)
const loading = ref(false)
const actionMenuLoading = ref(false)
const form = ref({ first_name: '', last_name: '', biography: '' })

// Slike
const photo = ref(null)
const imageUrl = ref('')
const fileInput = ref(null)

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 3000
})

const errors = ref({
  firstName: '',
  lastName: ''
})

const user = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null
const userRole = user?.role || 'student'

const fullName = computed(() =>
  author.value
    ? `${author.value.first_name || ''} ${author.value.last_name || ''}`.trim()
    : ''
)

function getAuthHeader() {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const loadAuthor = async () => {
  try {
    const { data } = await axios.get(
      `http://localhost/api/authors/${route.params.id}`,
      { headers: getAuthHeader() }
    )
    if (!data.author) throw new Error('Autor nije pronađen.')
    author.value = data.author
    form.value = {
      first_name: data.author.first_name || '',
      last_name: data.author.last_name || '',
      biography: data.author.biography || ''
    }
    // Provjerava postoji li slika u bazi
    if (data.author.picture) {
      imageUrl.value = `http://localhost/storage/${data.author.picture}`
    } else {
      // Ako ne postoji, koristi defaultnu
      imageUrl.value = defaultAvatar
    }
  } catch (err) {
    showSnackbar('Greška pri učitavanju autora.', 'red')
    error.value = 'Greška pri učitavanju autora.'
  }
}

onMounted(async () => {
  await loadAuthor()
})

const showSnackbar = (message, color = 'success', timeout = 3000) => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
  snackbar.value.timeout = timeout
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    photo.value = file
    imageUrl.value = URL.createObjectURL(file)
  }
}

const saveAuthor = async () => {
  errors.value = { firstName: '', lastName: '' }
  if (!form.value.first_name) errors.value.firstName = 'Morate unijeti ime!'
  if (!form.value.last_name) errors.value.lastName = 'Morate unijeti prezime!'

  if (errors.value.firstName || errors.value.lastName) {
    showSnackbar('Molimo ispravite greške u unosu.', 'red');
    return;
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('_method', 'PATCH') // Važno za Laravel API-je
    formData.append('first_name', form.value.first_name)
    formData.append('last_name', form.value.last_name)
    formData.append('biography', form.value.biography || '')
    
    // Dodaj sliku samo ako je nova odabrana
    if (photo.value) {
      formData.append('picture', photo.value)
    }

    await axios.post(
      `http://localhost/api/authors/${author.value.id}/update`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeader()
        }
      }
    )
    showSnackbar('Podaci o autoru su uspješno promijenjeni.', 'primary')
    
    router.push(`/author/${route.params.id}`)
  } catch (err) {
    let msg = 'Greška pri čuvanju autora.'
    if (err.response?.data?.errors) {
      msg += ' ' + Object.values(err.response.data.errors).flat().join(' ')
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message
    }
    showSnackbar(msg, 'red')
  } finally {
    loading.value = false
  }
}

const cancelEdit = () => {
  router.push(`/author/${route.params.id}`)
}

const handleView = () => {
  router.push(`/author/${route.params.id}`)
}

const handleDelete = async () => {
  try {
    const response = await axios.delete(
      `http://localhost/api/authors/${author.value.id}/destroy`,
      { headers: getAuthHeader() }
    );
    
    showSnackbar(response.data.message || `Autor ${fullName.value} je uspješno obrisan.`, 'primary');

    setTimeout(() => {
        router.push({ path: '/author', query: { refresh: 'authors' } });
    }, 1000); 
  } catch (err) {
    let msg = 'Greška pri brisanju autora.';
    if (err.response?.data?.errors) {
      msg += ' ' + Object.values(err.response.data.errors).flat().join(' ');
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message;
    }
    showSnackbar(msg, 'red');
  }
}

const setError = (msg) => {
  showSnackbar(msg, 'red');
}

const updateLoading = (value) => {
  actionMenuLoading.value = value
}

const updateError = (value) => {
  if (value) {
    showSnackbar(value, 'red')
  }
}
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
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
}

.photo-section {
  margin-bottom: 24px;
}
.photo-upload-box {
  width: 200px;
  height: 160px;
  border: 1px dashed #BDBDBD;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #FAFAFA;
  position: relative;
  overflow: hidden;
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
.form-field {
  margin-bottom: 16px;
  max-width: 463px;
}
.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}
.buttons-container {
  max-width: 463px;
  margin-left: 0px;
}

.v-input--is-focused .v-input__control .v-input__slot {
  border-color: #3392EA !important;
}
</style>