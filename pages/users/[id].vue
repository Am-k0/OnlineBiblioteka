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
                <h1 class="student-title">{{ user?.first_name }} {{ user?.last_name }}</h1>
                <p class="student-subtitle">
                  <span class="link" @click="emit('navigate', '/users')">Svi korisnici</span> / Korisničko ime: {{ userId }} </p>
              </div>
              <ActionMenu
                v-if="user"
                :item="user"
                :hideViewOption="true"
                entityName="korisnika" titleProperty="first_name"
                @edit="handleEdit"
                @delete="handleDelete"
                @error="emit('error', $event)"
              />
            </div>
            <div v-if="user" class="student-card">
              <img :src="getProfilePictureUrl(user.profile_picture)" alt="Avatar korisnika" class="student-avatar" />
              <div class="student-info">
                <template v-if="editMode">
                  <label class="label">Ime:</label>
                  <input v-model="localForm.first_name" type="text" class="student-input" />
                  <label class="label">Prezime:</label>
                  <input v-model="localForm.last_name" type="text" class="student-input" />
                  <label class="label">JMBG:</label>
                  <input v-model="localForm.jmbg" type="text" class="student-input" />
                  <label class="label">Email:</label>
                  <input v-model="localForm.email" type="email" class="student-input" />
                  <label class="label">Korisničko ime:</label>
                  <input v-model="localForm.username" type="text" class="student-input" />
                  <Buttons @save="saveUser" @cancel="() => (editMode = false)" />
                </template>
                <template v-else>
                  <div class="student-field" v-for="(value, label) in displayFields" :key="label">
                    <span class="student-label">{{ label }}</span>
                    <div class="student-value">{{ value }}</div>
                  </div>
                </template>
              </div>
            </div>
            <p v-if="globalError" class="error-message">{{ globalError }}</p>
          </div>
        </v-window-item>

        <v-window-item value="two">
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
                  <template v-slot:prepend>
                    <v-icon :color="menuTab === i ? 'primary' : 'grey'" size="24">{{ item.icon }}</v-icon>
                  </template>
                  <v-list-item-title :class="['side-menu-text', menuTab === i ? 'font-weight-bold blue--text' : '']">
                    {{ item.label }}
                  </v-list-item-title>
                </v-list-item>
                <div class="menu-divider-wrap">
                  <v-divider class="custom-divider" />
                </div>
              </v-list>
            </nav>
            <div class="main-content">
              <component :is="getComponent" :student-id="user?.id" />
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
// Akcione komponente i Vuetify komponente su zadržane
import ActionMenu from '~/components/ActionMenu.vue'
import Buttons from '~/components/ActionButtons.vue'
import IzdateKnjige from '~/components/IzdateKnjige.vue'
import VracanjeKnjige from '~/components/VracanjeKnjige.vue'
import KnjigeUPrekoracenju from '~/components/KnjigeUPrekoracenju.vue'
import AktivneRezervacije from '~/components/AktivneRezervacije.vue'
import ArhiviraneRezervacije from '~/components/ArhiviraneRezervacije.vue'

// Definicije interfejsa
interface User {
  id: number;
  first_name: string;
  last_name: string;
  jmbg: string;
  email: string;
  username: string;
  role_id: number;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  jmbg: string;
  email: string;
  username: string;
}

const props = defineProps({
  user: { // User data is now a prop
    type: Object as () => User | null,
    default: null
  },
  userId: { // ID of the user, could be string (username) or number (id)
    type: [String, Number],
    required: true
  },
  editMode: { // Controls initial edit mode
    type: Boolean,
    default: false
  },
  globalError: { // Error message from parent/backend
    type: String,
    default: null
  }
});

const emit = defineEmits([
  'update:editMode', // Emits when edit mode changes
  'save-user',       // Emits when user clicks save after editing
  'delete-user',     // Emits when user confirms deletion
  'navigate',        // Emits for navigation (e.g., to /users)
  'error',           // Emits for any internal errors (e.g., ID not found)
  'load-user'        // Emits when the component needs user data (on mount or ID change)
]);

const tab = ref('one')
const editMode = ref(props.editMode) // Lokalno stanje za editMode

// Lokalna forma koja se inicijalizuje iz props.user ili prazno
const localForm = ref<UserFormData>({
  first_name: '',
  last_name: '',
  jmbg: '',
  email: '',
  username: ''
});

const menuTab = ref(0)
const stavke = [
  { label: 'Izdate knjige', icon: 'mdi-file-document-outline', component: IzdateKnjige },
  { label: 'Vraćanje knjige', icon: 'mdi-file-restore-outline', component: VracanjeKnjige },
  { label: 'Knjige u prekoračenju', icon: 'mdi-alert-outline', component: KnjigeUPrekoracenju },
  { label: 'Aktivne rezervacije', icon: 'mdi-calendar-clock', component: AktivneRezervacije },
  { label: 'Arhivirane rezervacije', icon: 'mdi-archive-outline', component: ArhiviraneRezervacije }
]

const getComponent = computed(() => stavke[menuTab.value]?.component ?? null)
const selectMenuItem = (index: number) => { menuTab.value = index }

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS') + ' ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
}

const getProfilePictureUrl = (picturePath: string | null | undefined) => {
  if (picturePath) {
    return `http://localhost/storage/${picturePath}`;
  }
  return '/images/default-user-1.jpg'
}

const displayFields = computed(() => {
  if (!props.user) {
    return {}
  }
  return {
    'Ime i Prezime': `${props.user.first_name} ${props.user.last_name}`,
    'JMBG': props.user.jmbg,
    'Email': props.user.email,
    'Korisničko ime': props.user.username,
    'Poslednji put logovan/a': formatDate(props.user.updated_at)
  }
})

// Emituj 'load-user' kada se userId promeni ili kada se komponenta montira ako nema user podataka
watch(() => props.userId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    emit('load-user', newId);
  }
}, { immediate: true }); // Učitaj odmah po montiranju

watch(() => props.user, (newUser) => {
  if (newUser) {
    localForm.value = {
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      jmbg: newUser.jmbg,
      email: newUser.email,
      username: newUser.username
    };
  }
}, { immediate: true, deep: true }); // Inicijalizuj formu kada se user prop promeni

// Watch editMode prop i emituj promenu
watch(() => props.editMode, (newVal) => {
  editMode.value = newVal;
});
watch(editMode, (newVal) => {
  emit('update:editMode', newVal);
});

const saveUser = () => {
  if (!props.user) {
    emit('error', 'Podaci o korisniku nisu učitani.');
    return;
  }
  // Emituj podatke iz lokalne forme i originalni ID/username
  emit('save-user', { id: props.user.id, username: props.user.username, formData: localForm.value });
};

const handleEdit = () => { // ActionMenu emituje samo item, ne mode
  editMode.value = true
  // Forma se već inicijalizuje watch-erom na props.user
}

const handleDelete = (deletedUser: User) => { // ActionMenu emituje samo item
  const confirmed = confirm('Da li ste sigurni da želite da obrišete korisnika?');
  if (confirmed) {
    emit('delete-user', deletedUser.id); // Emituj samo ID za brisanje
  }
};
</script>

<style scoped>
/* Vaši stilovi ostaju isti */
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