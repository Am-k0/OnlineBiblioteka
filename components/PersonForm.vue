<template>
  <div class="photo-section">
    <div class="photo-upload-box" @click="triggerFileInput">
      <v-icon v-if="!imageUrl" size="large" color="#757575">mdi-image</v-icon>
      <input type="file" ref="fileInput" accept="image/*" @change="handleFileUpload" style="display: none">
      <div v-if="!imageUrl" class="upload-text">Add photo</div>
      <v-img v-if="imageUrl" :src="imageUrl" class="image-preview"></v-img>
    </div>
  </div>

  <v-text-field
    v-model="firstName"
    label="Unesite Ime..."
    variant="outlined"
    hide-details
    class="form-field"
  ></v-text-field>
  <div v-if="errors.firstName" class="error-message">{{ errors.firstName }}</div>

  <v-text-field
    v-model="lastName"
    label="Unesite Prezime..."
    variant="outlined"
    hide-details
    class="form-field"
  ></v-text-field>
  <div v-if="errors.lastName" class="error-message">{{ errors.lastName }}</div>

  <v-text-field
    v-model="jmbg"
    label="Unesite JMBG..."
    variant="outlined"
    hide-details
    class="form-field"
    type="number"
    @keypress="isNumber($event)"
  ></v-text-field>
  <div v-if="errors.jmbg" class="error-message">{{ errors.jmbg }}</div>

  <v-text-field
    v-model="email"
    label="Unesite E-mail..."
    variant="outlined"
    hide-details
    class="form-field"
    type="email"
  ></v-text-field>
  <div v-if="errors.email" class="error-message">{{ errors.email }}</div>

  <v-text-field
    v-model="username"
    label="Unesite korisničko ime..."
    variant="outlined"
    hide-details
    class="form-field"
  ></v-text-field>
  <div v-if="errors.username" class="error-message">{{ errors.username }}</div>

  <v-text-field
    v-model="password"
    label="Unesite željenu šifru..."
    variant="outlined"
    :type="visible ? 'text' : 'password'"
    :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
    @click:append-inner="visible = !visible"
    hide-details
    class="form-field"
  ></v-text-field>
  <div v-if="errors.password" class="error-message">{{ errors.password }}</div>

  <v-text-field
    v-model="repeatPassword"
    label="Ponovo unesite šifru..."
    variant="outlined"
    :type="visible ? 'text' : 'password'"
    hide-details
    class="form-field"
  ></v-text-field>
  <div v-if="errors.repeatPassword" class="error-message">{{ errors.repeatPassword }}</div>

  <ActionButtons 
    @save="saveStudent" 
    @cancel="cancel"
    :loading="isSaving"
    container-class="mt-4"
  />
</template>

<script setup>
import { ref } from 'vue'
import ActionButtons from '@/components/ActionButtons.vue'

const photo = ref(null)
const imageUrl = ref('')
const firstName = ref('')
const lastName = ref('')
const jmbg = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const repeatPassword = ref('')
const fileInput = ref(null)
const visible = ref(false)
const isSaving = ref(false)

const errors = ref({
  firstName: '',
  lastName: '',
  jmbg: '',
  email: '',
  username: '',
  password: '',
  repeatPassword: ''
})

const isNumber = (evt) => {
  evt = evt || window.event
  const charCode = evt.which ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault()
  }
}

const triggerFileInput = () => fileInput.value.click()

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    photo.value = file
    imageUrl.value = URL.createObjectURL(file)
  }
}

const saveStudent = async () => {
  errors.value = {
    firstName: '',
    lastName: '',
    jmbg: '',
    email: '',
    username: '',
    password: '',
    repeatPassword: ''
  }

  let hasErrors = false

  if (!firstName.value) { errors.value.firstName = 'Morate unijeti ime!'; hasErrors = true }
  if (!lastName.value) { errors.value.lastName = 'Morate unijeti prezime!'; hasErrors = true }
  if (!jmbg.value) { errors.value.jmbg = 'Morate unijeti JMBG!'; hasErrors = true }
  if (!email.value) { errors.value.email = 'Morate unijeti e-mail!'; hasErrors = true }
  if (!username.value) { errors.value.username = 'Morate unijeti korisničko ime!'; hasErrors = true }
  if (!password.value) { errors.value.password = 'Morate unijeti šifru!'; hasErrors = true }
  if (!repeatPassword.value) { errors.value.repeatPassword = 'Morate ponoviti unos šifre!'; hasErrors = true }
  if (password.value && repeatPassword.value && password.value !== repeatPassword.value) {
    errors.value.repeatPassword = 'Šifre se ne poklapaju!'; hasErrors = true
  }

  if (!hasErrors) {
    isSaving.value = true
    try {
      console.log('Učenik sačuvan', {
        photo: photo.value,
        firstName: firstName.value,
        lastName: lastName.value,
        jmbg: jmbg.value,
        email: email.value,
        username: username.value,
        password: password.value
      })
      // Simulacija API poziva
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      isSaving.value = false
    }
  }
}

const cancel = () => {
  photo.value = null
  imageUrl.value = ''
  firstName.value = ''
  lastName.value = ''
  jmbg.value = ''
  email.value = ''
  username.value = ''
  password.value = ''
  repeatPassword.value = ''
  errors.value = {
    firstName: '',
    lastName: '',
    jmbg: '',
    email: '',
    username: '',
    password: '',
    repeatPassword: ''
  }
}
</script>

<style scoped>
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
.form-field {
  margin-bottom: 16px;
}
.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}
</style>