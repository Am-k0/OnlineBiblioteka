<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Novi Žanr</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'zanrovi' } })">Žanrovi</span> / Novi Žanr
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="form-section">
        <v-text-field
          v-model="name"
          label="Unesite Naziv Žanra..."
          variant="outlined"
          hide-details
          class="form-field-name"
          :error="!!errors.name"
          color="primary"
        ></v-text-field>
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>

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
          <ActionButtons @save="saveGenre" @cancel="cancel" :loading="loading" />
        </div>
      </div>
    </div>
    
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

    <v-snackbar
      v-model="errorSnackbar.show"
      color="error"
      :timeout="3000"
      bottom
    >
      {{ errorSnackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="errorSnackbar.show = false"
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import ActionButtons from '~/components/action-buttons.vue';

const router = useRouter();

const name = ref('');
const description = ref('');
const errors = ref({
  name: '',
  description: ''
});
const loading = ref(false);
const successSnackbar = ref({
  show: false,
  text: ''
});
const errorSnackbar = ref({
  show: false,
  text: ''
});

const saveGenre = async () => {
  errors.value = {
    name: '',
    description: ''
  };

  let hasErrors = false;

  if (!name.value.trim()) {
    errors.value.name = 'Morate unijeti naziv žanra!';
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

    await axios.post(
      'http://localhost/api/genres/create',
      { name: name.value.trim(), description: description.value.trim() },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    successSnackbar.value.text = 'Uspješno ste kreirali novi žanr!';
    successSnackbar.value.show = true;
    
    setTimeout(() => {
      router.push({ path: '/settings', query: { tab: 'zanrovi' } });
    }, 1500);

  } catch (error) {
    console.error('Greška pri čuvanju žanra:', error);
    
    if (error.response?.status === 422) {
      const backendErrors = error.response.data.errors;
      if (backendErrors.name) {
        errors.value.name = Array.isArray(backendErrors.name) ? backendErrors.name[0] : backendErrors.name;
      }
      if (backendErrors.description) {
        errors.value.description = Array.isArray(backendErrors.description) ? backendErrors.description[0] : backendErrors.description;
      }
      errorSnackbar.value.text = 'Greška validacije. Molimo provjerite unesene podatke.';
    } else {
      errorSnackbar.value.text = 'Došlo je do greške pri čuvanju žanra: ' + (error.response?.data?.message || error.message || 'Nepoznata greška.');
    }
    errorSnackbar.value.show = true;
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push({ path: '/settings', query: { tab: 'zanrovi' } });
};
</script>

<style scoped>
/*
  MODIFIKOVANI CSS STILOVI
*/
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

/* Stilovi za formu */
.form-section {
  width: 724px;
  height: 100px;
  display: flex;
  flex-direction: column;
}

.form-field-name {
  width: 724px;
  height: 48px;
  margin-bottom: 16px;
}

.form-field-description {
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
  gap: 16px;
  margin-top: 24px;
}
</style>