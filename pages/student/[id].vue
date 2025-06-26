<template>
  <div class="student-wrapper">
    <div class="student-header">
      <div>
        <h1 class="student-title">{{ student?.ime_i_prezime }}</h1>
        <p class="student-subtitle">
          <span class="link" @click="router.push('/students')">Evidencija učenika</span> / ID: {{ route.params.id }}
        </p>
      </div>

      <ActionMenu 
        v-if="student"
        :author="student"
        :showView="false"
        entityName="učenika"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="setError"
      />
    </div>

    <div v-if="student" class="student-card">
      <img :src="student.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" alt="Avatar učenika" class="student-avatar" />

      <div class="student-info">
        <div v-if="editMode">
          <label class="label">Ime i prezime:</label>
          <input v-model="form.ime_i_prezime" type="text" class="student-name name-field" />

          <label class="label">Email:</label>
          <input v-model="form.email" type="email" class="student-name name-field" />

          <label class="label">Tip korisnika:</label>
          <input v-model="form.tip_korisnika" type="text" class="student-name name-field" />

          <label class="label">Avatar URL:</label>
          <input v-model="form.avatar" type="text" class="student-name name-field" />

          <div class="btn-wrapper">
            <v-btn color="primary" @click="saveStudent">Sačuvaj</v-btn>
            <v-btn variant="outlined" @click="editMode = false">Otkaži</v-btn>
          </div>
        </div>

        <div v-else>
          <label class="label">Ime i prezime:</label>
          <p class="student-name">{{ student.ime_i_prezime }}</p>

          <label class="label">Email:</label>
          <p class="student-description">{{ student.email }}</p>

          <label class="label">Tip korisnika:</label>
          <p class="student-description">Student</p>

          <label class="label">Zadnji pristup:</label>
          <p class="student-description">{{ formatDate(student.zadnji_pristup_sistemu) }}</p>
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

interface Student {
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
interface StudentsTable {
  id: number
  ime_i_prezime: string
  email: string
  tip_korisnika: string
  zadnji_pristup_sistemu: string | null
  avatar: string | null
}

const supabase = useSupabaseClient<{ ucenici: StudentsTable }>()

const student = ref<Student | null>(null)
const error = ref<string | null>(null)
const editMode = ref(false)
const form = ref<FormData>({
  ime_i_prezime: '',
  email: '',
  tip_korisnika: 'Student',
  avatar: ''
})

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

onMounted(async () => {
  await loadStudent()
  if (route.query.edit === 'true') {
    editMode.value = true
  }
})

const loadStudent = async () => {
  try {
    const { data, error: supabaseError } = await supabase
      .from('ucenici')
      .select('id, ime_i_prezime, email, zadnji_pristup_sistemu, avatar')
      .eq('id', route.params.id)
      .single()

    if (supabaseError) throw supabaseError

    if (data) {
      student.value = {
        ...data,
        tip_korisnika: 'Student',
        avatar: data.avatar || null
      }
      form.value = {
        ime_i_prezime: data.ime_i_prezime,
        email: data.email,
        tip_korisnika: 'Student',
        avatar: data.avatar || ''
      }
    }
  } catch (err) {
    error.value = `Greška pri učitavanju učenika: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const saveStudent = async () => {
  if (!student.value) return
  
  try {
    const { error: updateError } = await supabase
      .from('ucenici')
      .update({
        ime_i_prezime: form.value.ime_i_prezime,
        email: form.value.email,
        avatar: form.value.avatar || null
      })
      .eq('id', student.value.id)

    if (updateError) throw updateError

    editMode.value = false
    await loadStudent()
  } catch (err) {
    error.value = `Greška pri čuvanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const setError = (msg: string) => {
  error.value = msg
}

const handleEdit = ({ author: editedStudent, mode }: { author: Student; mode: EditMode }) => {
  if (mode === 'edit') {
    editMode.value = true
  }
}

const handleDelete = async (deletedStudent: Student) => {
  const confirmed = confirm('Da li ste sigurni da želite da obrišete učenika?')
  if (!confirmed) return

  try {
    const { error: deleteError } = await supabase
      .from('ucenici')
      .delete()
      .eq('id', deletedStudent.id)

    if (deleteError) throw deleteError

    router.push('/students')
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

.student-card {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
  display: flex;
  gap: 24px;
}

.student-avatar {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.student-info {
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

.student-name {
  width: 100%;
  font-size: 16px;
}

.student-description {
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