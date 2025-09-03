<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Uredi Žanr</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'zanrovi' } })">Žanrovi</span> / Uredi Žanr
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
        ></v-text-field>
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

        <div class="form-actions">
          <ActionButtons @save="saveGenre" @cancel="cancel" :loading="loading" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import ActionButtons from '@/components/ActionButtons.vue'; // Uverite se da je putanja ispravna

const router = useRouter();
const route = useRoute();

const genreId = ref(null);
const name = ref('');
const description = ref('');
const initialName = ref('');
const initialDescription = ref('');
const errors = ref({
  name: '',
  description: ''
});
const loading = ref(false);
const apiBaseUrl = 'http://localhost';

const fetchGenre = async () => {
  const id = route.params.id;
  if (!id) {
    alert('ID žanra nije pronađen!');
    router.push({ path: '/settings', query: { tab: 'zanrovi' } });
    return;
  }
  genreId.value = id;
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await axios.get(`${apiBaseUrl}/api/genres/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const genreData = response.data.genre;
    name.value = genreData.name;
    description.value = genreData.description;
    initialName.value = genreData.name;
    initialDescription.value = genreData.description;
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Došlo je do greške pri učitavanju žanra.';
    alert(errorMessage);
    router.push({ path: '/settings', query: { tab: 'zanrovi' } });
  } finally {
    loading.value = false;
  }
};

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
    
    const isNameChanged = name.value.trim() !== initialName.value.trim();
    const isDescriptionChanged = description.value.trim() !== initialDescription.value.trim();

    if (!isNameChanged && !isDescriptionChanged) {
      alert("Nema promjena za sačuvati.");
      return;
    }

    const genreData = {
      name: name.value.trim(),
      description: description.value.trim()
    };

    await axios.patch(
      `${apiBaseUrl}/api/genres/${genreId.value}/update`,
      genreData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    alert('Žanr uspešno ažuriran!');
    router.push({ path: '/settings', query: { tab: 'zanrovi' } });

  } catch (error) {
    console.error('Greška pri čuvanju žanra:', error);
    
    if (error.response?.status === 422) {
      const backendErrors = error.response.data;
      if (backendErrors.name) {
        errors.value.name = Array.isArray(backendErrors.name) ? backendErrors.name[0] : backendErrors.name;
      }
      if (backendErrors.description) {
        errors.value.description = Array.isArray(backendErrors.description) ? backendErrors.description[0] : backendErrors.description;
      }
      alert('Greška validacije. Molimo proverite unete podatke.');
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Došlo je do neočekivane greške.';
      alert('Došlo je do greške pri čuvanju žanra: ' + errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push({ path: '/settings', query: { tab: 'zanrovi' } });
};

onMounted(() => {
  fetchGenre();
});
</script>

<style scoped>
/* Isti stilovi kao za "genre.vue" */
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
  margin-top: auto;
}
</style>