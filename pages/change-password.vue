<template>
  <div class="page-container min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Promena šifre</h1>
        <p class="page-subtitle">
          Promenite vašu šifru za pristup nalogu.
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="5">
          <v-card class="password-card rounded">
            <v-toolbar color="#3392EA" dark flat>
              <v-toolbar-title class="centered-title">Postavite novu šifru</v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pa-8">
              <v-alert v-if="error" type="error" dense text class="mb-4">
                {{ error }}
              </v-alert>

              <v-alert v-if="success" type="success" dense text class="mb-4">
                {{ success }}
              </v-alert>

              <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submitChangePassword">
                <v-text-field
                  v-model="currentPassword"
                  :rules="currentPasswordRules"
                  label="Trenutna šifra"
                  required
                  :type="showCurrentPassword ? 'text' : 'password'"
                  :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showCurrentPassword = !showCurrentPassword"
                  prepend-inner-icon="mdi-lock-outline"
                  variant="outlined"
                  class="mb-2"
                  :disabled="loading"
                ></v-text-field>

                <v-text-field
                  v-model="newPassword"
                  :rules="newPasswordRules"
                  label="Nova šifra"
                  required
                  :type="showNewPassword ? 'text' : 'password'"
                  :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showNewPassword = !showNewPassword"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  class="mb-2"
                  :disabled="loading"
                ></v-text-field>

                <v-text-field
                  v-model="newPasswordConfirmation"
                  :rules="newPasswordConfirmationRules"
                  label="Potvrda nove šifre"
                  required
                  :type="showNewPasswordConfirmation ? 'text' : 'password'"
                  :append-inner-icon="showNewPasswordConfirmation ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showNewPasswordConfirmation = !showNewPasswordConfirmation"
                  prepend-inner-icon="mdi-lock-check"
                  variant="outlined"
                  :disabled="loading"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <ActionButtons
                @save="submitChangePassword"
                @cancel="router.push('/')"
                :disabled="loading"
                :loading="loading"
                save-text="Promeni šifru"
                cancel-text="Odustani"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ActionButtons from '~/components/action-buttons.vue';

definePageMeta({
  middleware: ['auth']
})

// Inicijalizacija
const router = useRouter();
const form = ref(null);

// Stanja komponente
const valid = ref(true);
const loading = ref(false);
const error = ref(null);
const success = ref(null);

// Modeli za polja u formi
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirmation = ref('');

// Vidljivost šifri
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showNewPasswordConfirmation = ref(false);

// Pravila validacije
const currentPasswordRules = [
  v => !!v || 'Trenutna šifra je obavezna.',
];
const newPasswordRules = [
  v => !!v || 'Nova šifra je obavezna.',
  v => (v && v.length >= 8) || 'Nova šifra mora imati najmanje 8 karaktera.',
];
const newPasswordConfirmationRules = [
  v => !!v || 'Potvrda šifre je obavezna.',
  v => v === newPassword.value || 'Šifre se ne poklapaju.',
];

// Glavna funkcija za promenu šifre
const submitChangePassword = async () => {
  const { valid: isFormValid } = await form.value.validate();
  if (!isFormValid) return;

  loading.value = true;
  error.value = null;
  success.value = null;

  try {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      throw new Error("Niste ulogovani. Molimo vas, prijavite se ponovo.");
    }

    // ========== KLJUČNA IZMENA JE OVDE ==========
    // Ispravljena API adresa prema tvom api.php fajlu
    const apiUrl = 'http://localhost/api/users/change-password';
    // ===========================================

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        current_password: currentPassword.value,
        new_password: newPassword.value,
        new_password_confirmation: newPasswordConfirmation.value,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Došlo je do greške (HTTP ${response.status})`;
      throw new Error(errorMessage);
    }

    success.value = data.message || 'Šifra je uspešno promenjena! Bićete odjavljeni sa svih uređaja i preusmereni na stranicu za prijavu.';
    
    form.value.reset();
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');

    setTimeout(() => {
      router.push('/login');
    }, 3000);

  } catch (e) {
    console.error('Greška pri promeni šifre:', e);
    if (e.message.includes('Failed to fetch')) {
        error.value = 'Nije moguće povezati se sa serverom. Proverite internet konekciju.';
    } else {
        error.value = e.message;
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Stilovi ostaju isti */
.page-container {
  padding: 0;
  background-color: #f7f8fc;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  padding: 6px 24px 0 24px;
  background-color: white;
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
  margin: 5px;
}

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
  margin-top: 2px;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 7px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
  overflow-y: auto;
}

.centered-title {
  display: flex;
  justify-content: center;
  width: 100%;
}

.password-card {
  width: 100%; 
  max-width: 500px;
}
</style>