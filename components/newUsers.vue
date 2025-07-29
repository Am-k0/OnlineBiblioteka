<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header"></header>
    <div class="header-divider"></div>

    <div class="page-content">
      <div class="photo-section">
        <div class="photo-upload-box" @click="triggerFileInput">
          <v-icon v-if="!slikaUrl" size="large" color="#757575">mdi-image</v-icon>
          <input type="file" ref="fileInput" accept="image/*" @change="handleFileUpload" style="display: none">
          <div v-if="!slikaUrl" class="upload-text">Dodajte fotografiju</div>
          <v-img v-if="slikaUrl" :src="slikaUrl" class="image-preview"></v-img>
        </div>
      </div>

      <div class="form-container">
        <v-text-field v-model="firstName" label="Unesite ime..." variant="outlined" hide-details class="form-field"></v-text-field>
        <div v-if="localError.firstName" class="error-message">{{ localError.firstName }}</div>

        <v-text-field v-model="lastName" label="Unesite prezime..." variant="outlined" hide-details class="form-field"></v-text-field>
        <div v-if="localError.lastName" class="error-message">{{ localError.lastName }}</div>

        <v-select
          v-model="selectedRole"
          :items="[computedRoleOption]"
          item-title="name"
          item-value="id"
          label="Odaberite ulogu..."
          variant="outlined"
          hide-details
          class="form-field"
          :disabled="true">
        </v-select>

        <v-text-field
          v-model="jmbg"
          label="Unesite JMBG..."
          variant="outlined"
          hide-details
          class="form-field"
          type="text"
          maxlength="13"
          @keypress="samoBrojevi($event)">
        </v-text-field>
        <div v-if="localError.jmbg" class="error-message">{{ localError.jmbg }}</div>

        <v-text-field v-model="email" label="Unesite e-mail..." variant="outlined" hide-details class="form-field" type="email"></v-text-field>
        <div v-if="localError.email" class="error-message">{{ localError.email }}</div>

        <v-text-field v-model="korisnickoIme" label="Unesite korisničko ime..." variant="outlined" hide-details class="form-field"></v-text-field>
        <div v-if="localError.korisnickoIme" class="error-message">{{ localError.korisnickoIme }}</div>

        <v-text-field
          v-model="password"
          label="Unesite željenu šifru..."
          variant="outlined"
          :type="vidljivoLozinka ? 'text' : 'password'"
          :append-inner-icon="vidljivoLozinka ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="vidljivoLozinka = !vidljivoLozinka"
          hide-details
          class="form-field">
        </v-text-field>
        <div v-if="localError.password" class="error-message">{{ localError.password }}</div>

        <v-text-field
          v-model="ponoviLozinku"
          label="Ponovo unesite šifru..."
          variant="outlined"
          :type="vidljivoPonoviLozinku ? 'text' : 'password'"
          :append-inner-icon="vidljivoPonoviLozinku ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="vidljivoPonoviLozinku = !vidljivoPonoviLozinku"
          hide-details
          class="form-field">
        </v-text-field>
        <div v-if="localError.ponoviLozinku" class="error-message">{{ localError.ponoviLozinku }}</div>

        <div v-if="displayGlobalError" class="error-message">{{ displayGlobalError }}</div>

        <ActionButtons @save="handleSave" @cancel="emit('cancel')" :loading="loading" container-class="mt-4" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue'
import ActionButtons from '@/components/ActionButtons.vue'
import { useRouter } from 'vue-router'
// PROMENA: Uvezi tvoju konfigurisanu Axios instancu sa interceptorima
import api from '@/axios' // PAZI: Proveri da li je putanja do tvog axios.js fajla ispravna!

const router = useRouter()

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  backendErrors: {
    type: Object,
    default: () => ({})
  },
  globalError: {
    type: String,
    default: null
  },
  kolekcija: {
    type: String,
    required: true,
    validator: (value) => ['bibliotekari', 'ucenici'].includes(value)
  }
});

const emit = defineEmits([
  'save',
  'cancel',
  'navigate',
  'form-error'
]);

const slikaUrl = ref('')
const fotografija = ref(null)
const firstName = ref('')
const lastName = ref('')
const jmbg = ref('')
const email = ref('')
const korisnickoIme = ref('')
const password = ref('')
const ponoviLozinku = ref('')
const fileInput = ref(null)
const vidljivoLozinka = ref(false)
const vidljivoPonoviLozinku = ref(false)
const loading = ref(false)

const selectedRole = computed(() => {
  return props.kolekcija === 'bibliotekari' ? 1 : 2; // 1 za bibliotekara, 2 za učenika
});

const computedRoleOption = computed(() => {
  return props.kolekcija === 'bibliotekari'
    ? { id: 1, name: 'Bibliotekar' }
    : { id: 2, name: 'Učenik' };
});

const localError = ref({
  firstName: '', lastName: '', jmbg: '', email: '', korisnickoIme: '', password: '', ponoviLozinku: '', opsta: ''
})

const displayGlobalError = ref(props.globalError);

watch(() => props.globalError, (newVal) => {
  displayGlobalError.value = newVal;
});

const samoBrojevi = (evt) => {
  const charCode = evt.which ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault()
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    console.log('Selected file:', file);
    if (file.size > 5 * 1024 * 1024) { // 5 MB
        alert('Slika je prevelika! Maksimalna veličina je 5MB.');
        fotografija.value = null;
        slikaUrl.value = '';
        console.log('File too large, resetting file inputs.');
        return;
    }
    fotografija.value = file
    slikaUrl.value = URL.createObjectURL(file)
    console.log('Image URL created:', slikaUrl.value);
  } else {
    console.log('No file selected.');
  }
}

const handleSave = async () => {
  console.log('handleSave initiated.');
  localError.value = {
    firstName: '', lastName: '', jmbg: '', email: '', korisnickoIme: '', password: '', ponoviLozinku: '', opsta: ''
  }
  displayGlobalError.value = null;

  let imaGreske = false

  // Frontend validacija (ostaje ista)
  if (!firstName.value) { localError.value.firstName = 'Morate uneti ime!'; imaGreske = true; console.log('Validation Error: firstName missing'); }
  if (!lastName.value) { localError.value.lastName = 'Morate uneti prezime!'; imaGreske = true; console.log('Validation Error: lastName missing'); }
  if (!jmbg.value) {
    localError.value.jmbg = 'Morate uneti JMBG!';
    imaGreske = true;
    console.log('Validation Error: jmbg missing');
  } else if (jmbg.value.length !== 13) {
    localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
    imaGreske = true;
    console.log('Validation Error: jmbg length invalid');
  }
  if (!email.value) { localError.value.email = 'Morate uneti e-mail!'; imaGreske = true; console.log('Validation Error: email missing'); }
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    localError.value.email = 'Unesite validan e-mail format!';
    imaGreske = true;
    console.log('Validation Error: email format invalid');
  }

  if (!korisnickoIme.value) { localError.value.korisnickoIme = 'Morate uneti korisničko ime!'; imaGreske = true; console.log('Validation Error: korisnickoIme missing'); }
  if (!password.value) {
    localError.value.password = 'Morate uneti šifru!';
    imaGreske = true;
    console.log('Validation Error: password missing');
  } else if (password.value.length < 8) {
      localError.value.password = 'Šifra mora imati najmanje 8 karaktera!';
      imaGreske = true;
      console.log('Validation Error: password too short');
  }

  if (password.value !== ponoviLozinku.value) {
    localError.value.ponoviLozinku = 'Šifre se ne poklapaju!'; imaGreske = true; console.log('Validation Error: passwords do not match');
  }

  if (imaGreske) {
    console.log('Frontend validation failed:', localError.value);
    emit('form-error', localError.value);
    return;
  }

  const formData = new FormData();
  formData.append('first_name', firstName.value);
  formData.append('last_name', lastName.value);
  formData.append('email', email.value);
  formData.append('username', korisnickoIme.value);
  formData.append('jmbg', jmbg.value);
  formData.append('password', password.value);
  formData.append('role_id', selectedRole.value);

  if (fotografija.value) {
    formData.append('profile_picture', fotografija.value);
    console.log('Appending profile_picture to FormData.');
  }

  console.log('FormData contents:');
  for (let pair of formData.entries()) {
    console.log(pair[0]+ ': ' + pair[1]);
  }

  // Uklonjene linije za ručno dobijanje tokena i proveru
  // const token = localStorage.getItem('token'); // <<<<<< OVO JE UKLONJENO
  // console.log('Retrieved token from localStorage:', token ? 'Token exists' : 'Token is NULL or EMPTY'); // <<<<<< OVO JE UKLONJENO
  // console.log('Full token value (for debugging, be careful with sensitive info):', token); // <<<<<< OVO JE UKLONJENO
  // if (!token) { /* ... */ } // <<<<<< OVO JE UKLONJENO

  try {
    loading.value = true;
    console.log('Attempting API call to /api/create using configured Axios instance (api)...');
    console.log('Request URL will be derived from baseURL in axios.js + /create');
    console.log('Authorization header will be automatically added by Axios interceptor.');

    // PROMENA: Koristi uvezenu 'api' instancu
    // NEMA POTREBE ZA RUČNIM DODAVANJEM HEADERA OVDE!
    const response = await api.post('/create', formData); // Pozivaj API bez objekta 'headers'

    if (response.status === 201) {
      const createdUser = response.data.user;
      console.log('Korisnik uspješno kreiran:', createdUser);
      console.log('API Response data:', response.data);

      if (props.kolekcija === 'bibliotekari') {
        router.push(`/librarian/${createdUser.username}`);
        console.log(`Redirecting to /librarian/${createdUser.username}`);
      } else {
        router.push(`/student/${createdUser.username}`);
        console.log(`Redirecting to /student/${createdUser.username}`);
      }
    }

  } catch (error) {
    loading.value = false;
    console.error('Greška prilikom kreiranja korisnika - CATCH BLOCK:', error.response || error);
    console.error('Error response:', error.response);

    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);

      if (error.response.status === 400 || error.response.status === 422) {
        const backendErrors = error.response.data;
        console.log('Backend validation errors (400/422):', backendErrors);

        if (typeof backendErrors === 'object' && backendErrors !== null) {
          if (backendErrors.jmbg) {
            localError.value.jmbg = backendErrors.jmbg[0];
            if (backendErrors.jmbg.includes("The jmbg field format is invalid.")) {
                localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
            } else if (backendErrors.jmbg.includes("The jmbg has already been taken.")) {
                localError.value.jmbg = 'JMBG je već zauzet!';
            }
          }
          if (backendErrors.email) {
            localError.value.email = backendErrors.email[0];
             if (backendErrors.email.includes("The email has already been taken.")) {
                localError.value.email = 'E-mail je već zauzet!';
            }
          }
          if (backendErrors.username) {
            localError.value.korisnickoIme = backendErrors.username[0];
            if (backendErrors.username.includes("The username has already been taken.")) {
                localError.value.korisnickoIme = 'Korisničko ime je već zauzeto!';
            }
          }
          if (backendErrors.password) {
              localError.value.password = backendErrors.password[0];
          }
          if (backendErrors.error) {
            displayGlobalError.value = backendErrors.error;
          }
        } else {
          displayGlobalError.value = 'Došlo je do greške prilikom obrade podataka. Proverite unete podatke.';
        }
      } else if (error.response.status === 401) {
          displayGlobalError.value = 'Niste autorizovani. Vaša sesija je istekla ili nemate potrebne dozvole.';
          console.error('Authentication Error: 401 Unauthorized.');
          // Opciono: router.push('/login'); // Preusmeri na login ako je token istekao
      } else if (error.response.status === 403) {
          displayGlobalError.value = 'Nemate dozvolu za kreiranje korisnika. Morate biti bibliotekar.';
          console.error('Authorization Error: 403 Forbidden.');
      } else {
        displayGlobalError.value = `Došlo je do nepoznate greške (${error.response.status}). Pokušajte ponovo.`;
        console.error('Unhandled HTTP Error:', error.response.status);
      }
    } else {
      displayGlobalError.value = 'Nije moguće povezati se sa serverom. Proverite svoju internet vezu ili pokušajte kasnije.';
      console.error('Network or Server Error:', error.message);
    }
    emit('form-error', localError.value);
  } finally {
    loading.value = false;
    console.log('handleSave finished. Loading set to false.');
  }
}

watch(() => props.backendErrors, (newErrors) => {
  console.log('Watching props.backendErrors, new errors:', newErrors);
  if (newErrors.jmbg) {
    if (newErrors.jmbg.includes("The jmbg field format is invalid.")) {
        localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
    } else if (newErrors.jmbg.includes("The jmbg has already been taken.")) {
        localError.value.jmbg = 'JMBG je već zauzet!';
    }
    console.log('JMBG error from backend:', localError.value.jmbg);
  }
  if (newErrors.email && newErrors.email.includes("The email has already been taken.")) {
    localError.value.email = 'E-mail je već zauzet!';
    console.log('Email error from backend:', localError.value.email);
  }
  if (newErrors.username && newErrors.username.includes("The username has already been taken.")) {
    localError.value.korisnickoIme = 'Korisničko ime je već zauzeto!';
    console.log('Username error from backend:', localError.value.korisnickoIme);
  }
  if (newErrors.password) {
      localError.value.password = newErrors.password[0];
      console.log('Password error from backend:', localError.value.password);
  }
}, { deep: true });
</script>


<style scoped>
/* Vaš CSS ostaje nepromenjen */
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
}

.photo-section {
  margin-bottom: 24px;
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