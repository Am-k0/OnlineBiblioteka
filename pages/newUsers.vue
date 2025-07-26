<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Novi Korisnik</h1>
        <p class="page-subtitle">
          <span class="link" @click="emit('navigate', '/users')">Svi Korisnici</span> / Novi Korisnik
        </p>
      </div>
    </header>
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
          :items="roleOptions"
          item-title="name"
          item-value="id"
          label="Odaberite ulogu..."
          variant="outlined"
          hide-details
          class="form-field"
        ></v-select>

        <v-text-field
          v-model="jmbg"
          label="Unesite JMBG..."
          variant="outlined"
          hide-details
          class="form-field"
          type="text"
          maxlength="13"
          @keypress="samoBrojevi($event)"
        ></v-text-field>
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
          class="form-field"
        ></v-text-field>
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
        ></v-text-field>
        <div v-if="localError.ponoviLozinku" class="error-message">{{ localError.ponoviLozinku }}</div>
        
        <div v-if="displayGlobalError" class="error-message">{{ displayGlobalError }}</div>

        <ActionButtons @save="handleSave" @cancel="emit('cancel')" :loading="loading" container-class="mt-4" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import ActionButtons from '@/components/ActionButtons.vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  // Prop za greške koje dolaze iz roditeljske komponente (npr. sa servera)
  backendErrors: {
    type: Object,
    default: () => ({})
  },
  globalError: {
    type: String,
    default: null
  }
});

const emit = defineEmits([
  'save',       // Emituje se kada se forma validira i spremna je za slanje
  'cancel',     // Emituje se kada se klikne na "Odustani"
  'navigate',   // Emituje se za navigaciju (npr. "/users")
  'form-error'  // Emituje se za greške u validaciji na frontendu
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

const selectedRole = ref(2); // Inicijalno postavi na ID za Učenika (pretpostavljamo da je 2)

// Opcije za uloge (možda bi ovo trebalo da dođe kao prop ako je dinamično)
const roleOptions = ref([
  { id: 2, name: 'Učenik' },
  { id: 1, name: 'Bibliotekar' }
]);

const localError = ref({
  firstName: '', lastName: '', jmbg: '', email: '', korisnickoIme: '', password: '', ponoviLozinku: '', opsta: ''
})

// Prikazuje grešku koja dolazi iz backend-a ili opštu grešku iz prop-a
const displayGlobalError = ref(props.globalError);

// Watcher za globalError prop
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
    fotografija.value = file
    slikaUrl.value = URL.createObjectURL(file)
  }
}

const handleSave = () => {
  // Resetuj lokalne greške pre validacije
  localError.value = {
    firstName: '', lastName: '', jmbg: '', email: '', korisnickoIme: '', password: '', ponoviLozinku: '', opsta: ''
  }
  displayGlobalError.value = null; // Clear global error on new save attempt

  let imaGreske = false

  // Klijentska validacija
  if (!firstName.value) { localError.value.firstName = 'Morate uneti ime!'; imaGreske = true }
  if (!lastName.value) { localError.value.lastName = 'Morate uneti prezime!'; imaGreske = true }
  if (!jmbg.value) {
    localError.value.jmbg = 'Morate uneti JMBG!';
    imaGreske = true;
  } else if (jmbg.value.length !== 13) {
    localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!';
    imaGreske = true;
  }
  if (!email.value) { localError.value.email = 'Morate uneti e-mail!'; imaGreske = true }
  if (!korisnickoIme.value) { localError.value.korisnickoIme = 'Morate uneti korisničko ime!'; imaGreske = true }
  if (!password.value) { localError.value.password = 'Morate uneti šifru!'; imaGreske = true }
  if (password.value !== ponoviLozinku.value) {
    localError.value.ponoviLozinku = 'Šifre se ne poklapaju!'; imaGreske = true
  }

  if (imaGreske) {
    // Emituj greške validacije forme na frontendu
    emit('form-error', localError.value);
    return;
  }

  // Ako nema lokalnih grešaka, pripremi podatke i emituj 'save' događaj
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
  }
  
  emit('save', formData); // Emituj FormData objekat
}

// Watcher za backendErrors prop - da bi se greške sa servera prikazale u lokalnim greškama
watch(() => props.backendErrors, (newErrors) => {
    if (newErrors.jmbg && newErrors.jmbg.includes("The jmbg field format is invalid.")) {
        localError.value.jmbg = 'JMBG mora imati tačno 13 cifara i biti jedinstven!';
    } else if (newErrors.email && newErrors.email.includes("The email has already been taken.")) {
        localError.value.email = 'E-mail je već zauzet!';
    } else if (newErrors.username && newErrors.username.includes("The username has already been taken.")) {
        localError.value.korisnickoIme = 'Korisničko ime je već zauzeto!';
    }
    // Dodajte logiku za ostale backend greške ako je potrebno
}, { deep: true });

// Nije više potrebno onMounted(() => { selectedRole.value = 'Učenik' }) jer je inicijalizovan sa 2.
</script>

<style scoped>
/* Vaši stilovi ostaju potpuno isti */
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
  border: 1px dashed #BDBDBD;
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