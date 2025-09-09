<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Uredi Izdavača</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/settings')">Settings</span> /
          <span class="link" @click="router.push({ path: '/settings', query: { tab: 'izdavaci' } })">Izdavači</span> / Uredi Izdavača
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
definePageMeta({
  middleware: ['auth']
})
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import ActionButtons from '@/components/ActionButtons.vue';

const router = useRouter();
const route = useRoute();

const publisherId = ref(null);
const name = ref('');
const initialName = ref('');

const errors = ref({
  name: '',
});
const loading = ref(false);
const apiBaseUrl = 'http://localhost';

const fetchPublisher = async () => {
  const id = route.params.id;
  if (!id) {
    alert('ID izdavača nije pronađen!');
    router.push({ path: '/settings', query: { tab: 'izdavaci' } });
    return;
  }
  publisherId.value = id;
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    
    // Dohvatanje osnovnih podataka
    const publisherResponse = await axios.get(`${apiBaseUrl}/api/publishers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const publisherData = publisherResponse.data;
    if (publisherData && publisherData.publisher_name) {
      name.value = publisherData.publisher_name;
      initialName.value = publisherData.publisher_name;
    } else {
      throw new Error('Nisu pronađeni podaci o izdavaču.');
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Došlo je do greške pri učitavanju izdavača.';
    alert(errorMessage);
    router.push({ path: '/settings', query: { tab: 'izdavaci' } });
  } finally {
    loading.value = false;
  }
};

const savePublisher = async () => {
  errors.value = { name: '' };

  if (!name.value.trim()) {
    errors.value.name = 'Morate unijeti naziv izdavača!';
    return;
  }

  const isNameChanged = name.value.trim() !== initialName.value.trim();
  
  if (!isNameChanged) {
    alert("Nema promjena za sačuvati.");
    return;
  }

  try {
    loading.value = true;
    const token = localStorage.getItem('auth_token');
    
    const publisherData = { name: name.value.trim() };
    await axios.patch(
      `${apiBaseUrl}/api/publishers/${publisherId.value}/update`,
      publisherData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    alert('Izdavač uspešno ažuriran!');
    router.push({ path: '/settings', query: { tab: 'izdavaci' } });
  } catch (error) {
    console.error('Greška pri čuvanju izdavača:', error);
    if (error.response?.status === 422) {
      const backendErrors = error.response.data;
      if (backendErrors.name) errors.value.name = backendErrors.name[0];
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Došlo je do neočekivane greške.';
      alert('Došlo je do greške pri čuvanju izdavača: ' + errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

const cancel = () => { router.push({ path: '/settings', query: { tab: 'izdavaci' } }); };

onMounted(() => {
  fetchPublisher();
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
.app-header { padding: 6px 24px 0 24px; display: flex; justify-content: space-between; align-items: center; }
.page-title { font-family: 'Roboto', sans-serif !important; font-size: 20px; font-weight: 500; color: #222; line-height: 100%; letter-spacing: 0.15px; vertical-align: middle; margin: 0; }
.page-subtitle { font-size: 14px; color: #777; margin: 0; margin-top: 2px; }
.page-subtitle .link { color: #1976d2; cursor: pointer; text-decoration: underline; }
.header-divider { height: 1px; background-color: #e0e0e0; margin-top: 15px; margin-bottom: 24px; }
.page-content { padding: 0 24px; flex-grow: 1; }
.form-section { width: 724px; display: flex; flex-direction: column; }
.form-field-name { width: 100%; } /* Prilagođena širina */
.error-message { color: #ff5252; font-size: 12px; margin-top: -10px; margin-bottom: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
</style>