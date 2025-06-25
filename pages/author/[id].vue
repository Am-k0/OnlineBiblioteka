<template>
  <div class="author-wrapper">
    <div class="author-header">
      <div>
        <h1 class="author-title">{{ author?.naziv }}</h1>
        <p class="author-subtitle">
          <span class="link" @click="router.push('/authors')">Evidencija autora</span> / ID: {{ route.params.id }}
        </p>
      </div>

      <ActionMenu 
        v-if="author"
        :author="author"
        :showView="false"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="setError"
      />
    </div>

    <div v-if="author" class="author-card">
      <img :src="author.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" alt="Avatar autora" class="author-avatar" />

      <div class="author-info">
        <div v-if="editMode">
          <label class="label">Naziv:</label>
          <input v-model="form.naziv" type="text" class="author-name name-field" />

          <label class="label">Opis:</label>
          <textarea v-model="form.opis" class="author-description description-field" />

          <label class="label">Avatar URL:</label>
          <input v-model="form.avatar" type="text" class="author-name name-field" />

          <div class="btn-wrapper">
            <v-btn color="primary" @click="saveAuthor">Sačuvaj</v-btn>
            <v-btn variant="outlined" @click="editMode = false">Otkaži</v-btn>
          </div>
        </div>

        <div v-else>
          <label class="label">Naziv:</label>
          <p class="author-name">{{ author.naziv }}</p>

          <label class="label">Opis:</label>
          <p class="author-description">{{ author.opis }}</p>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import ActionMenu from '~/components/ActionMenu.vue'

interface Author {
  id: number
  naziv: string
  opis: string
  avatar: string | null
}

interface FormData {
  naziv: string
  opis: string
  avatar: string
}

type EditMode = 'edit' | 'view'

const route = useRoute()
const router = useRouter()
interface AutoriTable {
  id: number
  naziv: string
  opis: string
  avatar: string | null
}

const supabase = useSupabaseClient<{ autori: AutoriTable }>()

const author = ref<Author | null>(null)
const error = ref<string | null>(null)
const editMode = ref(false)
const form = ref<FormData>({
  naziv: '',
  opis: '',
  avatar: ''
})

onMounted(async () => {
  await loadAuthor()
  if (route.query.edit === 'true') {
    editMode.value = true
  }
})

const loadAuthor = async () => {
  try {
    const { data, error: supabaseError } = await supabase
      .from('autori')
      .select('id, naziv, opis, avatar')
      .eq('id', route.params.id)
      .single()

    if (supabaseError) throw supabaseError

    if (data) {
      author.value = {
        ...data,
        avatar: data.avatar || null
      }
      form.value = {
        naziv: data.naziv,
        opis: data.opis,
        avatar: data.avatar || ''
      }
    }
  } catch (err) {
    error.value = `Greška pri učitavanju autora: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const saveAuthor = async () => {
  if (!author.value) return
  
  try {
    const { error: updateError } = await supabase
      .from('autori')
      .update({
        naziv: form.value.naziv,
        opis: form.value.opis,
        avatar: form.value.avatar || null
      })
      .eq('id', author.value.id)

    if (updateError) throw updateError

    editMode.value = false
    await loadAuthor()
  } catch (err) {
    error.value = `Greška pri čuvanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const setError = (msg: string) => {
  error.value = msg
}

const handleEdit = ({ author: editedAuthor, mode }: { author: Author; mode: EditMode }) => {
  if (mode === 'edit') {
    editMode.value = true
  }
}

const handleDelete = async (deletedAuthor: Author) => {
  const confirmed = confirm('Da li ste sigurni da želite da obrišete autora?')
  if (!confirmed) return

  try {
    const { error: deleteError } = await supabase
      .from('autori')
      .delete()
      .eq('id', deletedAuthor.id)

    if (deleteError) throw deleteError

    router.push('/authors')
  } catch (err) {
    setError(`Greška pri brisanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`)
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