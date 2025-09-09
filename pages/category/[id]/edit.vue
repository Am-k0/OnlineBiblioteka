<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Uredi Kategoriju</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'kategorija' } })">Kategorije</span> / Uredi Kategoriju
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

        <div class="form-actions">
          <ActionButtons @save="saveCategory" @cancel="cancel" :loading="loading" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth', 'auth-librarian']
})
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import ActionButtons from '@/components/ActionButtons.vue'; 

const router = useRouter();
const route = useRoute();

const categoryId = ref(null);
const icon = ref(null);
const iconUrl = ref('');
const name = ref('');
const description = ref('');
const initialName = ref('');
const initialDescription = ref('');
const fileInput = ref(null);
const errors = ref({
  name: '',
  description: '',
  icon: ''
});
const loading = ref(false);
const apiBaseUrl = 'http://localhost';

const fetchCategory = async () => {
  const id = route.params.id;
  if (!id) {
    alert('ID kategorije nije pronađen!');
    router.push({ path: '/settings', query: { tab: 'kategorija' } });
    return;
  }
  categoryId.value = id;
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await axios.get(`${apiBaseUrl}/api/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const categoryData = response.data.category;
    name.value = categoryData.name;
    description.value = categoryData.description;
    initialName.value = categoryData.name;
    initialDescription.value = categoryData.description;
    if (categoryData.icon) {
      iconUrl.value = `${apiBaseUrl}/storage/${categoryData.icon}`;
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Došlo je do greške pri učitavanju kategorije.';
    alert(errorMessage);
    router.push({ path: '/settings', query: { tab: 'kategorija' } });
  } finally {
    loading.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5120 * 1024) {
      errors.value.icon = 'Ikona mora biti manja od 5MB!';
      return;
    }
    
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
  errors.value = {
    name: '',
    description: '',
    icon: ''
  };

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
    const token = localStorage.getItem('auth_token');
    
    const isNameChanged = name.value.trim() !== initialName.value.trim();
    const isDescriptionChanged = description.value.trim() !== initialDescription.value.trim();

    if (!isNameChanged && !isDescriptionChanged && !icon.value) {
      alert("Nema promjena za sačuvati.");
      return;
    }

    if (isNameChanged || isDescriptionChanged) {
      const categoryData = {
        name: name.value.trim(),
        description: description.value.trim()
      };

      await axios.patch(
        `${apiBaseUrl}/api/categories/${categoryId.value}/update`,
        categoryData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
    
    if (icon.value) {
      const formData = new FormData();
      formData.append('icon', icon.value);
      formData.append('_method', 'POST'); 

      await axios.post(
        `${apiBaseUrl}/api/categories/${categoryId.value}/update-icon`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
    
    router.push({ path: '/settings', query: { tab: 'kategorija' } });

  } catch (error) {
    console.error('Greška pri čuvanju kategorije:', error);
    
    if (error.response && error.response.status === 422) {
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
  router.push({ path: '/settings', query: { tab: 'kategorija' } });
};

onMounted(() => {
  fetchCategory();
});
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}
</style>