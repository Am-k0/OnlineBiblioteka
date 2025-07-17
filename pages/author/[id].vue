<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ fullName }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/authors')">Evidencija autora</span> / ID: {{ route.params.id }}
        </p>
      </div>
      <ActionMenu
        v-if="author"
        :item="author"
        entity-name="autora"
        title-property="fullName"
        :hideViewOption="true"
        @edit="editMode = true"
        @delete="handleDelete"
        @error="setError"
      />
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div v-if="author" class="author-card">
        <img :src="authorAvatar" alt="Avatar autora" class="author-avatar" />
        <div class="author-info">
          <div v-if="editMode">
            <label class="label">Ime:</label>
            <input v-model="form.first_name" type="text" class="author-name name-field" />
            <label class="label">Prezime:</label>
            <input v-model="form.last_name" type="text" class="author-name name-field" />
            <label class="label">Biografija:</label>
            <textarea v-model="form.biography" class="author-description description-field" />
            <div class="btn-wrapper">
              <v-btn color="primary" @click="saveAuthor" :loading="loading">Sačuvaj</v-btn>
              <v-btn variant="outlined" @click="editMode = false">Otkaži</v-btn>
            </div>
          </div>
          <div v-else>
            <label class="label">Ime i prezime:</label>
            <p class="author-name">{{ fullName }}</p>
            <label class="label">Biografija:</label>
            <p class="author-description no-border">{{ author.biography }}</p>
          </div>
        </div>
      </div>
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionMenu from '~/components/ActionMenu.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const defaultAvatar = '/images/default-author-1.jpg'

const author = ref(null)
const error = ref(null)
const editMode = ref(false)
const loading = ref(false)
const form = ref({ first_name: '', last_name: '', biography: '' })

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
  error.value = null
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
  } catch (err) {
    let msg = 'Greška pri učitavanju autora.'
    if (err.response?.data?.error) {
      msg += ' ' + Object.values(err.response.data.error).flat().join(' ')
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message
    }
    error.value = msg
  }
}

onMounted(async () => {
  await loadAuthor()
  if (route.query.edit === 'true') editMode.value = true
})

const saveAuthor = async () => {
  error.value = null
  loading.value = true
  try {
    await axios.patch(
      `http://localhost/api/authors/${author.value.id}/update`,
      {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        biography: form.value.biography
      },
      { headers: getAuthHeader() }
    )
    editMode.value = false
    await loadAuthor()
  } catch (err) {
    let msg = 'Greška pri čuvanju autora.'
    if (err.response?.data?.error) {
      msg += ' ' + Object.values(err.response.data.error).flat().join(' ')
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message
    }
    error.value = msg
  } finally {
    loading.value = false
  }
}

const setError = (msg) => { error.value = msg }

const handleDelete = async () => {
  if (!confirm('Da li ste sigurni da želite da obrišete autora?')) return
  try {
    await axios.delete(
      `http://localhost/api/authors/${author.value.id}/destroy`,
      { headers: getAuthHeader() }
    )
    router.push('/authors')
  } catch (err) {
    let msg = 'Greška pri brisanju autora.'
    if (err.response?.data?.error) {
      msg += ' ' + Object.values(err.response.data.error).flat().join(' ')
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message
    }
    setError(msg)
  }
}
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; /* Glavni kontejner nema skrolovanje */
}

.app-header {
  /* Smanjen padding na vrhu i dnu */
  padding: 6px 24px 0 24px; /* Smanjeno sa 24px na 10px top padding */
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
  /* Smanjena margina između naslova i podnaslova */
  margin-top: 2px; /* Smanjeno sa 8px na 2px */
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  /* Smanjena margina ispod headera */
  margin-top: 10px; /* Smanjeno sa 20px na 10px */
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
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

/* New style to remove border for description in view mode */
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
</style>