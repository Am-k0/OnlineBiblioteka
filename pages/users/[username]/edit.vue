<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Korisnik: {{ korisnickoIme || 'Učitavam...' }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="handleBackClick">
            Svi {{ selectedRole === 1 ? 'učenici' : selectedRole === 2 ? 'bibliotekari' : 'korisnika' }}
          </span>
          / Uređivanje: {{ korisnickoIme || 'Učitavam...' }}
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="main-form-content">
        <div v-if="pageLoading" class="loading-overlay">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Učitavam podatke korisnika...</p>
        </div>
        
        <div v-else class="form-section">
          <div class="photo-section">
            <div class="photo-upload-box" @click="triggerFileInput">
              <v-icon v-if="!slikaUrl" size="large" color="#757575">mdi-image</v-icon>
              <input type="file" ref="fileInput" accept="image/*" @change="handleFileUpload" style="display: none">
              <div v-if="!slikaUrl" class="upload-text">Promenite fotografiju</div>
              <v-img v-if="slikaUrl" :src="slikaUrl" class="image-preview"></v-img>
            </div>
          </div>
  
          <div class="form-container">
            <v-text-field
              v-model="firstName"
              label="Unesite ime..."
              variant="outlined"
              hide-details
              class="form-field"
              :error="!!localError.firstName"
              color="primary"
            ></v-text-field>
            <div v-if="localError.firstName" class="error-message">{{ localError.firstName }}</div>
  
            <v-text-field
              v-model="lastName"
              label="Unesite prezime..."
              variant="outlined"
              hide-details
              class="form-field"
              :error="!!localError.lastName"
              color="primary"
            ></v-text-field>
            <div v-if="localError.lastName" class="error-message">{{ localError.lastName }}</div>
  
            <v-select
              v-model="selectedRole"
              :items="roleOptions"
              item-title="name"
              item-value="id"
              label="Tip korisnika"
              variant="outlined"
              hide-details
              class="form-field"
              disabled
              color="primary"
            ></v-select>
  
            <v-text-field
              v-model="jmbg"
              label="Unesite JMBG..."
              variant="outlined"
              hide-details
              class="form-field"
              type="text"
              maxlength="13"
              :error="!!localError.jmbg"
              @keypress="samoBrojevi($event)"
              color="primary"
            ></v-text-field>
            <div v-if="localError.jmbg" class="error-message">{{ localError.jmbg }}</div>
  
            <v-text-field
              v-model="email"
              label="Unesite e-mail..."
              variant="outlined"
              hide-details
              class="form-field"
              type="email"
              :error="!!localError.email"
              color="primary"
            ></v-text-field>
            <div v-if="localError.email" class="error-message">{{ localError.email }}</div>
  
            <v-text-field
              v-model="korisnickoIme"
              label="Unesite korisničko ime..."
              variant="outlined"
              hide-details
              class="form-field"
              :error="!!localError.korisnickoIme"
              disabled
              color="primary"
            ></v-text-field>
            <div v-if="localError.korisnickoIme" class="error-message">{{ localError.korisnickoIme }}</div>
  
            <ActionButtons
              @save="handleSave"
              @cancel="handleCancel"
              :loading="loading"
              container-class="mt-4"
            />
          </div>
        </div>
      </div>
    </div>

    <v-snackbar
      v-model="errorSnackbar.show"
      color="error"
      :timeout="5000"
      top
    >
      {{ errorSnackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="errorSnackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="successSnackbar.show"
      color="primary"
      :timeout="3000"
      bottom
    >
      {{ successSnackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="successSnackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import ActionButtons from '~/components/action-buttons.vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/axios'


definePageMeta({
  layout: 'book-rental',
  
  middleware: ['auth', 'auth-user-profile', 'auth-edit-profile']
})

const route = useRoute()
const router = useRouter()

const slikaUrl = ref('')
const fotografija = ref<File | null>(null)
const firstName = ref('')
const lastName = ref('')
const jmbg = ref('')
const email = ref('')
const korisnickoIme = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const loading = ref(false)
const pageLoading = ref(true)
const userId = ref<number | null>(null)

const errorSnackbar = ref({
  show: false,
  text: '',
});


const successSnackbar = ref({
  show: false,
  text: '',
});

const selectedRole = ref<number | null>(null)
const roleOptions = ref([
  { id: 1, name: 'Učenik' },
  { id: 2, name: 'Bibliotekar' }
])

const localError = ref({
  firstName: '',
  lastName: '',
  jmbg: '',
  email: '',
  korisnickoIme: '',
  opsta: ''
})

const samoBrojevi = (evt: KeyboardEvent) => {
  const charCode = evt.which ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault()
  }
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      localError.value.opsta = 'Slika je prevelika! Maksimalna veličina je 5MB.'
      return
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      localError.value.opsta = 'Neispravna vrsta datoteke! Dozvoljene su samo JPEG, PNG, JPG i GIF slike.'
      return
    }
    fotografija.value = file
    slikaUrl.value = URL.createObjectURL(file)
    localError.value.opsta = ''
  }
}

const clearErrors = () => {
  localError.value = {
    firstName: '',
    lastName: '',
    jmbg: '',
    email: '',
    korisnickoIme: '',
    opsta: ''
  }
  errorSnackbar.value.show = false
}

const validateForm = () => {
  let hasErrors = false
  clearErrors()
  if (!firstName.value.trim()) { localError.value.firstName = 'Morate uneti ime!'; hasErrors = true }
  if (!lastName.value.trim()) { localError.value.lastName = 'Morate uneti prezime!'; hasErrors = true }
  if (!jmbg.value.trim()) { localError.value.jmbg = 'Morate uneti JMBG!'; hasErrors = true }
  else if (jmbg.value.length !== 13) { localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!'; hasErrors = true }
  if (!email.value.trim()) { localError.value.email = 'Morate uneti e-mail!'; hasErrors = true }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { localError.value.email = 'Unesite validan e-mail format!'; hasErrors = true }
  return !hasErrors
}

const showErrorSnackbar = (message: string) => {
  errorSnackbar.value.text = message;
  errorSnackbar.value.show = true;
};

const fetchUserData = async () => {
  const username = route.params.username as string;
  if (!username) { showErrorSnackbar('Korisničko ime nije definisano u URL-u.'); pageLoading.value = false; return; }
  pageLoading.value = true;
  clearErrors();
  try {
    const response = await api.get(`/users/${username}`);
    let user = null;
    if (response.data && Array.isArray(response.data) && response.data.length > 0) user = response.data[0];
    else if (response.data && response.data.data) user = response.data.data;
    else if (response.data && response.data.id) user = response.data;
    if (!user) throw new Error('API je vratio neispravan format podataka.');
    userId.value = user.id;
    firstName.value = user.first_name || '';
    lastName.value = user.last_name || '';
    korisnickoIme.value = user.username || '';
    jmbg.value = user.jmbg || '';
    email.value = user.email || '';
    selectedRole.value = user.role_id;
    if (user.profile_picture) {
      slikaUrl.value = user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/storage/${user.profile_picture}`;
    } else {
      slikaUrl.value = '/images/default-user-1.jpg';
    }
  } catch (error: any) {
    console.error('Failed to fetch user data:', error);
    if (error.response) {
      if (error.response.status === 404) showErrorSnackbar('Korisnik nije pronađen. Molimo provjerite da li korisničko ime postoji.');
      else if (error.response.status === 403) showErrorSnackbar('Nemate dozvolu za pristup ovom korisniku.');
      else showErrorSnackbar(`Došlo je do greške (${error.response.status}): ${error.response.data?.message || 'Nepoznata greška'}`);
    } else {
      showErrorSnackbar('Došlo je do greške prilikom učitavanja podataka. Molimo provjerite mrežnu vezu i URL adrese.');
    }
  } finally {
    pageLoading.value = false;
  }
}

const handleSave = async () => {
  if (!validateForm()) {
    showErrorSnackbar('Molimo ispravite unete podatke.');
    return;
  }

  loading.value = true;
  clearErrors();

  try {
    const dataToUpdate = {
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
      jmbg: jmbg.value.trim(),
    };
    // Ove rute su dobre jer ne šalješ ID korisnika, već backend sam zna koga da ažurira na osnovu tokena
    await api.patch('/user/update', dataToUpdate);

    if (fotografija.value) {
      const pictureFormData = new FormData();
      pictureFormData.append('profile_picture', fotografija.value);
      await api.post('/user/update-profile-picture', pictureFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    successSnackbar.value.text = 'Uspješno ste promijenili podatke';
    successSnackbar.value.show = true;

    setTimeout(() => {
      router.push(`/users/${korisnickoIme.value}`);
    }, 1500);

  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.response) {
      if (error.response.status === 422) {
        const backendErrors = error.response.data.errors || error.response.data;
        localError.value.firstName = backendErrors?.first_name?.[0] || '';
        localError.value.lastName = backendErrors?.last_name?.[0] || '';
        localError.value.jmbg = backendErrors?.jmbg?.[0] || '';
        localError.value.email = backendErrors?.email?.[0] || '';
        localError.value.opsta = backendErrors?.profile_picture?.[0] || '';
        showErrorSnackbar('Uneseni podaci su neispravni. Molimo proverite greške.');
      } else {
        showErrorSnackbar(`Došlo je do greške (${error.response.status}): ${error.response.data?.message || 'Nepoznata greška'}`);
      }
    } else {
      showErrorSnackbar('Došlo je do neočekivane greške. Molimo proverite mrežnu vezu.');
    }
  } finally {
    loading.value = false;
  }
};


const handleCancel = () => {
  router.push(`/users/${korisnickoIme.value}`)
}

const handleBackClick = () => {
  if (selectedRole.value === 1) {
    router.push('/students');
  } else if (selectedRole.value === 2) {
    router.push('/librarians');
  } else {
    router.push('/users'); 
  }
}

onMounted(() => {
  fetchUserData()
})

watch(() => route.params.username, (newUsername) => {
  if (newUsername) fetchUserData();
})
</script>

<style scoped>
/* Tvoji stilovi ostaju nepromenjeni, oni su sasvim u redu */
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}

.app-header {
  padding: 6px 24px 0 24px;
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
  margin-top: 2px;
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 15px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.main-form-content {
  display: flex;
  flex-direction: column;
}

.form-section {
  display: flex;
  flex-direction: column;
}

.photo-upload-box {
  width: 200px;
  height: 160px;
  border: 1px dashed #BDBDBB;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #FAFAFA;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
  margin-left: 5px;
  margin-bottom: 15px;
}

.photo-upload-box:hover {
  border-color: #3392EA;
}

.upload-text {
  margin-top: 8px;
  color: #757575;
  font-size: 14px;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.form-container {
  max-width: 463px;
  width: 100%;
  margin-left: 5px;
}

.form-field {
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}
</style>