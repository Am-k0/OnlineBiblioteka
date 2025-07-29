<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// PROMJENA: Importuj svoju konfigurisanu Axios instancu
// Pretpostavljajući da je putanja do axios.js 'src/axios.js'
// VAŽNO: Koristi imenovani import ako api.js eksportuje default, ili direktno importuj funkciju
import api from '@/axios' // Ako je export default
// ili: import { axiosInstance as api } from '@/axios'; // Ako je named export, npr. 'axiosInstance'

const router = useRouter()

const credentials = ref({ email: '', password: '' })
const errorMsg = ref<string | null>(null)
const loading = ref(false)
const visible = ref(false)
const formIsValid = ref(false) // Ovo je vezano za v-form validaciju

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email is not valid',
]
const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
]

async function signIn() {
  // PROVJERA: Proveri da li je v-form ispravna pre slanja
  if (!formIsValid.value) {
    console.log('Frontend form validation failed.');
    errorMsg.value = 'Please correct the form errors.';
    return;
  }

  loading.value = true
  errorMsg.value = null
  console.log('Attempting sign-in...');
  console.log('Credentials:', credentials.value.email); // Ne loguj password direktno

  try {
    // PROMJENA: Koristi uvezenu 'api' instancu
    const response = await api.post('/login', { // Koristi relativnu putanju jer je baseURL već postavljen u axios.js
      email: credentials.value.email,
      password: credentials.value.password,
    });

    console.log('Login API Full response:', response); // Debug log

    // Prilagodjeno prema tvom Postman odgovoru gdje token dolazi kao "status_token"
    // Dodao sam i 'data.token' i 'data.access_token' za širu kompatibilnost
    const token = response.data?.status_token || 
                  response.data?.token ||
                  response.data?.access_token;

    if (!token) {
      console.error('Token not found in response data. Response:', response.data);
      throw new Error('Token not found in response. Check backend response structure.');
    }

    
    localStorage.setItem('auth_token', token); // Koristi 'auth_token'
    console.log('Token successfully saved to localStorage with key "auth_token".');
    
  
    const storedToken = localStorage.getItem('auth_token');
    console.log('Stored token after save (read back from localStorage):', storedToken ? 'Token exists' : 'Token is NULL or EMPTY');
    
    if (!storedToken) {
      throw new Error('Failed to save token to localStorage. Verify browser storage and permissions.');
    }


    console.log('Login successful. Redirecting to /');
    router.push('/');

  } catch (error: any) {
    console.error('Login error in signIn function:', error);
    
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);

      errorMsg.value = error.response.data?.message || 
                      error.response.data?.error ||
                      'Login failed. Please check your credentials.';
      
      // Specifična poruka za 401 Unauthorized
      if (error.response.status === 401) {
        errorMsg.value = 'Invalid email or password.';
      }

    } else if (error.request) {
      // Zahtev je poslat, ali nije primljen odgovor
      console.error('No response received from server. Request:', error.request);
      errorMsg.value = 'No response from server. Please try again later.';
    } else {
      // Nešto drugo je pošlo naopako pre slanja zahteva
      console.error('Error setting up request:', error.message);
      errorMsg.value = error.message || 'An unexpected error occurred.';
    }
  } finally {
    loading.value = false;
    console.log('Login attempt finished. Loading set to false.');
  }
}
</script>

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
            <a href="#">Forgot password?</a>
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