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
          <!-- Osnovni detalji -->
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
              <img :src="student.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" alt="Avatar učenika" class="student-avatar" />
              <div class="student-info">
                <template v-if="editMode">
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
                </template>
                <template v-else>
                  <div class="student-field" v-for="(value, label) in displayFields" :key="label">
                    <span class="student-label">{{ label }}</span>
                    <div class="student-value">{{ value }}</div>
                  </div>
                </template>
              </div>
            </div>
            <p v-if="error" class="error-message">{{ error }}</p>
          </div>
        </v-window-item>

        <v-window-item value="two">
          <!-- Evidencija iznajmljivanja -->
          <div class="iznajmljivanje-layout">
            <nav class="side-menu">
              <v-list nav dense class="pa-0">
                <v-list-item
                  v-for="(item, i) in stavke"
                  :key="i"
                  :active="menuTab === i"
                  @click="selectMenuItem(i)"
                  class="side-menu-item"
                >
                  <div class="side-menu-row">
                    <v-list-item-icon>
                      <v-icon :color="menuTab === i ? 'primary' : 'grey'" size="24">{{ item.icon }}</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title :class="['side-menu-text', menuTab === i ? 'font-weight-bold blue--text' : '']">
                      {{ item.label }}
                    </v-list-item-title>
                  </div>
                </v-list-item>
                <div class="menu-divider-wrap">
                  <v-divider class="custom-divider" />
                </div>
              </v-list>
            </nav>
            <div class="main-content">
              <component :is="getComponent" :student-id="studentId" />
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionMenu from '~/components/ActionMenu.vue'
import Buttons from '~/components/ActionButtons.vue'

import IzdateKnjige from '@/components/IzdateKnjige.vue'
import VracanjeKnjige from '@/components/VracanjeKnjige.vue'
import KnjigeUPrekoracenju from '@/components/KnjigeUPrekoracenju.vue'
import AktivneRezervacije from '@/components/AktivneRezervacije.vue'
import ArhiviraneRezervacije from '@/components/ArhiviraneRezervacije.vue'

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

const tab = ref('one')
const student = ref<Student | null>(null)
const error = ref<string | null>(null)
const editMode = ref(false)
const form = ref<FormData>({ ime_i_prezime: '', jmbg: '', email: '', korisnicko_ime: '', broj_logovanja: 0, avatar: '' })

const menuTab = ref(0)
const stavke = [
  { label: 'Izdate knjige', icon: 'mdi-file-document-outline', component: IzdateKnjige },
  { label: 'Vraćanje knjige', icon: 'mdi-file-restore-outline', component: VracanjeKnjige },
  { label: 'Knjige u prekoračenju', icon: 'mdi-alert-outline', component: KnjigeUPrekoracenju },
  { label: 'Aktivne rezervacije', icon: 'mdi-calendar-clock', component: AktivneRezervacije },
  { label: 'Arhivirane rezervacije', icon: 'mdi-archive-outline', component: ArhiviraneRezervacije }
]

const studentId = computed(() => Array.isArray(route.params.id) ? route.params.id[0] : route.params.id)
const getComponent = computed(() => stavke[menuTab.value].component)
const selectMenuItem = (index: number) => { menuTab.value = index }

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const displayFields = computed(() => student.value ? {
  'Ime i Prezime': student.value.ime_i_prezime,
  'JMBG': student.value.jmbg,
  'Email': student.value.email,
  'Korisničko ime': student.value.korisnicko_ime,
  'Broj logovanja': student.value.broj_logovanja,
  'Poslednji put logovan/a': formatDate(student.value.zadnji_pristup_sistemu)
} : {})

onMounted(async () => {
  await loadStudent()
  if (route.query.edit === 'true') editMode.value = true
})

const loadStudent = async () => {
  try {
    // TODO: Zamijeni sa svojim backend pozivom za dohvat učenika
    // const data = await fetchStudentById(route.params.id)
    // student.value = data
    // form.value = { ...data, avatar: data.avatar || '' }
  } catch (err) {
    error.value = `Greška pri učitavanju učenika: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const saveStudent = async () => {
  if (!student.value) return
  try {
    // TODO: Zamijeni sa svojim backend pozivom za update učenika
    // await updateStudent(student.value.id, form.value)
    editMode.value = false
    await loadStudent()
  } catch (err) {
    error.value = `Greška pri čuvanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`
  }
}

const setError = (msg: string) => { error.value = msg }
const handleEdit = ({ mode }: { item: Student; mode: 'edit' | 'view' }) => { if (mode === 'edit') editMode.value = true }
const handleDelete = async (deletedStudent: Student) => {
  const confirmed = confirm('Da li ste sigurni da želite da obrišete učenika?')
  if (!confirmed) return
  try {
    // TODO: Zamijeni sa svojim backend pozivom za brisanje učenika
    // await deleteStudent(deletedStudent.id)
    router.push('/students')
  } catch (err) {
    setError(`Greška pri brisanju: ${err instanceof Error ? err.message : 'Nepoznata greška'}`)
  }
}
</script>


<style scoped>
/* Postojeći stilovi... */
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

/* Stilovi za evidenciju iznajmljivanja */
.iznajmljivanje-layout {
  display: flex;
}

.side-menu {
  width: 247px;
  min-width: 247px;
  max-width: 247px;
  height: 281px;
  min-height: 281px;
  max-height: 281px;
  background: #fafbfc;
  padding-top: 12px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  
}

.side-menu-item {
  display: flex;
  align-items: center;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  padding: 0 8px 0 8px;
  cursor: pointer;
 
  background: transparent;
  margin-bottom: 0;
}

.side-menu-row {
  display: flex;
  align-items: center;
  width: 231px;
  height: 40px;

}

.v-list-item-icon {
  min-width: 24px !important;
  width: 24px !important;
  height: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-menu-text {
  font-weight: 400;
  font-size: 16px;
  line-height: 100%;
  letter-spacing: 0.5px;
  color: #222;
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-menu-item.v-list-item--active,
.side-menu-item.v-list-item--active .v-icon {
  background: #e3f2fd !important;
  color: #1976d2 !important;
}

.menu-divider-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0 16px 0;
}

.custom-divider {
  width: 200px;
  height: 1px;
  background: #e0e0e0;
  margin: 0;
}

.main-content {
  flex: 1;
  padding: 24px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

</style>
