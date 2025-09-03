<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Novi Izdavač</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'izdavaci' } })">Izdavači</span> / Novi Izdavač
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="form-section">
        <v-text-field
          v-model="name"
          label="Unesite Naziv Izdavača..."
          variant="outlined"
          hide-details
          class="form-field-name"
          :error="!!errors.name"
        ></v-text-field>
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>

        <div class="form-actions">
          <ActionButtons @save="savePublisher" @cancel="cancel" :loading="loading" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import ActionButtons from '@/components/ActionButtons.vue';

const router = useRouter();

const name = ref('');
const errors = ref({
  name: '',
});
const loading = ref(false);
const apiBaseUrl = 'http://localhost';

const savePublisher = async () => {
  errors.value.name = '';

  if (!name.value.trim()) {
    errors.value.name = 'Morate unijeti naziv izdavača!';
    return;
  }

  try {
    loading.value = true;
    const token = localStorage.getItem('auth_token');

    await axios.post(
      `${apiBaseUrl}/api/publishers/create`,
      { name: name.value.trim() },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    alert('Izdavač uspešno sačuvan!');
    router.push({ path: '/settings', query: { tab: 'izdavaci' } });
  } catch (error) {
    console.error('Greška pri čuvanju izdavača:', error);
    if (error.response?.status === 422) {
      const backendErrors = error.response.data.errors;
      if (backendErrors.name) errors.value.name = backendErrors.name[0];
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Nepoznata greška.';
      alert('Došlo je do greške pri čuvanju izdavača: ' + errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push({ path: '/settings', query: { tab: 'izdavaci' } });
};
</script>

<style scoped>
/* Izdvojeni stilovi za kreiranje izdavača */
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}
.app-header { padding: 6px 24px 0 24px; display: flex; justify-content: space-between; align-items: center; }
.page-title { font-family: 'Roboto', sans-serif !important; font-size: 20px; font-weight: 500; color: #222; line-height: 100%; letter-spacing: 0.15px; vertical-align: middle; margin: 0; }
.page-subtitle { font-size: 14px; color: #777; margin: 0; margin-top: 2px; }
.page-subtitle .link { color: #1976d2; cursor: pointer; text-decoration: underline; }
.header-divider { height: 1px; background-color: #e0e0e0; margin-top: 15px; margin-bottom: 24px; }
.page-content { padding: 0 24px; flex-grow: 1; }
.form-section { width: 724px; display: flex; flex-direction: column; }
.form-field-name { width: 724px; height: 48px; }
.error-message { color: #ff5252; font-size: 12px; margin-top: -10px; margin-bottom: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
</style>