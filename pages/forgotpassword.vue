<template>
  <client-only>
    <div class="login-bg">
      <div class="login-wrapper">
        <v-card class="login-card" elevation="8" rounded="lg">
          <div class="login-title">Online biblioteka</div>
          <div class="title-line" />

          <v-form v-model="formIsValid" @submit.prevent="sendResetLink" class="login-form">
            <v-text-field
              v-model="email"
              label="Email"
              placeholder="example@example.net"
              variant="outlined"
              density="comfortable"
              class="input-field"
              :rules="emailRules"
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
              POŠALJI LINK ZA RESETOVANJE
            </v-btn>
          </v-form>

          <div class="forgot-link">
            <a href="#" @click.prevent="router.push('/login')">Login</a>
          </div>

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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import api from '@/axios'; // Uklonjeno za sada, dodajemo kasnije za logiku

const router = useRouter();

const email = ref('');
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null); // Dodato za poruku o uspehu
const loading = ref(false);
const formIsValid = ref(false);

const emailRules = [
  (v: string) => !!v || 'Email je obavezan',
  (v: string) => /.+@.+\..+/.test(v) || 'Email nije validan',
];

// Ova funkcija će za sada biti prazna, dodaćemo logiku u sledećem koraku
async function sendResetLink() {
  if (!formIsValid.value) {
    errorMsg.value = 'Molimo unesite validan email.';
    return;
  }

  loading.value = true;
  errorMsg.value = null;
  successMsg.value = null;

  try {
    // Logika za slanje zahteva ka backendu će ići ovde
    // Na primer:
    // const response = await api.post('/forgot-password', { email: email.value });
    // successMsg.value = response.data.message || 'Link za resetovanje šifre je poslat na vašu e-mail adresu.';

    console.log('Slanje linka za resetovanje šifre na:', email.value);
    successMsg.value = 'Test poruka: Link za resetovanje šifre je poslat (logika će biti dodata).';

    // Resetuj polje nakon slanja (opciono)
    email.value = '';
    
  } catch (error: any) {
    console.error('Greška pri slanju linka za resetovanje:', error);
    // errorMsg.value = error.response?.data?.message || 'Došlo je do greške pri slanju linka.';
    errorMsg.value = 'Test poruka: Došlo je do greške pri slanju linka (logika će biti dodata).';

  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Svi stilovi su preuzeti direktno sa login stranice */
.login-bg {
  min-height: 100vh;
  width: 100vw;
  background: url('@/assets/background.png') no-repeat center center; /* Proveri putanju do slike */
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
  height: 394px; /* Ostavljeno isto, pošto si tražio identičnu veličinu */
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
  margin-top: 20px; /* Možda će trebati prilagoditi ako je forma kraća */
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
.success-text {
  color: #4CAF50; 
  font-size: 13px;
  margin-top: -8px;
  margin-bottom: 6px;
  text-align: left;
  width: 100%;
}
</style>