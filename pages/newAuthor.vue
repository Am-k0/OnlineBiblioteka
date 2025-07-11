<template>
  <div class="form-container">
    <div class="header">
      <h1>Novi Autor</h1>
      <div class="breadcrumbs">
        <a href="/authors">Evidencija autora</a>
        <span>/ Novi Autor</span>
      </div>
    </div>

    <div class="photo-section">
      <div class="photo-upload-box" @click="triggerFileInput">
        <v-icon v-if="!imageUrl" size="large" color="#757575">mdi-image</v-icon>
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          @change="handleFileUpload"
          style="display: none"
        >
        <div v-if="!imageUrl" class="upload-text">Add photo</div>
        <v-img
          v-if="imageUrl"
          :src="imageUrl"
          class="image-preview"
        ></v-img>
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

    <v-textarea
      v-model="description"
      label="Unesite Opis..."
      variant="outlined"
      hide-details
      class="form-field"
    ></v-textarea>

    <div class="buttons">
      <v-btn
        color="primary"
        class="save-btn"
        @click="saveAuthor"
        :loading="loading"
      >
        Sačuvaj
      </v-btn>

      <v-btn
        variant="outlined"
        class="cancel-btn"
        @click="cancel"
      >
        Poništi
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const photo = ref(null)
const imageUrl = ref('')
const firstName = ref('')
const lastName = ref('')
const description = ref('')
const fileInput = ref(null)
const errors = ref({
  firstName: '',
  lastName: ''
})
const loading = ref(false)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    photo.value = file
    imageUrl.value = URL.createObjectURL(file)
  }
}

const saveAuthor = async () => {
  errors.value = {
    firstName: '',
    lastName: ''
  }

  if (!firstName.value) errors.value.firstName = 'Morate unijeti ime!'
  if (!lastName.value) errors.value.lastName = 'Morate unijeti prezime!'

  if (!firstName.value || !lastName.value) return

  try {
    loading.value = true

    const formData = new FormData()
    formData.append('first_name', firstName.value)
    formData.append('last_name', lastName.value)
    formData.append('biography', description.value)
    if (photo.value) {
      formData.append('picture', photo.value)
    }

    // Dodaj token ako je potreban za autentifikaciju
    const token = localStorage.getItem('auth_token')

    const response = await axios.post(
      'http://localhost/api/authors/create',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    )

    // Backend vraća "author": {...}
    if (response.data && response.data.author && response.data.author.id) {
      router.push(`/author/${response.data.author.id}`)
    } else {
      throw new Error('Server nije vratio ID novog autora.')
    }
  } catch (error) {
    console.error('Greška pri čuvanju autora:', error)
    const errorMessage =
      error.response?.data?.error
        ? Object.values(error.response.data.error).flat().join(' ')
        : error.response?.data?.message || error.message
    alert('Došlo je do greške pri čuvanju autora: ' + errorMessage)
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  firstName.value = ''
  lastName.value = ''
  description.value = ''
  photo.value = null
  imageUrl.value = ''
  errors.value = {
    firstName: '',
    lastName: ''
  }
}
</script>

<style scoped>
.form-container {
  max-width: 724px;
  padding: 24px;
  margin: 0;
}
.header {
  margin-bottom: 32px;
}
.header h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #212121;
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
}
.breadcrumbs a {
  color: #3392EA;
  text-decoration: none;
}
.breadcrumbs a:hover {
  text-decoration: underline;
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
.form-field {
  margin-bottom: 16px;
  max-width: 463px;
}
.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}
.buttons {
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  margin-top: 24px;
}
.cancel-btn {
  border: 1px solid #3392EA;
  color: #3392EA;
  width: 120px;
}
.save-btn {
  width: 120px;
}
</style>
