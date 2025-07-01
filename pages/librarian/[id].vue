<template>
  <div class="student-wrapper">
    <div class="student-header">
      <div>
        <h1 class="student-title">{{ librarian?.ime_i_prezime }}</h1>
        <p class="student-subtitle">
          <span class="link" @click="router.push('/librarians')">Svi bibliotekari</span> / ID: {{ route.params.id }}
        </p>
      </div>

      <ActionMenu
        v-if="librarian"
        :item="librarian"
        :hideViewOption="true" 
        entityName="bibliotekara"
        titleProperty="ime_i_prezime"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="setError"
      />
    </div>

    <div v-if="librarian" class="student-card">
      <img 
        :src="librarian.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" 
        alt="Avatar bibliotekara" 
        class="student-avatar"
      />

      <div class="student-info">
        <div v-if="editMode">
          <label class="label">Ime i Prezime:</label>
          <input v-model="form.ime_i_prezime" type="text" class="student-input" />

          <label class="label">JMBG:</label>
          <input v-model="form.jmbg" type="text" class="student-input" />

          <label class="label">Email:</label>
          <input v-model="form.email" type="email" class="student-input" />

          <label class="label">Korisničko ime:</label>
          <input v-model="form.korisnicko_ime" type="text" class="student-input" />

          <label class="label">Broj logovanja:</label>
          <input v-model.number="form.broj_logovanja" type="number" class="student-input" />

          <label class="label">Avatar URL:</label>
          <input v-model="form.avatar" type="text" class="student-input" />

          <Buttons @save="saveLibrarian" @cancel="editMode = false" />
        </div>

        <div v-else>
          <div class="student-field">
            <span class="student-label">Ime i Prezime</span>
            <div class="student-value">{{ librarian.ime_i_prezime }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">JMBG</span>
            <div class="student-value">{{ librarian.jmbg }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Email</span>
            <div class="student-value email-link">{{ librarian.email }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Korisničko ime</span>
            <div class="student-value">{{ librarian.korisnicko_ime }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Broj logovanja</span>
            <div class="student-value">{{ librarian.broj_logovanja }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Poslednji put logovan/a</span>
            <div class="student-value">{{ formatDate(librarian.zadnji_pristup_sistemu) }}</div>
          </div>
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
import Buttons from '~/components/ActionButtons.vue'

interface Librarian {
  id: number
  ime_i_prezime: string
  jmbg: string
  email: string
  korisnicko_ime: string
  broj_logovanja: number
  zadnji_pristup_sistemu: string | null
  avatar: string | null
}

interface FormData {
  ime_i_prezime: string
  jmbg: string
  email: string
  korisnicko_ime: string
  broj_logovanja: number
  avatar: string
}

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient<{ bibliotekari: Librarian }>()

const librarian = ref<Librarian | null>(null)
const error = ref<string | null>(null)
const editMode = ref(false)
const form = ref<FormData>({
  ime_i_prezime: '',
  jmbg: '',
  email: '',
  korisnicko_ime: '',
  broj_logovanja: 0,
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
      .select('id, ime_i_prezime, jmbg, email, korisnicko_ime, broj_logovanja, zadnji_pristup_sistemu, avatar')
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
        jmbg: data.jmbg,
        email: data.email,
        korisnicko_ime: data.korisnicko_ime,
        broj_logovanja: data.broj_logovanja,
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
        jmbg: form.value.jmbg,
        email: form.value.email,
        korisnicko_ime: form.value.korisnicko_ime,
        broj_logovanja: form.value.broj_logovanja,
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

const handleEdit = ({ item: editedLibrarian, mode }: { item: Librarian; mode: 'edit' | 'view' }) => {
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
.student-wrapper {
  max-width: 800px;
  margin: 0;
  padding: 16px;
  text-align: left;
  position: relative;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.student-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.student-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
}

.student-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.student-avatar {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-field {
  margin-bottom: 8px;
}

.student-label {
  display: block;
  color: #888;
  font-size: 15px;
  margin-bottom: 2px;
}

.student-value {
  font-weight: 400;
  color: #222;
  font-size: 16px;
  word-break: break-word;
}

.email-link {
  color: #1976d2;
  cursor: pointer;
}

.label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 8px;
  margin-bottom: 4px;
}

.student-input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
}

.error-message {
  color: red;
  margin-top: 16px;
}
</style>
