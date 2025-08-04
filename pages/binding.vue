<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Novi Povez</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'povezi' } })">Povezi</span> / Novi Povez
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="form-section">
        <v-text-field
          v-model="name"
          label="Unesite Naziv Poveza..."
          variant="outlined"
          hide-details
          class="form-field-name"
        ></v-text-field>
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>

        <div class="buttons">
          <v-btn color="primary" class="save-btn" @click="saveBinding" :loading="loading">
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

const name = ref('');
const errors = ref({
  name: '',
});
const loading = ref(false);

const saveBinding = async () => {
  errors.value = {
    name: '',
  };

  if (!name.value) {
    errors.value.name = 'Morate unijeti naziv poveza!';
    return;
  }

  try {
    loading.value = true;
    const token = localStorage.getItem('auth_token');

    const response = await axios.post(
      'http://localhost/api/bindings/create',
      { name: name.value },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (response.data && response.data.binding && response.data.binding.id) {
      router.push({ path: '/settings', query: { tab: 'povezi' } });
    } else {
      throw new Error('Server nije vratio ID novog poveza.');
    }
  } catch (error) {
    console.error('Greška pri čuvanju poveza:', error);
    const errorMessage = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || error.message;
    alert('Došlo je do greške pri čuvanju poveza: ' + errorMessage);
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push({ path: '/settings', query: { tab: 'povezi' } });
};
</script>

<style scoped>
/*
  Stilovi su isti kao i za formu za žanr i izdavača
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
  margin-top: 24px;
}

.cancel-btn {
  border: 1px solid #3392ea;
  color: #3392ea;
  width: 120px;
}

.save-btn {
  width: 120px;
}
</style>