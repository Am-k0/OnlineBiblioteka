<template>
  <div class="author-wrapper">
    <div class="author-header">
      <div>
        <h1 class="author-title">{{ fullName }}</h1>
        <p class="author-subtitle">
          <span class="link" @click="router.push('/authors')">Evidencija autora</span>
          / ID: {{ route.params.id }}
        </p>
      </div>
      <ActionMenu
        v-if="author"
        :item="author"
        entity-name="autora"
        title-property="fullName"
        :hideViewOption="true"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="setError"
      />
    </div>

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
          <p class="author-description">{{ author.biography }}</p>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionMenu from '~/components/ActionMenu.vue'
import axios from 'axios'

// 📦 Pristup runtime konfiguraciji (API baza)
const config = useRuntimeConfig()

const route = useRoute()
const router = useRouter()
const defaultAvatar = '/images/default-author.png'
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

const authorAvatar = computed(() =>
  author.value && author.value.picture
    ? `/storage/${author.value.picture}`
    : defaultAvatar
)

function getAuthHeader() {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

onMounted(async () => {
  await loadAuthor()
  if (route.query.edit === 'true') editMode.value = true
})

const loadAuthor = async () => {
  error.value = null
  try {
    const { data } = await axios.get(
      `${config.public.apiBase}/authors/${route.params.id}`,
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
    console.error('Greška u loadAuthor:', err)
    let msg = 'Greška pri učitavanju autora.'
    if (err.response?.data?.error) {
      msg += ' ' + Object.values(err.response.data.error).flat().join(' ')
    } else if (err.response?.data?.message) {
      msg += ' ' + err.response.data.message
    }
    error.value = msg
  }
}

const saveAuthor = async () => {
  error.value = null
  loading.value = true
  try {
    await axios.patch(
      `${config.public.apiBase}/authors/${author.value.id}/update`,
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
    console.error('Greška u saveAuthor:', err)
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

const handleEdit = () => { editMode.value = true }

const handleDelete = async () => {
  if (!confirm('Da li ste sigurni da želite da obrišete autora?')) return
  try {
    await axios.delete(
      `${config.public.apiBase}/authors/${author.value.id}/destroy`,
      { headers: getAuthHeader() }
    )
    router.push('/authors')
  } catch (err) {
    console.error('Greška u handleDelete:', err)
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
.author-wrapper {
  max-width: 800px;
  margin: 0;
  padding: 16px;
  text-align: left;
  position: relative;
}
.author-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.author-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.author-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
}
.author-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}
.author-card {
  width: 463px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
