<template>
  <div class="librarian-wrapper">
    <div class="librarian-header">
      <div>
        <h1 class="librarian-title">{{ librarian?.ime_i_prezime }}</h1>
        <p class="librarian-subtitle">
          <span class="link" @click="router.push('/librarians')">Evidencija bibliotekara</span> / ID: {{ route.params.id }}
        </p>
      </div>

      <ActionMenu 
        v-if="librarian"
        :author="librarian"
        :showView="false"
        entityName="bibliotekara"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="setError"
      />
    </div>

    <div v-if="librarian" class="librarian-card">
      <img :src="librarian.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" alt="Avatar bibliotekara" class="librarian-avatar" />

      <div class="librarian-info">
        <div v-if="editMode">
          <label class="label">Ime i prezime:</label>
          <input v-model="form.ime_i_prezime" type="text" class="librarian-name name-field" />

          <label class="label">Email:</label>
          <input v-model="form.email" type="email" class="librarian-name name-field" />

          <label class="label">Tip korisnika:</label>
          <input v-model="form.tip_korisnika" type="text" class="librarian-name name-field" />

          <label class="label">Avatar URL:</label>
          <input v-model="form.avatar" type="text" class="librarian-name name-field" />

          <div class="btn-wrapper">
            <v-btn color="primary" @click="saveLibrarian">Sačuvaj</v-btn>
            <v-btn variant="outlined" @click="editMode = false">Otkaži</v-btn>
          </div>
        </div>

        <div v-else>
          <label class="label">Ime i prezime:</label>
          <p class="librarian-name">{{ librarian.ime_i_prezime }}</p>

          <label class="label">Email:</label>
          <p class="librarian-description">{{ librarian.email }}</p>

          <label class="label">Tip korisnika:</label>
          <p class="librarian-description">{{ librarian.tip_korisnika }}</p>

          <label class="label">Zadnji pristup:</label>
          <p class="librarian-description">{{ formatDate(librarian.zadnji_pristup_sistemu) }}</p>
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

interface Librarian {
  id: number
  ime_i_prezime: string
  email: string
  tip_korisnika: string
  zadnji_pristup_sistemu: string | null
  avatar: string | null
}

interface FormData {
  ime_i_prezime: string
  email: string
  tip_korisnika: string
  avatar: string
}

type EditMode = 'edit' | 'view'

const route = useRoute()
const router = useRouter()
interface LibrariansTable {
  id: number
  ime_i_prezime: string
  email: string
  tip_korisnika: string
  zadnji_pristup_sistemu: string | null
  avatar: string | null
}

const supabase = useSupabaseClient<{ bibliotekari: LibrariansTable }>()

const librarian = ref<Librarian | null>(null)
const error = ref<string | null>(null)
const editMode = ref(false)
const form = ref<FormData>({
  ime_i_prezime: '',
  email: '',
  tip_korisnika: '',
  avatar: ''
})

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

onMounted(async () => {
  await loadLibrarian()
  if (route.query.edit === 'true') {
    editMode.value = true
  }
})

const loadLibrarian = async () => {
  try {
    const { data, error: supabaseError } = await supabase
      .from('bibliotekari')
      .select('id, ime_i_prezime, email, tip_korisnika, zadnji_pristup_sistemu, avatar')
      .eq('id', route.params.id)
      .single()

    if (supabaseError) throw supabaseError

    if (data) {
      librarian.value = {
        ...data,
        avatar: data.avatar || null
      }
      form.value = {
        ime_i_prezime: data.ime_i_prezime,
        email: data.email,
        tip_korisnika: data.tip_korisnika,
        avatar: data.avatar || ''
      }
    }
  } catch (err) {
    error.value = `Greška pri učitavanju bibliotekara: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const saveLibrarian = async () => {
  if (!librarian.value) return
  
  try {
    const { error: updateError } = await supabase
      .from('bibliotekari')
      .update({
        ime_i_prezime: form.value.ime_i_prezime,
        email: form.value.email,
        tip_korisnika: form.value.tip_korisnika,
        avatar: form.value.avatar || null
      })
      .eq('id', librarian.value.id)

    if (updateError) throw updateError

    editMode.value = false
    await loadLibrarian()
  } catch (err) {
    error.value = `Greška pri čuvanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const setError = (msg: string) => {
  error.value = msg
}

const handleEdit = ({ author: editedLibrarian, mode }: { author: Librarian; mode: EditMode }) => {
  if (mode === 'edit') {
    editMode.value = true
  }
}

const handleDelete = async (deletedLibrarian: Librarian) => {
  const confirmed = confirm('Da li ste sigurni da želite da obrišete bibliotekara?')
  if (!confirmed) return

  try {
    const { error: deleteError } = await supabase
      .from('bibliotekari')
      .delete()
      .eq('id', deletedLibrarian.id)

    if (deleteError) throw deleteError

    router.push('/librarians')
  } catch (err) {
    setError(`Greška pri brisanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`)
  }
}
</script>

<style scoped>
.librarian-wrapper {
  max-width: 800px;
  margin: 0;
  padding: 16px;
  text-align: left;
  position: relative;
}

.librarian-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.librarian-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.librarian-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
}

.librarian-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.librarian-card {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
  display: flex;
  gap: 24px;
}

.librarian-avatar {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.librarian-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 8px;
  margin-bottom: 4px;
}

.librarian-name {
  width: 100%;
  font-size: 16px;
}

.librarian-description {
  width: 100%;
  font-size: 16px;
  margin-bottom: 12px;
}

.name-field {
  width: 100%;
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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