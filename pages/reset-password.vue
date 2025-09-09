<template>
  <client-only>
    <div class="reset-password-bg">
      <div class="reset-password-wrapper">
        <v-card class="reset-password-card" elevation="8" rounded="lg">
          <div class="reset-password-title">Resetovanje šifre</div>
          <div class="title-line" />

          <v-form v-model="formIsValid" @submit.prevent="resetPassword" class="reset-password-form">
            <v-text-field
              v-model="password"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :type="showPassword ? 'text' : 'password'"
              label="Nova šifra"
              variant="outlined"
              density="comfortable"
              class="input-field"
              :rules="passwordRules"
              hide-details="auto"
              color="#3392EA"
              @click:append-inner="showPassword = !showPassword"
            />
            <v-text-field
              v-model="passwordConfirmation"
              :append-inner-icon="showPasswordConfirmation ? 'mdi-eye-off' : 'mdi-eye'"
              :type="showPasswordConfirmation ? 'text' : 'password'"
              label="Potvrda nove šifre"
              variant="outlined"
              density="comfortable"
              class="input-field"
              :rules="passwordConfirmationRules"
              hide-details="auto"
              color="#3392EA"
              @click:append-inner="showPasswordConfirmation = !showPasswordConfirmation"
            />
            
            <v-btn
              class="reset-password-button"
              color="#3392EA"
              size="large"
              block
              type="submit"
              :disabled="!formIsValid || loading"
              :loading="loading"
            >
              RESETUJ ŠIFRU
            </v-btn>
          </v-form>

          <div v-if="errorMsg" class="error-text">
            {{ errorMsg }}
          </div>
          <div v-if="successMsg" class="success-text">
            {{ successMsg }}
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
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/axios';

const router = useRouter();
const route = useRoute();

const password = ref('');
const passwordConfirmation = ref('');
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);
const loading = ref(false);
const formIsValid = ref(false);
const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

const token = route.query.token;
const email = route.query.email;

// Pravila validacije
const passwordRules = [
  (v: string) => !!v || 'Šifra je obavezna',
  (v: string) => v.length >= 8 || 'Šifra mora imati najmanje 8 karaktera',
];

const passwordConfirmationRules = [
  (v: string) => !!v || 'Potvrda šifre je obavezna',
  (v: string) => v === password.value || 'Šifre se ne podudaraju',
];

// Funkcija za resetovanje lozinke
async function resetPassword() {
  if (!formIsValid.value) {
    errorMsg.value = 'Molimo ispravno popunite sva polja.';
    return;
  }
  
  loading.value = true;
  errorMsg.value = null;
  successMsg.value = null;

  try {
    const response = await api.post('/reset-password', {
      token: token,
      email: email,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
    
    successMsg.value = response.data.message || 'Šifra je uspješno resetovana.';
    console.log('Šifra je uspješno resetovana.');
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (error: any) {
    console.error('Greška pri resetovanju šifre:', error);
    
    if (error.response) {
      if (error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
            errorMsg.value = Object.values(validationErrors).flat().join(' ');
        } else {
            errorMsg.value = 'Greška validacije. Molimo provjerite podatke.';
        }
      } else {
        errorMsg.value = error.response.data.message || 'Došlo je do greške. Pokušajte ponovo.';
      }
    } else if (error.request) {
      errorMsg.value = 'Nema odgovora od servera. Proverite internetsku vezu.';
    } else {
      errorMsg.value = 'Došlo je do neočekivane greške.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>

.reset-password-bg {
  min-height: 100vh;
  width: 100vw;
  background: url('@/assets/background.png') no-repeat center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-password-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  backdrop-filter: blur(2px);
}

.reset-password-card {
  width: 495px;
  height: 420px; 
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 16px;
}

.reset-password-title {
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

.reset-password-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-field {
  width: 100%;
  border-radius: 4px;
}

.reset-password-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 1.25px;
  text-transform: uppercase;
  margin-top: 10px;
  margin-bottom: 10px;
  background-color: #3392EA !important;
  color: white !important;
  box-shadow: none;
  border-radius: 4px;
}

.login-footer {
  margin-top: auto; 
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

.success-text {
  color: #4CAF50; 
  font-size: 13px;
  margin-top: -8px;
  margin-bottom: 6px;
  text-align: left;
  width: 100%;
}
</style>