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
          color="primary"
        ></v-text-field>
        <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
        
        <div class="form-actions">
          <ActionButtons @save="savePublisher" @cancel="cancel" :loading="loading" />
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

    <v-dialog v-model="noChangesDialog.show" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Nema promjena</v-card-title>
        <v-card-text>
          <div class="dialog-content">
            <v-icon color="#3392ea" size="50">mdi-information</v-icon>
            <p class="dialog-text">Nema promjena za sačuvati. Molimo unesite izmjene prije spremanja.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="closeNoChangesDialogAndStay">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import ActionButtons from '~/components/action-buttons.vue';

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
const successSnackbar = ref({
  show: false,
  text: ''
});
const errorSnackbar = ref({
  show: false,
  text: ''
});
const noChangesDialog = ref({
  show: false
});

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
    noChangesDialog.value.show = true;
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
    
    successSnackbar.value.text = 'Uspješno ste promijenili podatke o izdavacu!';
    successSnackbar.value.show = true;
    
    setTimeout(() => {
      router.push({ path: '/settings', query: { tab: 'izdavaci' } });
    }, 1500);

  } catch (error) {
    console.error('Greška pri čuvanju izdavača:', error);
    if (error.response?.status === 422) {
      const backendErrors = error.response.data.errors;
      if (backendErrors.name) errors.value.name = Array.isArray(backendErrors.name) ? backendErrors.name[0] : backendErrors.name;
      errorSnackbar.value.text = 'Greška validacije. Molimo provjerite unesene podatke.';
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Došlo je do neočekivane greške.';
      errorSnackbar.value.text = 'Došlo je do greške pri čuvanju izdavača: ' + errorMessage;
    }
    errorSnackbar.value.show = true;
  } finally {
    loading.value = false;
  }
};

const cancel = () => { router.push({ path: '/settings', query: { tab: 'izdavaci' } }); };

const closeNoChangesDialogAndStay = () => {
  noChangesDialog.value.show = false;
};

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
.form-field-name { width: 100%; }
.error-message { color: #ff5252; font-size: 12px; margin-top: -10px; margin-bottom: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }

.dialog-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog-text {
  font-size: 16px;
  color: #555;
  margin: 0;
}
</style>