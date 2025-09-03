<template>
  <div class="page-container min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Promejna šifre</h1>
        <p class="page-subtitle">
          Promijenite vašu šifru za pristup nalogu.
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

              <v-alert v-if="tokenError" type="warning" dense text class="mb-4">
                {{ tokenError }}
              </v-alert>

              <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="changePassword">
                <v-text-field
                  v-model="password"
                  :rules="passwordRules"
                  label="Nova šifra"
                  required
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  class="mb-2"
                  :disabled="loading || !!tokenError"
                ></v-text-field>

                <v-text-field
                  v-model="password_confirmation"
                  :rules="passwordConfirmationRules"
                  label="Potvrda nove šifre"
                  required
                  :type="showPasswordConfirmation ? 'text' : 'password'"
                  :append-inner-icon="showPasswordConfirmation ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPasswordConfirmation = !showPasswordConfirmation"
                  prepend-inner-icon="mdi-lock-check"
                  variant="outlined"
                  :disabled="loading || !!tokenError"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <ActionButtons
                @save="changePassword"
                @cancel="router.push('/')"
                :disabled="loading || !!tokenError"
                :loading="loading"
                save-text="Promeniti šifru"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ActionButtons from '@/components/ActionButtons.vue';

// Inicijalizacija
const router = useRouter();

// Stanja komponente
const valid = ref(true);
const loading = ref(false);
const error = ref(null);
const success = ref(null);
const tokenError = ref(null);


const token = ref('');
const email = ref('');

const form = ref(null);
const password = ref('');
const password_confirmation = ref('');
const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

const passwordRules = [
  v => !!v || 'Nova šifra je obavezna.',
  v => (v && v.length >= 8) || 'Nova šifra mora imati najmanje 8 karaktera.',
];
const passwordConfirmationRules = [
  v => !!v || 'Potvrda šifre je obavezna.',
  v => v === password.value || 'Šifre se ne poklapaju.',
];


onMounted(() => {
  try {
    const userObjectString = localStorage.getItem('user');
    const authTokenString = localStorage.getItem('auth_token');

    if (userObjectString && authTokenString) {
      const userData = JSON.parse(userObjectString);

      if (userData.email) {
        email.value = userData.email;
        token.value = authTokenString; 
        
        console.log('Podaci uspešno učitani iz localStorage!');
        console.log('Koristi se email:', email.value);
      } else {
        throw new Error("Objekat 'user' u localStorage ne sadrži email adresu.");
      }
    } else {
      throw new Error("Nedostaju 'user' ili 'auth_token' u localStorage.");
    }
  } catch (e) {
    console.error('Greška prilikom inicijalizacije:', e.message);
    tokenError.value = "Greška: Niste ulogovani ili vaša sesija nije validna. Bićete preusmereni na stranicu za prijavu.";
    setTimeout(() => router.push('/login'), 4000);
  }
});

const changePassword = async () => {
  if (tokenError.value) return;

  const { valid: isFormValid } = await form.value.validate();
  if (!isFormValid) return;

  loading.value = true;
  error.value = null;
  success.value = null;

  try {
    const resetUrl = `http://localhost/api/reset-password?token=${encodeURIComponent(token.value)}&email=${encodeURIComponent(email.value)}`;
    console.log('Šalje se zahtev na:', resetUrl);

    const response = await fetch(resetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        password: password.value,
        password_confirmation: password_confirmation.value,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Došlo je do greške (HTTP ${response.status})`);
    }

    success.value = data.message || 'Šifra je uspešno promenjena! Bićete preusmereni na stranicu za prijavu.';
    form.value.reset();
    
    // Brišemo stare podatke
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');

    setTimeout(() => {
      router.push('/login');
    }, 4000);

  } catch (e) {
    console.error('Greška pri promeni šifre:', e);
    if (e.message.includes('Failed to fetch')) {
        error.value = 'Nije moguće povezati se sa serverom. Proverite internet konekciju.';
    } else {
        error.value = e.message || 'Došlo je do neočekivane greške. Pokušajte ponovo.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Stilovi ostaju isti, nisu menjani */
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