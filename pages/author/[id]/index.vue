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
        <h1 class="page-title">{{ fullName }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/authors')">Evidencija autora</span> / ID: {{ route.params.id }}
        </p>
      </div>
      <ActionMenu
        v-if="author && userRole === 'librarian'"
        :item="author"
        entity-name="autora"
        title-property="fullName"
        :show-edit="true"
        :show-delete="true"
        :show-view="false"
        @edit="handleEdit"
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
        <img :src="authorAvatar" alt="Avatar autora" class="author-avatar" />
        <div class="author-info">
          <div>
            <label class="label">Ime i prezime:</label>
            <p class="author-name">{{ fullName }}</p>
            <label class="label">Biografija:</label>
            <p class="author-description no-border">{{ author.biography }}</p>
          </div>
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
  </v-snackbar>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionMenu from '~/components/action-menu.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const defaultAvatar = '/images/default-author-1.jpg'

const author = ref(null)
const error = ref(null)
const actionMenuLoading = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  color: ''
})

const user = process.client ? JSON.parse(localStorage.getItem('user') || 'null') : null
const userRole = user?.role || 'student'

const fullName = computed(() =>
  author.value
    ? `${author.value.first_name || ''} ${author.value.last_name || ''}`.trim()
    : ''
)

const authorAvatar = computed(() => {
  return defaultAvatar
})

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

const handleEdit = () => {
  // ISPRAVLJENA PUTANJA ZA NAVIGACIJU
  router.push(`/author/${route.params.id}/edit`)
}

const handleDelete = async () => {
  try {
    const response = await axios.delete(
      `http://localhost/api/authors/${author.value.id}/destroy`,
      { headers: getAuthHeader() }
    );
    
    showSnackbar(response.data.message || `Autor ${fullName.value} je uspješno obrisan.`, 'primary');

    setTimeout(() => {
        // ISPRAVLJENA PUTANJA ZA NAVIGACIJU
        router.push({ path: '/author', query: { refresh: 'authors' } });
    }, 1000); 
  } catch (err) {
    let msg = 'Greška pri brisanju autora.';
    if (err.response?.data?.error) {
      msg += ' ' + Object.values(err.response.data.error).flat().join(' ')
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message
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
/* Sav CSS ostaje isti kao u originalnom kodu */
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.app-header {
  padding: 6px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
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
  z-index: 10;
}

.header-divider--student {
  margin-top: 15px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
  z-index: 10;
}

.author-card {
  width: 463px;
  padding: 16px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: -14px
}

.author-avatar {
  width: 200px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 8px;
  margin-bottom: 4px;
}

.author-name {
  width: 100%;
  font-size: 16px;
}

.author-description {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
}

.author-description.no-border {
  border: none !important;
  padding: 0 !important;
}

.name-field {
  width: 100%;
  margin-bottom: 12px;
}

.description-field {
  width: 100%;
  margin-bottom: 12px;
  min-height: 60px;
}

.btn-wrapper {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.error-message {
  color: red;
  margin-top: 16px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 999;
  display: none;
}

.loading-overlay--active {
  display: block;
}
</style>