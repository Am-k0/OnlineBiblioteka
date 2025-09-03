<template>
  <client-only>
    <div class="login-bg">
      <div class="login-wrapper">
        <v-card class="login-card" elevation="8" rounded="lg">
          <div class="login-title">Online biblioteka</div>
          <div class="title-line" />

          <v-form v-model="formIsValid" @submit.prevent="signIn" class="login-form">
            <v-text-field
              v-model="credentials.email"
              label="Email"
              placeholder="example@example.net"
              variant="outlined"
              density="comfortable"
              class="input-field"
              :rules="emailRules"
              hide-details="auto"
              color="#3392EA"
            />
            <v-text-field
              v-model="credentials.password"
              label="Password"
              placeholder="Password"
              :type="visible ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="visible = !visible"
              class="input-field"
              :rules="passwordRules"
              hide-details="auto"
              color="#3392EA"
            />

            <v-btn
              class="login-button"
              color="#3392EA"
              size="large"
              block
              type="submit"
              :disabled="!formIsValid || loading"
              :loading="loading"
            >
              LOG IN
            </v-btn>
          </v-form>

          <div class="forgot-link">
            <a href="#" @click.prevent="router.push('/forgotpassword')">Forgot password?</a>
          </div>

          <div v-if="errorMsg" class="error-text">
            {{ errorMsg }}
          </div>

          <div class="login-footer">
             ©2021 ICT Cortex. All rights reserved. 
          </div>
        </v-card>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/axios';

const router = useRouter();

const credentials = ref({ email: '', password: '' });
const errorMsg = ref<string | null>(null);
const loading = ref(false);
const visible = ref(false);
const formIsValid = ref(false);

const emailRules = [
  (v: string) => !!v || 'Email je obavezan',
  (v: string) => /.+@.+\..+/.test(v) || 'Email nije validan',
];
const passwordRules = [
  (v: string) => !!v || 'Lozinka je obavezna',
  (v: string) => v.length >= 6 || 'Lozinka mora imati najmanje 6 karaktera',
];

async function signIn() {
  if (!formIsValid.value) {
    errorMsg.value = 'Molimo ispravite greške u formi.';
    return;
  }

  loading.value = true;
  errorMsg.value = null;

  try {
    console.log('Šalje se zahtev za login...');
    
    // API poziv za login - koristi strukturu koju vraća vaš PHP backend
    const loginResponse = await api.post('/login', {
      email: credentials.value.email,
      password: credentials.value.password,
    });

    console.log('Login response:', loginResponse.data);

    // Provera da li postoji token u odgovoru
    const token = loginResponse.data?.access_token;
    if (!token) {
      throw new Error('Token nije pronađen u odgovoru sa servera.');
    }

    // Provera da li postoje korisničke informacije
    const user = loginResponse.data?.user;
    if (!user) {
      throw new Error('Korisničke informacije nisu pronađene u odgovoru.');
    }

    // Čuvanje tokena i korisničkih podataka u localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token_type', loginResponse.data?.token_type || 'Bearer');
    localStorage.setItem('user', JSON.stringify(user));

    console.log('Podaci uspešno sačuvani:', {
      token: token.substring(0, 20) + '...', // Prikaži samo deo tokena iz bezbednosnih razloga
      user: user
    });

    // Postavljanje Authorization header-a za buduće API pozive
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Preusmeri korisnika na glavnu stranu
    router.push('/');

  } catch (error: any) {
    console.error('Greška pri prijavi:', error);

    // Obriši sve podatke iz localStorage u slučaju greške
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');

    // Ukloni Authorization header
    delete api.defaults.headers.common['Authorization'];

    // Obradi različite tipove grešaka
    if (error.response) {
      console.error('Response error:', error.response);
      
      // Koristi grešku iz backend-a ako postoji
      errorMsg.value = error.response.data?.error || 
                       error.response.data?.message || 
                       'Greška pri prijavi. Proverite podatke.';

      // Specifične greške na osnovu status koda
      if (error.response.status === 401) {
        errorMsg.value = 'Neispravan email ili lozinka.';
      } else if (error.response.status === 422) {
        // Laravel validation errors
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          const firstError = Object.values(validationErrors)[0];
          errorMsg.value = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      } else if (error.response.status >= 500) {
        errorMsg.value = 'Greška servera. Pokušajte ponovo kasnije.';
      }
    } else if (error.request) {
      console.error('Request error:', error.request);
      errorMsg.value = 'Nije moguće povezati sa serverom. Proverite internetsku vezu.';
    } else {
      console.error('General error:', error.message);
      errorMsg.value = error.message || 'Neočekivana greška. Pokušajte ponovo.';
    }
  } finally {
    loading.value = false;
  }
}

// Funkcija za logout (možete je dodati u header ili bilo gde)
async function logout() {
  try {
    // Pozovi backend logout endpoint
    await api.post('/logout');
  } catch (error) {
    console.error('Greška pri logout-u:', error);
  } finally {
    // Uvek obriši lokalne podatke bez obzira na status backend poziva
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    
    // Preusmeri na login stranu
    router.push('/login');
  }
}

// Funkcija za dobijanje trenutno ulogovanog korisnika
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Funkcija za proveru da li je korisnik ulogovan
function isAuthenticated() {
  return !!localStorage.getItem('auth_token') && !!localStorage.getItem('user');
}

// Eksportuj funkcije ako su potrebne u drugim komponentama
defineExpose({
  logout,
  getCurrentUser,
  isAuthenticated
});
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  width: 100vw;
  background: url('@/assets/background.png') no-repeat center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  backdrop-filter: blur(2px);
}
.login-card {
  width: 495px;
  height: 394px;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 16px;
}
.login-title {
  font-family: Roboto, sans-serif;
  font-weight: 500;
  font-size: 24px;
  line-height: 100%;
  letter-spacing: 0.15px;
  text-align: center;
  margin-bottom: 16px;
}
.title-line {
  width: 431px;
  height: 1px;
  background-color: #e0e0e0;
  margin: 0 auto 24px auto;
}
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.input-field {
  width: 100%;
  border-radius: 4px;
}
.login-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 1.25px;
  text-transform: uppercase;
  margin-top: 20px;
  margin-bottom: 10px;
  background-color: #3392EA !important;
  color: white !important;
  box-shadow: none;
  border-radius: 4px;
}
.forgot-link {
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
  margin-top: 6px;
}
.forgot-link a {
  color: #3392EA;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 8px;
  padding-right: 8px;
}
.login-footer {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.4px;
  color: #888;
  text-align: center;
  width: 100%;
}
.error-text {
  color: #e53935;
  font-size: 13px;
  margin-top: -8px;
  margin-bottom: 6px;
  text-align: left;
  width: 100%;
}
</style>