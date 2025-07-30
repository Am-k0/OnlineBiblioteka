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
        <v-text-field 
          v-model="firstName" 
          label="Unesite ime..." 
          variant="outlined" 
          hide-details 
          class="form-field"
          :error="!!localError.firstName"
        ></v-text-field>
        <div v-if="localError.firstName" class="error-message">{{ localError.firstName }}</div>

        <v-text-field 
          v-model="lastName" 
          label="Unesite prezime..." 
          variant="outlined" 
          hide-details 
          class="form-field"
          :error="!!localError.lastName"
        ></v-text-field>
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
          :error="!!localError.jmbg"
          @keypress="samoBrojevi($event)">
        </v-text-field>
        <div v-if="localError.jmbg" class="error-message">{{ localError.jmbg }}</div>

        <v-text-field 
          v-model="email" 
          label="Unesite e-mail..." 
          variant="outlined" 
          hide-details 
          class="form-field" 
          type="email"
          :error="!!localError.email"
        ></v-text-field>
        <div v-if="localError.email" class="error-message">{{ localError.email }}</div>

        <v-text-field 
          v-model="korisnickoIme" 
          label="Unesite korisničko ime..." 
          variant="outlined" 
          hide-details 
          class="form-field"
          :error="!!localError.korisnickoIme"
        ></v-text-field>
        <div v-if="localError.korisnickoIme" class="error-message">{{ localError.korisnickoIme }}</div>

        <v-text-field
          v-model="password"
          label="Unesite željenu šifru..."
          variant="outlined"
          :type="vidljivoLozinka ? 'text' : 'password'"
          :append-inner-icon="vidljivoLozinka ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="vidljivoLozinka = !vidljivoLozinka"
          hide-details
          class="form-field"
          :error="!!localError.password">
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
          class="form-field"
          :error="!!localError.ponoviLozinku">
        </v-text-field>
        <div v-if="localError.ponoviLozinku" class="error-message">{{ localError.ponoviLozinku }}</div>

        <div v-if="displayGlobalError" class="error-message global-error">{{ displayGlobalError }}</div>

        <ActionButtons 
          @save="handleSave" 
          @cancel="emit('cancel')" 
          :loading="loading" 
          container-class="mt-4" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue'
import ActionButtons from '@/components/ActionButtons.vue'
import { useRouter } from 'vue-router'
import api from '@/axios'

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

// Reactive data
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
  return props.kolekcija === 'ucenici' ? 1 : 2; // Učenici = 1, Bibliotekari = 2
});

const computedRoleOption = computed(() => {
  return props.kolekcija === 'ucenici'
    ? { id: 1, name: 'Učenik' }
    : { id: 2, name: 'Bibliotekar' };
});

const localError = ref({
  firstName: '',
  lastName: '',
  jmbg: '',
  email: '',
  korisnickoIme: '',
  password: '',
  ponoviLozinku: '',
  opsta: ''
})

const displayGlobalError = ref(props.globalError);

// Watchers
watch(() => props.globalError, (newVal) => {
  displayGlobalError.value = newVal;
});

watch(() => props.backendErrors, (newErrors) => {
  if (newErrors && Object.keys(newErrors).length > 0) {
    console.log('Backend errors received:', newErrors);
    
    // Reset local errors
    localError.value = {
      firstName: '',
      lastName: '',
      jmbg: '',
      email: '',
      korisnickoIme: '',
      password: '',
      ponoviLozinku: '',
      opsta: ''
    };

    // Map backend errors to local errors
    if (newErrors.first_name) {
      localError.value.firstName = Array.isArray(newErrors.first_name) 
        ? newErrors.first_name[0] 
        : newErrors.first_name;
    }
    
    if (newErrors.last_name) {
      localError.value.lastName = Array.isArray(newErrors.last_name) 
        ? newErrors.last_name[0] 
        : newErrors.last_name;
    }
    
    if (newErrors.jmbg) {
      const jmbgError = Array.isArray(newErrors.jmbg) ? newErrors.jmbg[0] : newErrors.jmbg;
      if (jmbgError.includes("format is invalid") || jmbgError.includes("regex")) {
        localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
      } else if (jmbgError.includes("already been taken")) {
        localError.value.jmbg = 'JMBG je već zauzet!';
      } else {
        localError.value.jmbg = jmbgError;
      }
    }
    
    if (newErrors.email) {
      const emailError = Array.isArray(newErrors.email) ? newErrors.email[0] : newErrors.email;
      if (emailError.includes("already been taken")) {
        localError.value.email = 'E-mail je već zauzet!';
      } else {
        localError.value.email = emailError;
      }
    }
    
    if (newErrors.username) {
      const usernameError = Array.isArray(newErrors.username) ? newErrors.username[0] : newErrors.username;
      if (usernameError.includes("already been taken")) {
        localError.value.korisnickoIme = 'Korisničko ime je već zauzeto!';
      } else {
        localError.value.korisnickoIme = usernameError;
      }
    }
    
    if (newErrors.password) {
      localError.value.password = Array.isArray(newErrors.password) 
        ? newErrors.password[0] 
        : newErrors.password;
    }
  }
}, { deep: true });

// Methods
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
    
    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Slika je prevelika! Maksimalna veličina je 5MB.');
      fotografija.value = null;
      slikaUrl.value = '';
      e.target.value = ''; // Reset file input
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Neispravna vrsta datoteke! Dozvoljena su samo JPEG, PNG, JPG i GIF slika.');
      fotografija.value = null;
      slikaUrl.value = '';
      e.target.value = ''; // Reset file input
      return;
    }

    fotografija.value = file
    slikaUrl.value = URL.createObjectURL(file)
    console.log('Image URL created:', slikaUrl.value);
  }
}

const clearErrors = () => {
  localError.value = {
    firstName: '',
    lastName: '',
    jmbg: '',
    email: '',
    korisnickoIme: '',
    password: '',
    ponoviLozinku: '',
    opsta: ''
  };
  displayGlobalError.value = null;
}

const validateForm = () => {
  let hasErrors = false;
  
  // Clear previous errors
  clearErrors();

  // Frontend validation
  if (!firstName.value.trim()) {
    localError.value.firstName = 'Morate uneti ime!';
    hasErrors = true;
  }

  if (!lastName.value.trim()) {
    localError.value.lastName = 'Morate uneti prezime!';
    hasErrors = true;
  }

  if (!jmbg.value.trim()) {
    localError.value.jmbg = 'Morate uneti JMBG!';
    hasErrors = true;
  } else if (jmbg.value.length !== 13) {
    localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
    hasErrors = true;
  }

  if (!email.value.trim()) {
    localError.value.email = 'Morate uneti e-mail!';
    hasErrors = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    localError.value.email = 'Unesite validan e-mail format!';
    hasErrors = true;
  }

  if (!korisnickoIme.value.trim()) {
    localError.value.korisnickoIme = 'Morate uneti korisničko ime!';
    hasErrors = true;
  }

  if (!password.value) {
    localError.value.password = 'Morate uneti šifru!';
    hasErrors = true;
  } else if (password.value.length < 8) {
    localError.value.password = 'Šifra mora imati najmanje 8 karaktera!';
    hasErrors = true;
  }

  if (password.value !== ponoviLozinku.value) {
    localError.value.ponoviLozinku = 'Šifre se ne poklapaju!';
    hasErrors = true;
  }

  return !hasErrors;
}

const handleSave = async () => {
  console.log('handleSave initiated.');
  
  // Validate form
  if (!validateForm()) {
    console.log('Frontend validation failed:', localError.value);
    emit('form-error', localError.value);
    return;
  }

  // Prepare FormData
  const formData = new FormData();
  formData.append('first_name', firstName.value.trim());
  formData.append('last_name', lastName.value.trim());
  formData.append('email', email.value.trim());
  formData.append('username', korisnickoIme.value.trim());
  formData.append('jmbg', jmbg.value.trim());
  formData.append('password', password.value);
  formData.append('role_id', selectedRole.value);

  if (fotografija.value) {
    formData.append('profile_picture', fotografija.value);
    console.log('Profile picture added to FormData');
  }

  // Debug FormData
  console.log('FormData contents:');
  for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
  }

  try {
    loading.value = true;
    console.log('Making API request to /create...');

    const response = await api.post('/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 201) {
      const createdUser = response.data.data;
      console.log('Korisnik uspešno kreiran:', createdUser);

      // Clear form
      firstName.value = '';
      lastName.value = '';
      jmbg.value = '';
      email.value = '';
      korisnickoIme.value = '';
      password.value = '';
      ponoviLozinku.value = '';
      fotografija.value = null;
      slikaUrl.value = '';
      
      // Clear file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }

      // Navigate to user profile
      if (props.kolekcija === 'bibliotekari') {
        router.push(`/thelibrarian/${createdUser.username}`);
      } else {
        router.push(`/students/${createdUser.username}`);
      }
    }

  } catch (error) {
    console.error('Error creating user:', error);

    if (error.response) {
      console.error('Error response:', error.response.data);
      
      if (error.response.status === 422) {
        // Validation errors
        const backendErrors = error.response.data.errors;
        console.log('Backend validation errors:', backendErrors);
        
        // Map backend errors to local errors
        if (backendErrors.first_name) {
          localError.value.firstName = Array.isArray(backendErrors.first_name) 
            ? backendErrors.first_name[0] 
            : backendErrors.first_name;
        }
        
        if (backendErrors.last_name) {
          localError.value.lastName = Array.isArray(backendErrors.last_name) 
            ? backendErrors.last_name[0] 
            : backendErrors.last_name;
        }
        
        if (backendErrors.jmbg) {
          const jmbgError = Array.isArray(backendErrors.jmbg) ? backendErrors.jmbg[0] : backendErrors.jmbg;
          if (jmbgError.includes("format is invalid") || jmbgError.includes("regex")) {
            localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
          } else if (jmbgError.includes("already been taken")) {
            localError.value.jmbg = 'JMBG je već zauzet!';
          } else {
            localError.value.jmbg = jmbgError;
          }
        }
        
        if (backendErrors.email) {
          const emailError = Array.isArray(backendErrors.email) ? backendErrors.email[0] : backendErrors.email;
          if (emailError.includes("already been taken")) {
            localError.value.email = 'E-mail je već zauzet!';
          } else {
            localError.value.email = emailError;
          }
        }
        
        if (backendErrors.username) {
          const usernameError = Array.isArray(backendErrors.username) ? backendErrors.username[0] : backendErrors.username;
          if (usernameError.includes("already been taken")) {
            localError.value.korisnickoIme = 'Korisničko ime je već zauzeto!';
          } else {
            localError.value.korisnickoIme = usernameError;
          }
        }
        
        if (backendErrors.password) {
          localError.value.password = Array.isArray(backendErrors.password) 
            ? backendErrors.password[0] 
            : backendErrors.password;
        }
        
        if (backendErrors.profile_picture) {
          displayGlobalError.value = Array.isArray(backendErrors.profile_picture) 
            ? backendErrors.profile_picture[0] 
            : backendErrors.profile_picture;
        }
        
      } else if (error.response.status === 401) {
        displayGlobalError.value = 'Niste autorizovani. Vaša sesija je istekla ili nemate potrebne dozvole.';
        console.error('Authentication Error: 401 Unauthorized.');
        // Možete dodati redirekciju na login
        // router.push('/login');
        
      } else if (error.response.status === 403) {
        displayGlobalError.value = 'Nemate dozvolu za kreiranje korisnika. Morate biti bibliotekar.';
        console.error('Authorization Error: 403 Forbidden.');
        
      } else if (error.response.status === 500) {
        displayGlobalError.value = 'Došlo je do greške na serveru. Pokušajte ponovo.';
        console.error('Server Error: 500 Internal Server Error.');
        
      } else {
        displayGlobalError.value = `Došlo je do nepoznate greške (${error.response.status}). Pokušajte ponovo.`;
        console.error('Unhandled HTTP Error:', error.response.status);
      }
      
    } else if (error.request) {
      displayGlobalError.value = 'Nije moguće povezati se sa serverom. Proverite svoju internet vezu.';
      console.error('Network Error:', error.request);
      
    } else {
      displayGlobalError.value = 'Došlo je do neočekivane greške. Pokušajte ponovo.';
      console.error('Unknown Error:', error.message);
    }

    emit('form-error', localError.value);
    
  } finally {
    loading.value = false;
    console.log('handleSave finished. Loading set to false.');
  }
}
</script>

<style scoped>
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
  transition: border-color 0.3s ease;
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

.global-error {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

/* Dodatni stilovi za error state u poljima */
.v-text-field--error .v-field__outline {
  border-color: #ff5252 !important;
}

.v-text-field--error .v-field__outline:hover {
  border-color: #ff5252 !important;
}
</style>