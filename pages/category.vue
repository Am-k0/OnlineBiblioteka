<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Nova Kategorija</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'kategorija' } })">Kategorije</span> / Nova Kategorija
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="form-section">
        <div class="input-and-icon-row">
          <v-text-field
            v-model="name"
            label="Unesite Naziv Kategorije..."
            variant="outlined"
            hide-details
            class="form-field-name"
            :error="!!errors.name"
          ></v-text-field>
          <div
            class="photo-upload-box"
            @click="triggerFileInput"
            :class="{ 'has-icon': iconUrl }"
          >
            <v-icon v-if="!iconUrl" size="large" color="#757575">mdi-image</v-icon>
            <span v-if="!iconUrl" class="upload-text">Add icon</span>
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              @change="handleFileUpload"
              style="display: none"
            />
            <v-img v-if="iconUrl" :src="iconUrl" class="image-preview"></v-img>
          </div>
        </div>
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>

        <v-textarea
          v-model="description"
          label="Unesite Opis..."
          variant="outlined"
          hide-details
          class="form-field-description"
          :error="!!errors.description"
        ></v-textarea>
        <div v-if="errors.description" class="error-message">{{ errors.description }}</div>
        <div v-if="errors.icon" class="error-message">{{ errors.icon }}</div>

        <div class="buttons">
          <v-btn color="primary" class="save-btn" @click="saveCategory" :loading="loading">
            Sačuvaj
          </v-btn>

          <v-btn variant="outlined" class="cancel-btn" @click="cancel"> Poništi </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const icon = ref(null);
const iconUrl = ref('');
const name = ref('');
const description = ref('');
const fileInput = ref(null);
const errors = ref({
  name: '',
  description: '',
  icon: ''
});
const loading = ref(false);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file size (5MB = 5120KB)
    if (file.size > 5120 * 1024) {
      errors.value.icon = 'Ikona mora biti manja od 5MB!';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      errors.value.icon = 'Fajl mora biti slika!';
      return;
    }
    
    errors.value.icon = '';
    icon.value = file;
    iconUrl.value = URL.createObjectURL(file);
  }
};

const saveCategory = async () => {
  // Reset errors
  errors.value = {
    name: '',
    description: '',
    icon: ''
  };

  // Client-side validation
  let hasErrors = false;
  
  if (!name.value.trim()) {
    errors.value.name = 'Morate unijeti naziv kategorije!';
    hasErrors = true;
  }
  
  if (!description.value.trim()) {
    errors.value.description = 'Morate unijeti opis!';
    hasErrors = true;
  }

  if (hasErrors) return;

  try {
    loading.value = true;

    // First create the category without the icon
    const token = localStorage.getItem('auth_token');
    const categoryData = {
      name: name.value.trim(),
      description: description.value.trim()
    };

    // Create the category
    const createResponse = await axios.post(
      'http://localhost/api/categories',
      categoryData,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    const categoryId = createResponse.data.id;

    // If there's an icon, upload it separately
    if (icon.value) {
      const formData = new FormData();
      formData.append('icon', icon.value);

      await axios.post(
        `http://localhost/api/categories/${categoryId}/update-icon`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
    }

    // Success - redirect to category view or categories list
    router.push({ path: '/settings', query: { tab: 'kategorija' } });
  } catch (error) {
    console.error('Greška pri čuvanju kategorije:', error);
    
    if (error.response && error.response.status === 422) {
      // Validation errors from backend
      const backendErrors = error.response.data.errors;
      if (backendErrors) {
        if (backendErrors.name) {
          errors.value.name = Array.isArray(backendErrors.name) ? backendErrors.name[0] : backendErrors.name;
        }
        if (backendErrors.description) {
          errors.value.description = Array.isArray(backendErrors.description) ? backendErrors.description[0] : backendErrors.description;
        }
        if (backendErrors.icon) {
          errors.value.icon = Array.isArray(backendErrors.icon) ? backendErrors.icon[0] : backendErrors.icon;
        }
      }
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Došlo je do neočekivane greške.';
      alert('Došlo je do greške pri čuvanju kategorije: ' + errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  name.value = '';
  description.value = '';
  icon.value = null;
  iconUrl.value = '';
  errors.value = {
    name: '',
    description: '',
    icon: ''
  };
  
  // Go back to categories list
  router.push({ path: '/settings', query: { tab: 'kategorija' } });
};
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

.form-section {
  width: 724px;
  height: 328px;
  display: flex;
  flex-direction: column;
}

.input-and-icon-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.form-field-name {
  width: 607px;
}

.photo-upload-box {
  width: 101px;
  height: 56px;
  border: 1px dashed #bdbdbd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #fafafa;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.photo-upload-box:hover {
  border-color: #3392ea;
}

.photo-upload-box.has-icon .upload-text,
.photo-upload-box.has-icon .v-icon {
  display: none;
}

.upload-text {
  color: #757575;
  font-size: 14px;
  margin: 0;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
  background-color: transparent;
}

.form-field-description {
  height: 212px;
  margin-bottom: 16px;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: auto;
}

.cancel-btn {
  border: 1px solid #3392ea;
  color: #3392ea;
  width: 120px;
}

.save-btn {
  width: 120px;
}

.form-field-description.v-textarea textarea {
  height: 100% !important;
}
</style>