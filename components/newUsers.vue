<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header"></header>
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
})

const emit = defineEmits(['save', 'cancel', 'navigate', 'form-error'])

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
  return props.kolekcija === 'ucenici' ? 1 : 2
})

const computedRoleOption = computed(() => {
  return props.kolekcija === 'ucenici'
    ? { id: 1, name: 'Učenik' }
    : { id: 2, name: 'Bibliotekar' }
})

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

const displayGlobalError = ref(props.globalError)


watch(() => props.globalError, (newVal) => {
  displayGlobalError.value = newVal
})

watch(() => props.backendErrors, (newErrors) => {
  if (newErrors && Object.keys(newErrors).length > 0) {
    localError.value = {
      firstName: newErrors.first_name?.[0] || '',
      lastName: newErrors.last_name?.[0] || '',
      jmbg: newErrors.jmbg?.[0] || '',
      email: newErrors.email?.[0] || '',
      korisnickoIme: newErrors.username?.[0] || '',
      password: newErrors.password?.[0] || '',
      ponoviLozinku: '',
      opsta: newErrors.profile_picture?.[0] || ''
    }
  }
}, { deep: true })

// unos jmbg
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
  }
  displayGlobalError.value = null
}

const validateForm = () => {
  let hasErrors = false
  
  clearErrors()

  if (!firstName.value.trim()) {
    localError.value.firstName = 'Morate uneti ime!'
    hasErrors = true
  }

  if (!lastName.value.trim()) {
    localError.value.lastName = 'Morate uneti prezime!'
    hasErrors = true
  }

  if (!jmbg.value.trim()) {
    localError.value.jmbg = 'Morate uneti JMBG!'
    hasErrors = true
  } else if (jmbg.value.length !== 13) {
    localError.value.jmbg = 'JMBG mora imati tačno 13 cifara!'
    hasErrors = true
  }

  if (!email.value.trim()) {
    localError.value.email = 'Morate uneti e-mail!'
    hasErrors = true
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    localError.value.email = 'Unesite validan e-mail format!'
    hasErrors = true
  }

  if (!korisnickoIme.value.trim()) {
    localError.value.korisnickoIme = 'Morate uneti korisničko ime!'
    hasErrors = true
  }

  if (!password.value) {
    localError.value.password = 'Morate uneti šifru!'
    hasErrors = true
  } else if (password.value.length < 8) {
    localError.value.password = 'Šifra mora imati najmanje 8 karaktera!'
    hasErrors = true
  }

  if (password.value !== ponoviLozinku.value) {
    localError.value.ponoviLozinku = 'Šifre se ne poklapaju!'
    hasErrors = true
  }

  return !hasErrors
}

const handleSave = async () => {
  if (!validateForm()) {
    emit('form-error', localError.value)
    return
  }

 // Priprema podataka za slanje
  const formData = new FormData()
  formData.append('first_name', firstName.value.trim())
  formData.append('last_name', lastName.value.trim())
  formData.append('email', email.value.trim())
  formData.append('username', korisnickoIme.value.trim())
  formData.append('jmbg', jmbg.value.trim())
  formData.append('password', password.value)
  formData.append('role_id', selectedRole.value)

  if (fotografija.value) {
    formData.append('profile_picture', fotografija.value)
  }

  try {
    loading.value = true
    
 
    const response = await api.post('/users/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.status === 201) {
      const createdUser = response.data.data
      
    
      firstName.value = ''
      lastName.value = ''
      jmbg.value = ''
      email.value = ''
      korisnickoIme.value = ''
      password.value = ''
      ponoviLozinku.value = ''
      fotografija.value = null
      slikaUrl.value = ''
      
      if (fileInput.value) {
        fileInput.value.value = ''
      }

      
      router.push(`/users/${createdUser.username}`)
    }

  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error.response) {
      if (error.response.status === 422) {
       
        const backendErrors = error.response.data.errors
        localError.value = {
          firstName: backendErrors.first_name?.[0] || '',
          lastName: backendErrors.last_name?.[0] || '',
          jmbg: backendErrors.jmbg?.[0] || '',
          email: backendErrors.email?.[0] || '',
          korisnickoIme: backendErrors.username?.[0] || '',
          password: backendErrors.password?.[0] || '',
          opsta: backendErrors.profile_picture?.[0] || ''
        }
      } else if (error.response.status === 401) {
        displayGlobalError.value = 'Niste autorizovani. Vaša sesija je istekla.'
      } else if (error.response.status === 403) {
        displayGlobalError.value = 'Nemate dozvolu za kreiranje korisnika.'
      } else {
        displayGlobalError.value = `Došlo je do greške (${error.response.status})`
      }
    } else if (error.request) {
      displayGlobalError.value = 'Nije moguće povezati se sa serverom.'
    } else {
      displayGlobalError.value = 'Došlo je do neočekivane greške.'
    }
    
    emit('form-error', localError.value)
  } finally {
    loading.value = false
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
  margin-left: -23px;
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
  margin-left: -23px;
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

.v-text-field--error .v-field__outline {
  border-color: #ff5252 !important;
}

.v-text-field--error .v-field__outline:hover {
  border-color: #ff5252 !important;
}
</style>