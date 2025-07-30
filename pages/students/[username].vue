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
                  <span class="link" @click="router.push('/students')">Svi korisnici</span> / Korisničko ime: {{ route.params.username || 'Nije definisano' }}
                </p>
              </div>
              <ActionMenu
                v-if="user"
                :item="user"
                :hideViewOption="true"
                entityName="korisnika"
                titleProperty="first_name"
                @edit="handleEdit"
                @delete="handleDelete"
                @error="showSnackbar($event, 'error')" />
            </div>
            <div v-if="loading" class="text-center mt-5">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2">Učitavam korisnika...</p>
            </div>
            <v-alert v-else-if="globalError" type="error" class="error-message mt-4">
              {{ globalError }}
              <div class="mt-2">
                <v-btn @click="globalError = null; fetchUser(route.params.username as string)" color="white" small>Pokušaj ponovo</v-btn>
                <v-btn @click="router.push('/students')" color="white" small class="ml-2">Nazad na listu</v-btn>
              </div>
            </v-alert>

            <div v-else-if="user" class="student-card">
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
                  <Buttons @save="saveUser" @cancel="cancelEdit" />
                </template>
                <template v-else>
                  <div class="student-field">
                    <span class="student-label">Ime i Prezime</span>
                    <div class="student-value">{{ user.first_name }} {{ user.last_name }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">Email</span>
                    <div class="student-value">{{ user.email }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">Korisničko ime</span>
                    <div class="student-value">{{ user.username }}</div>
                  </div>
                  <div class="student-field">
                    <span class="student-label">JMBG</span>
                    <div class="student-value">{{ user.jmbg || 'Nije unet' }}</div>
                  </div>
                  </template>
              </div>
            </div>
             <p v-else-if="!user && !loading && !globalError" class="no-user-message">Korisnik nije pronađen ili podaci nisu učitani.</p>
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
              <p>Evidencija iznajmljivanja nije dostupna za ovaj prikaz.</p>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ActionMenu from '~/components/ActionMenu.vue'
import Buttons from '~/components/ActionButtons.vue'
import api from '@/axios' // Koristi globalni axios instance koji ima interceptore

interface User {
  id: number;
  first_name: string;
  last_name: string;
  jmbg?: string | null; // JMBG je opcioni
  email: string;
  username: string;
  role_id: number;
  profile_picture?: string | null;
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

const route = useRoute()
const router = useRouter()

const user = ref<User | null>(null)
// userId je bio problem, promenićemo ga da koristi username direktno iz route.params
const editMode = ref(false)
const globalError = ref<string | null>(null)
const loading = ref(false)
const tab = ref('one')
const localForm = ref<UserFormData>({
  first_name: '',
  last_name: '',
  jmbg: '',
  email: '',
  username: ''
})

const menuTab = ref(0)
const stavke = [
  { label: 'Izdate knjige', icon: 'mdi-file-document-outline', component: null },
  { label: 'Vraćanje knjige', icon: 'mdi-file-restore-outline', component: null },
  { label: 'Knjige u prekoračenju', icon: 'mdi-alert-outline', component: null },
  { label: 'Aktivne rezervacije', icon: 'mdi-calendar-clock', component: null },
  { label: 'Arhivirane rezervacije', icon: 'mdi-archive-outline', component: null }
]

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 3000,
})

const showSnackbar = (message: string, color: string = 'info', timeout: number = 3000) => {
  console.log(`[Snackbar] Message: ${message}, Color: ${color}`);
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.timeout = timeout
  snackbar.value.show = true
}

const getComponent = computed(() => stavke[menuTab.value]?.component ?? null)
const selectMenuItem = (index: number) => {
  console.log(`[selectMenuItem] Selected tab index: ${index}`);
  menuTab.value = index
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS') + ' ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
}

const getProfilePictureUrl = (picturePath: string | null | undefined) => {
  const url = picturePath ? `http://localhost:8000/storage/${picturePath}` : '/images/default-user-1.jpg'; // ISPRAVLJENO: Dodato 8000 port
  console.log(`[getProfilePictureUrl] Generated URL: ${url} for path: ${picturePath}`);
  return url;
}

const fetchUser = async (username: string) => {
  console.log(`[fetchUser] Pokrenuto dohvatanje korisnika za username: ${username}`);
  loading.value = true
  globalError.value = null
  try {
    // API instanca bi već trebalo da ima token zahvaljujući axios interceptoru
    // Nema potrebe za ručnim dobijanjem tokena ovde
    // const token = localStorage.getItem('authToken');
    // console.log(`[fetchUser] Dohvaćen token iz localStorage: ${token ? 'Dostupan' : 'NIJE Dostupan'}`);
    // if (!token) {
    //   showSnackbar('Greška: Token za autorizaciju nije pronađen.', 'error');
    //   loading.value = false;
    //   return;
    // }

    if (!username) {
        globalError.value = 'Korisničko ime nije definisano u URL-u.'; // Ažurirana poruka
        showSnackbar(globalError.value, 'error');
        loading.value = false;
        console.warn('[fetchUser] Username je prazan ili nedefinisan.');
        return;
    }

    const apiUrl = `/users/${username}`; // API path je `/users/amel`, globalni 'api' instance već ima 'http://localhost:8000/api'
    console.log(`[fetchUser] API URL: ${apiUrl}`);

    // Koristimo 'api' instance umesto 'axios' direktno
    const response = await api.get(apiUrl);
    console.log('[fetchUser] Odgovor API-ja:', response.data);

    user.value = response.data.data // Pristupa 'data' property-ju jer je tamo korisnik u odgovoru API-ja
    if (user.value) {
      console.log('[fetchUser] Korisnički podaci uspešno učitani:', user.value);
      localForm.value = {
        first_name: user.value.first_name,
        last_name: user.value.last_name,
        jmbg: user.value.jmbg || '', // Postavi prazan string ako je null/undefined
        email: user.value.email,
        username: user.value.username
      }
      console.log('[fetchUser] localForm ažuriran:', localForm.value);
    } else {
      console.warn('[fetchUser] response.data.data je null ili undefined.');
      globalError.value = 'Korisnički podaci su prazni u odgovoru API-ja.';
      showSnackbar(globalError.value, 'error');
    }
  } catch (error: any) {
    console.error('[fetchUser] Greška pri dohvatanju korisnika:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[fetchUser] Axios greška, status:', error.response.status, 'data:', error.response.data);
      globalError.value = `Greška: ${error.response.data.message || 'Nepoznata greška'}`;
      if (error.response.status === 404) {
          globalError.value = `Korisnik sa korisničkim imenom "${username}" nije pronađen.`;
      } else if (error.response.status === 403) {
          globalError.value = 'Nemate dozvolu za pristup ovom korisniku.';
      } else if (error.response.status === 401) {
          globalError.value = 'Neautorizovan pristup. Molimo prijavite se ponovo.';
          // Opcionalno, preusmeri na login stranicu
          // router.push('/login');
      }
    } else {
      globalError.value = 'Došlo je do mrežne greške ili greške servera.';
      console.error('[fetchUser] Nije Axios greška:', error);
    }
    showSnackbar(globalError.value, 'error');
    user.value = null;
  } finally {
    loading.value = false;
    console.log(`[fetchUser] Završeno dohvatanje korisnika. Loading: ${loading.value}`);
  }
}

const saveUser = async () => {
  console.log('[saveUser] Pokrenuto čuvanje korisnika.');
  if (!user.value) {
    showSnackbar('Podaci o korisniku nisu učitani.', 'error')
    console.warn('[saveUser] user.value je null, ne mogu da sačuvam.');
    return
  }
  loading.value = true
  globalError.value = null
  try {
    // Koristimo globalni 'api' instance, tako da ne treba ručno token
    // const token = localStorage.getItem('authToken');
    // console.log(`[saveUser] Dohvaćen token iz localStorage: ${token ? 'Dostupan' : 'NIJE Dostupan'}`);
    // if (!token) {
    //   showSnackbar('Greška: Token za autorizaciju nije pronađen.', 'error');
    //   loading.value = false;
    //   return;
    // }

    const apiUrl = `/users/${user.value.id}`; // Ažuriranje treba da ide po ID-u, ne po username-u
    console.log(`[saveUser] API URL (PUT): ${apiUrl}`);
    console.log('[saveUser] Podaci koji se šalju:', localForm.value);

    const response = await api.put(apiUrl, localForm.value); // Koristimo 'api' instance
    console.log('[saveUser] Odgovor API-ja:', response.data);
    user.value = response.data.data
    editMode.value = false
    showSnackbar('Korisnik uspješno ažuriran!', 'success')
    console.log('[saveUser] Korisnik uspešno ažuriran, editMode isključen.');
  } catch (error: any) {
    console.error('[saveUser] Greška pri ažuriranju korisnika:', error)
    if (axios.isAxiosError(error) && error.response) {
      console.error('[saveUser] Axios greška, status:', error.response.status, 'data:', error.response.data);
      globalError.value = `Greška pri ažuriranju: ${error.response.data.message || 'Nepoznata greška'}`
      if (error.response.status === 422 && error.response.data.errors) {
        globalError.value += '\n' + Object.values(error.response.data.errors).flat().join('\n')
        console.error('[saveUser] Validacione greške:', error.response.data.errors);
      }
    } else {
      globalError.value = 'Došlo je do mrežne greške ili greške servera pri ažuriranju.'
      console.error('[saveUser] Nije Axios greška:', error);
    }
    showSnackbar(globalError.value, 'error')
  } finally {
    loading.value = false
    console.log(`[saveUser] Završeno čuvanje korisnika. Loading: ${loading.value}`);
  }
}

const handleEdit = () => {
  editMode.value = true
  console.log('[handleEdit] Uključen editMode.');
}

const cancelEdit = () => {
  editMode.value = false;
  if (user.value) {
    localForm.value = {
      first_name: user.value.first_name,
      last_name: user.value.last_name,
      jmbg: user.value.jmbg || '',
      email: user.value.email,
      username: user.value.username
    };
  }
  globalError.value = null; // Resetuj grešku pri otkazivanju
  showSnackbar('Uređivanje otkazano.', 'info');
  console.log('[cancelEdit] Uređivanje otkazano, localForm resetovan.');
};


const handleDelete = async (item: User) => {
  console.log(`[handleDelete] Pokrenuto brisanje korisnika: ${item.first_name} (ID: ${item.id})`);
  const confirmed = confirm(`Da li ste sigurni da želite da obrišete korisnika ${item.first_name} ${item.last_name}?`)
  if (confirmed) {
    console.log('[handleDelete] Brisanje potvrđeno.');
    loading.value = true
    try {
      // Koristimo globalni 'api' instance, tako da ne treba ručno token
      // const token = localStorage.getItem('authToken');
      // console.log(`[handleDelete] Dohvaćen token iz localStorage: ${token ? 'Dostupan' : 'NIJE Dostupan'}`);
      // if (!token) {
      //   showSnackbar('Greška: Token za autorizaciju nije pronađen.', 'error');
      //   loading.value = false;
      //   return;
      // }

      const apiUrl = `/users`;
      const deleteData = { users_id: [item.id] };
      console.log(`[handleDelete] API URL (DELETE): ${apiUrl}, Podaci za brisanje:`, deleteData);

      await api.delete(apiUrl, { data: deleteData }); // Koristimo 'api' instance
      showSnackbar('Korisnik uspješno obrisan!', 'success')
      console.log('[handleDelete] Korisnik uspešno obrisan.');
      router.push('/students') // Preusmeri na listu studenata nakon brisanja (bio /users)
      console.log('[handleDelete] Preusmeravam na /students.');
    } catch (error: any) {
      console.error('[handleDelete] Greška pri brisanju korisnika:', error)
      if (axios.isAxiosError(error) && error.response) {
        console.error('[handleDelete] Axios greška, status:', error.response.status, 'data:', error.response.data);
        showSnackbar(`Greška pri brisanju: ${error.response.data.message || 'Nepoznata greška'}`, 'error')
      } else {
        showSnackbar('Došlo je do mrežne greške ili greške servera pri brisanju.', 'error');
        console.error('[handleDelete] Nije Axios greška:', error);
      }
    } finally {
      loading.value = false
      console.log(`[handleDelete] Završeno brisanje. Loading: ${loading.value}`);
    }
  } else {
    console.log('[handleDelete] Brisanje otkazano.');
  }
}

// Na mounted i pri promeni USERNAME-a u ruti, dohvati korisnika
onMounted(() => {
  console.log('[onMounted] Komponenta je montirana.');
  const usernameFromRoute = route.params.username as string; // PROMENJENO: sa route.params.id na route.params.username
  console.log(`[onMounted] Korisničko ime iz rute (route.params.username): ${usernameFromRoute}`);
  if (usernameFromRoute) {
    fetchUser(usernameFromRoute);
  } else {
    globalError.value = 'Nije pronađeno korisničko ime u URL-u pri učitavanju stranice.';
    showSnackbar(globalError.value, 'error');
    console.error('[onMounted] route.params.username je undefined ili null.');
  }
})

watch(() => route.params.username, (newUsername, oldUsername) => { // PROMENJENO: sa route.params.id na route.params.username
  console.log(`[watch:route.params.username] Promena username-a rute: Novi: ${newUsername}, Stari: ${oldUsername}`);
  if (newUsername && newUsername !== user.value?.username) { // Proveri da li je novi username različit od trenutnog korisnika
    console.log(`[watch:route.params.username] Username se promenio na: ${newUsername}. Pokrećem fetchUser.`);
    fetchUser(newUsername as string);
  } else if (!newUsername) {
      console.warn('[watch:route.params.username] Novi username je prazan ili undefined, ne radim ništa.');
  } else {
      console.log('[watch:route.params.username] Username se nije promenio ili je isti kao trenutni user. Ne radim ništa.');
  }
})

// Prati promene u user objektu i ažurira localForm za edit mode
watch(user, (newUser) => {
  console.log('[watch:user] User objekat se promenio.');
  if (newUser) {
    console.log('[watch:user] Novi user podaci:', newUser);
    localForm.value = {
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      jmbg: newUser.jmbg || '',
      email: newUser.email,
      username: newUser.username
    }
    console.log('[watch:user] localForm ažuriran na osnovu novog user objekta:', localForm.value);
  } else {
    console.log('[watch:user] User je postao null.');
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
/* Postojeći stilovi su zadržani */
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

.student-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  background-color: #ffebee;
  border-left: 5px solid #ef5350;
  padding: 12px;
  margin-top: 16px;
  border-radius: 4px;
}

.loading-message {
  color: #3392EA;
  margin-top: 16px;
}

.no-user-message {
    color: #555;
    margin-top: 16px;
    font-style: italic;
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
  height: 281px; /* Prilagođena visina ako je sadržaj prazan */
  min-height: 100px; /* Manja minimalna visina za prazan sadržaj */
  max-height: auto; /* Dozvoli prilagođavanje */
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