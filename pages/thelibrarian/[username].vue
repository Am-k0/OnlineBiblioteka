<template>
  <div class="student-wrapper">
    <div class="student-header">
      <div>
        <h1 class="student-title">{{ librarian?.first_name }} {{ librarian?.last_name }}</h1>
        <p class="student-subtitle">
          <span class="link" @click="router.push('/thelibrarian')">Svi bibliotekari</span> / Korisničko ime: {{ route.params.username }}
        </p>
      </div>

      <ActionMenu
        v-if="librarian && !loading"
        :item="librarian"
        :hideViewOption="true"
        entityName="bibliotekara"
        titleProperty="first_name"
        @edit="handleEdit"
        @delete="handleDelete"
        @error="setError"
      />
    </div>

    <div v-if="loading" class="text-center mt-5">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-2">Učitavam bibliotekara...</p>
    </div>

    <v-alert v-else-if="error" type="error" class="error-message mt-4">
      {{ error }}
      <div class="mt-2">
        <v-btn @click="error = null; loadLibrarian()" color="white" small>Pokušaj ponovo</v-btn>
        <v-btn @click="router.push('/thelibrarian')" color="white" small class="ml-2">Nazad na listu</v-btn>
      </div>
    </v-alert>

    <div v-else-if="librarian" class="student-card">
      <img
        :src="getProfilePictureUrl(librarian.profile_picture)"
        alt="Avatar bibliotekara"
        class="student-avatar"
      />

      <div class="student-info">
        <div v-if="editMode">
          <label class="label">Ime:</label>
          <input v-model="form.first_name" type="text" class="student-input" />

          <label class="label">Prezime:</label>
          <input v-model="form.last_name" type="text" class="student-input" />

          <label class="label">Email:</label>
          <input v-model="form.email" type="email" class="student-input" />

          <label class="label">Korisničko ime:</label>
          <input v-model="form.username" type="text" class="student-input" />

          <label class="label">JMBG:</label>
          <input v-model="form.jmbg" type="text" class="student-input" />

          <label class="label">Broj logovanja:</label>
          <input v-model.number="form.login_count" type="number" class="student-input" />

          <label class="label">Promeni Avatar:</label>
          <input type="file" @change="handleFileChange" accept="image/*" class="student-input" />
          <p v-if="form.profile_picture_file" class="text-caption mt-1">Izabran fajl: {{ form.profile_picture_file.name }}</p>

          <Buttons @save="saveLibrarian" @cancel="cancelEdit" />
        </div>

        <div v-else>
          <div class="student-field">
            <span class="student-label">Ime i Prezime</span>
            <div class="student-value">{{ librarian.first_name }} {{ librarian.last_name }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Email</span>
            <div class="student-value email-link">{{ librarian.email }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Korisničko ime</span>
            <div class="student-value">{{ librarian.username }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">JMBG</span>
            <div class="student-value">{{ librarian.jmbg || 'Nije unet' }}</div> </div>
          <div class="student-field">
            <span class="student-label">Broj logovanja</span>
            <div class="student-value">{{ librarian.login_count }}</div>
          </div>
          <div class="student-field">
            <span class="student-label">Poslednji put logovan/a</span>
            <div class="student-value">{{ formatDate(librarian.updated_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <v-alert v-if="successMessage" type="success" class="success-message mt-4">
      {{ successMessage }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionMenu from '~/components/ActionMenu.vue' // ✅ PROVERI PUTANJU
import Buttons from '~/components/ActionButtons.vue' // ✅ PROVERI PUTANJU
import api from '@/axios' // ✅ PROVERI PUTANJU

interface Librarian {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  jmbg?: string | null // JMBG je opcioni i može biti null
  login_count: number
  profile_picture?: string | null
  created_at: string
  updated_at: string
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  username: string
  jmbg: string
  login_count: number
  profile_picture_file?: File | null
}

const route = useRoute()
const router = useRouter()

const librarian = ref<Librarian | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const editMode = ref(false)
const successMessage = ref<string | null>(null);

const form = ref<FormData>({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  jmbg: '',
  login_count: 0,
  profile_picture_file: null
})

const defaultAvatar = '/images/default-user-1.jpg'; // ✅ PROVERI PUTANJU

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nije pristupao'
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS') + ' ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
}

const getProfilePictureUrl = (picturePath: string | null | undefined) => {
  if (picturePath) {
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    return `http://localhost:8000/storage/${picturePath}`; // ✅ PRILAGODI URL AKO JE DRUGAČIJI
  }
  return defaultAvatar;
}

const initializeForm = (data: Librarian) => {
  form.value = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    username: data.username,
    jmbg: data.jmbg || '', // Postavi default prazan string ako JMBG ne postoji
    login_count: data.login_count,
    profile_picture_file: null
  };
};

onMounted(async () => {
  await loadLibrarian();
  if (librarian.value && route.query.edit === 'true') {
    editMode.value = true;
  }
});

watch(() => route.params.username, async (newUsername, oldUsername) => {
  if (newUsername && newUsername !== oldUsername) {
    await loadLibrarian();
  }
});

const loadLibrarian = async () => {
  const username = route.params.username as string;
  if (!username) {
    error.value = 'Korisničko ime nije pronađeno u URL-u.';
    return;
  }

  loading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const response = await api.get(`/users/${username}`);
    // Očekujemo da backend vraća { data: userObject }, kao u Postman-u za /users
    librarian.value = response.data.data; 

    if (librarian.value) {
      initializeForm(librarian.value);
    }
  } catch (err: any) {
    console.error('Greška pri učitavanju bibliotekara:', err);
    if (err.response) {
      if (err.response.status === 404) {
        error.value = `Bibliotekar sa korisničkim imenom "${username}" nije pronađen.`;
      } else if (err.response.status === 401 || err.response.status === 403) {
        error.value = 'Nemate autorizaciju za pristup ovim podacima. Molimo prijavite se ponovo.';
        // Opcionalno, preusmeri na login stranicu
        // router.push('/login');
      } else {
        if (err.response.data && err.response.data.errors) {
          error.value = Object.values(err.response.data.errors).flat().join(', ');
        } else {
          error.value = err.response.data?.message || `Greška ${err.response.status}: Neuspešno učitavanje bibliotekara.`;
        }
      }
    } else if (err.request) {
      error.value = 'Nema odgovora od servera. Proverite mrežnu konekciju.';
    } else {
      error.value = `Desila se neočekivana greška: ${err.message}`;
    }
    librarian.value = null;
  } finally {
    loading.value = false;
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    form.value.profile_picture_file = target.files[0];
  } else {
    form.value.profile_picture_file = null;
  }
};

const saveLibrarian = async () => {
  if (!librarian.value) {
    setError('Nema bibliotekara za čuvanje.');
    return;
  }

  loading.value = true;
  error.value = null;
  successMessage.value = null;

  const formData = new FormData();
  formData.append('first_name', form.value.first_name);
  formData.append('last_name', form.value.last_name);
  formData.append('email', form.value.email);
  formData.append('username', form.value.username);
  formData.append('jmbg', form.value.jmbg);
  formData.append('login_count', form.value.login_count.toString());
  formData.append('_method', 'PUT'); // Važno za Laravel ako šalješ PATCH/PUT sa FormData

  if (form.value.profile_picture_file) {
    formData.append('profile_picture', form.value.profile_picture_file);
  }

  try {
    await api.post(`/users/${librarian.value.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    editMode.value = false;
    successMessage.value = 'Podaci bibliotekara uspešno sačuvani!';
    await loadLibrarian();
  } catch (err: any) {
    console.error('Greška pri čuvanju bibliotekara:', err);
    if (err.response) {
      if (err.response.data && err.response.data.errors) {
        error.value = Object.values(err.response.data.errors).flat().join(', ');
      } else {
        error.value = err.response.data?.message || `Greška ${err.response.status}: Neuspešno čuvanje bibliotekara.`;
      }
    } else {
      error.value = `Desila se neočekivana greška: ${err.message}`;
    }
  } finally {
    loading.value = false;
  }
}

const cancelEdit = () => {
  editMode.value = false;
  if (librarian.value) {
    initializeForm(librarian.value);
  }
  successMessage.value = null;
  error.value = null;
}

const setError = (msg: string) => {
  error.value = msg
  successMessage.value = null;
}

const handleEdit = () => {
  editMode.value = true;
  if (librarian.value) {
    initializeForm(librarian.value);
  }
}

const handleDelete = async (deletedItem: Librarian) => {
  if (!deletedItem || !deletedItem.id) {
    setError('Nedostaje ID bibliotekara za brisanje.');
    return;
  }

  loading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    // API poziv za brisanje
    // Ako backend očekuje array ID-jeva za masovno brisanje, ovo je OK.
    // Ako očekuje pojedinačni ID, treba da bude `api.delete(`/users/${deletedItem.id}`)`
    await api.delete(`/users`, { data: { users_id: [deletedItem.id] } });
    successMessage.value = `Bibliotekar "${deletedItem.first_name} ${deletedItem.last_name}" je uspešno obrisan.`;
    router.push('/thelibrarian');
  } catch (err: any) {
    console.error('Greška pri brisanju bibliotekara:', err);
    if (err.response) {
      if (err.response.data && err.response.data.errors) {
        error.value = Object.values(err.response.data.errors).flat().join(', ');
      } else {
        error.value = err.response.data?.message || `Greška ${err.response.status}: Neuspešno brisanje bibliotekara.`;
      }
    } else {
      error.value = `Desila se neočekivana greška: ${err.message}`;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Vaši postojeći stilovi - nema potrebe za izmenama ovde, osim ako ne želiš da dodaješ JMBG stilove */
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
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.student-avatar {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
}

.student-info {
  width: 100%;
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
  display: block;
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

.success-message {
  color: #2e7d32;
  background-color: #e8f5e9;
  border-left: 5px solid #4caf50;
  padding: 12px;
  margin-top: 16px;
  border-radius: 4px;
}
</style>