<template>
  <v-card>
    <v-tabs
      v-model="tab"
      background-color="white"
      grow
      class="custom-tabs"
      slider-color="#3392EA"
      style="width: 368px; height: 48px;"
    >
      <v-tab value="one" :class="tab === 'one' ? 'active-tab' : 'inactive-tab'">Osnovni detalji</v-tab>
      <v-tab value="two" :class="tab === 'two' ? 'active-tab' : 'inactive-tab'">Evidencija iznajmljivanja</v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="one">
          <div class="student-wrapper">
            <div class="student-header">
              <div>
                <h1 class="student-title">{{ student?.ime_i_prezime }}</h1>
                <p class="student-subtitle">
                  <span class="link" @click="router.push('/students')">Svi učenici</span>
                  / ID: {{ route.params.id }}
                </p>
              </div>

              <ActionMenu
                v-if="student"
                :item="student"
                :hideViewOption="true"
                entityName="učenika"
                titleProperty="ime_i_prezime"
                @edit="handleEdit"
                @delete="handleDelete"
                @error="setError"
              />
            </div>

            <div v-if="student" class="student-card">
              <img
                :src="student.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'"
                alt="Avatar učenika"
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

                  <Buttons @save="saveStudent" @cancel="() => (editMode = false)" />
                </div>

                <div v-else>
                  <div class="student-field">
                    <span class="student-label">Ime i Prezime</span>
                    <div class="student-value">{{ student.ime_i_prezime }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">JMBG</span>
                    <div class="student-value">{{ student.jmbg }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">Email</span>
                    <div class="student-value email-link">{{ student.email }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">Korisničko ime</span>
                    <div class="student-value">{{ student.korisnicko_ime }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">Broj logovanja</span>
                    <div class="student-value">{{ student.broj_logovanja }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">Poslednji put logovan/a</span>
                    <div class="student-value">{{ formatDate(student.zadnji_pristup_sistemu) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="error" class="error-message">{{ error }}</p>
          </div>
        </v-window-item>

        <v-window-item value="two">
          <div class="under-construction">OVAJ TAB JE U IZRADI</div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import ActionMenu from '~/components/ActionMenu.vue'
import Buttons from '~/components/ActionButtons.vue'

interface Student {
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
const supabase = useSupabaseClient<{ ucenici: Student }>()

const tab = ref('one')
const student = ref<Student | null>(null)
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
  await loadStudent()
  if (route.query.edit === 'true') {
    editMode.value = true
  }
})

const loadStudent = async () => {
  try {
    const { data, error: supabaseError } = await supabase
      .from('ucenici')
      .select('id, ime_i_prezime, jmbg, email, korisnicko_ime, broj_logovanja, zadnji_pristup_sistemu, avatar')
      .eq('id', route.params.id)
      .single()

    if (supabaseError) throw supabaseError

    if (data) {
      student.value = data
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
        jmbg: form.value.jmbg,
        email: form.value.email,
        korisnicko_ime: form.value.korisnicko_ime,
        broj_logovanja: form.value.broj_logovanja,
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

const handleEdit = ({ item: editedStudent, mode }: { item: Student; mode: 'edit' | 'view' }) => {
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
  word-break: break-all;
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

.custom-tabs {
  background-color: white !important;
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

</style>
