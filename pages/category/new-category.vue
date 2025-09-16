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
          <div class="field-wrapper">
            <v-text-field
              v-model="name"
              label="Unesite Naziv Kategorije..."
              variant="outlined"
              hide-details
              class="form-field-name"
              :error="!!errors.name"
              color="primary"
            ></v-text-field>
            <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
          </div>

          <div class="field-wrapper">
            <div
              class="icon-picker-field"
              :class="{ 'error-border': !!errors.icon }"
              @click="iconPickerDialog = true"
            >
              <template v-if="!selectedIcon">
                <v-icon icon="mdi-image-outline" class="mr-1"></v-icon>
                <span>Add icon</span>
              </template>
              <template v-else>
                <v-icon :icon="selectedIcon" size="large"></v-icon>
              </template>
            </div>
            <div v-if="errors.icon" class="error-message">{{ errors.icon }}</div>
          </div>
        </div>

        <v-textarea
          v-model="description"
          label="Unesite Opis..."
          variant="outlined"
          hide-details
          class="form-field-description"
          :error="!!errors.description"
          color="primary"
        ></v-textarea>
        <div v-if="errors.description" class="error-message">{{ errors.description }}</div>

        <div class="form-actions">
          <ActionButtons @save="saveCategory" @cancel="cancel" :loading="loading" />
        </div>
      </div>
    </div>

    <v-dialog v-model="iconPickerDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Izaberite ikonu</span>
          <v-btn icon="mdi-close" variant="text" @click="iconPickerDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field
            v-model="searchIcon"
            label="Pretraži ikone..."
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="mb-4"
          ></v-text-field>
          <div class="icon-grid">
            <v-btn
              v-for="icon in filteredIcons"
              :key="icon"
              variant="text"
              icon
              @click="selectIcon(icon)"
              class="ma-1"
            >
              <v-icon :icon="icon" size="large"></v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

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

<script setup>
definePageMeta({
  middleware: ['auth', 'auth-librarian']
})
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import ActionButtons from '~/components/action-buttons.vue';
import { mdiIcons } from '@/utils/mdiIcons';

const router = useRouter();

const name = ref('');
const description = ref('');
const errors = ref({
  name: '',
  description: '',
  icon: ''
});
const loading = ref(false);
const successSnackbar = ref({
  show: false,
  text: ''
});

// Stanje za icon picker
const selectedIcon = ref(null);
const iconPickerDialog = ref(false);
const searchIcon = ref('');

const filteredIcons = computed(() => {
  if (!searchIcon.value) {
    return mdiIcons;
  }
  return mdiIcons.filter(icon => icon.toLowerCase().includes(searchIcon.value.toLowerCase()));
});

const selectIcon = (icon) => {
  selectedIcon.value = icon;
  iconPickerDialog.value = false;
  errors.value.icon = '';
};

const saveCategory = async () => {
  errors.value = { name: '', description: '', icon: '' };
  let hasErrors = false;
  
  if (!name.value.trim()) {
    errors.value.name = 'Morate unijeti naziv kategorije!';
    hasErrors = true;
  }
  
  if (!description.value.trim()) {
    errors.value.description = 'Morate unijeti opis!';
    hasErrors = true;
  }

  if (!selectedIcon.value) {
    errors.value.icon = 'Morate izabrati ikonu!';
    hasErrors = true;
  }

  if (hasErrors) return;

  try {
    loading.value = true;
    const token = localStorage.getItem('auth_token');

    const categoryData = {
      name: name.value.trim(),
      description: description.value.trim(),
      icon: selectedIcon.value,
    };

    await axios.post(
      'http://localhost/api/categories/create',
      categoryData,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    successSnackbar.value.text = 'Uspješno ste kreirali novu kategoriju!';
    successSnackbar.value.show = true;

    setTimeout(() => {
      router.push({ path: '/settings', query: { tab: 'kategorija' } });
    }, 1500);

  } catch (error) {
    console.error('Greška pri čuvanju kategorije:', error);
    if (error.response && error.response.status === 422) {
      const backendErrors = error.response.data.errors;
      if (backendErrors) {
        if (backendErrors.name) errors.value.name = backendErrors.name[0];
        if (backendErrors.description) errors.value.description = backendErrors.description[0];
        if (backendErrors.icon) errors.value.icon = backendErrors.icon[0];
      }
    } else {
      alert('Došlo je do greške pri čuvanju kategorije.');
    }
  } finally {
    loading.value = false;
  }
};
 
const cancel = () => {
  name.value = '';
  description.value = '';
  selectedIcon.value = null;
  errors.value = { name: '', description: '', icon: '' };
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
}

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin-top: 2px;
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 5px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.form-section {
  width: 724px;
  display: flex;
  flex-direction: column;
}

.input-and-icon-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}


.field-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
}
.field-wrapper:first-of-type {
  flex-grow: 1;
}

.form-field-name {
  height: 48px;
}
.form-field-name :deep(.v-field__input) {
  min-height: 48px !important;
  height: 48px !important;
}
.form-field-name :deep(.v-field) {
  height: 48px !important;
}


.icon-picker-field {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 101px;
  height: 48px;
  border: 1px solid rgba(0, 0, 0, 0.38); 
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  box-sizing: border-box;
}

.icon-picker-field:hover {
  border-color: rgba(0, 0, 0, 0.87); 
}

.icon-picker-field.error-border {
  border-color: #ff5252; 
  color: #ff5252;
}

.form-field-description {
  margin-bottom: 16px;
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: 4px; /* Mali razmak od polja */
  padding-left: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  max-height: 50vh;
  overflow-y: auto;
}
</style>