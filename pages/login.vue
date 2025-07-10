<template>
  <div class="login-container">
    <v-card class="mx-auto pa-8" elevation="8" max-width="400" rounded="lg">
      <div class="login-title">Online biblioteka</div>
      <v-form v-model="formIsValid">
        <v-text-field
          v-model="account.email"
          label="Email"
          placeholder="example@example.net"
          variant="outlined"
          density="compact"
          class="mb-4"
          :rules="emailRules"
        />
        <v-text-field
          v-model="account.password"
          label="Password"
          placeholder="Password"
          :type="visible ? 'text' : 'password'"
          variant="outlined"
          density="compact"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="visible = !visible"
          class="mb-2"
          :rules="passwordRules"
        />
        <v-btn
          class="mb-2"
          color="blue"
          size="large"
          block
          type="submit"
          :disabled="!formIsValid"
          :loading="loading"
          @click.prevent="login"
        >
          Log In
        </v-btn>
        <div v-if="errorMsg" class="text-red-600 text-sm mt-2">{{ errorMsg }}</div>
      </v-form>

      <div class="forgot-link">
        <a class="text-blue text-decoration-none" href="#">Forgot password?</a>
      </div>
      <div class="login-footer">
        ©2025 ICT Cortex. All rights reserved.
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const visible = ref(false)
const formIsValid = ref(false)
const loading = ref(false)
const account = ref({ email: '', password: '' })
const errorMsg = ref('')

const emailRules = [
  v => /.+@.+\..+/.test(v) || 'Email nije validan',
]
const passwordRules = [
  v => (v && v.length >= 6) || 'Lozinka mora imati bar 6 karaktera',
]

const login = async () => {
  if (!formIsValid.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    // Slanje POST zahteva na backend
    const response = await $fetch('http://localhost:80/api/login', {
      method: 'POST',
      body: account.value,
    })
    // Očekuje se da backend vrati { token: '...' }
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
      account.value.email = ''
      account.value.password = ''
      await router.push('/')
    } else {
      errorMsg.value = 'Login nije uspeo. Proverite podatke.'
    }
  } catch (e) {
    errorMsg.value = e?.data?.message || 'Pogrešni login podaci'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
}
.login-title {
  font-weight: bold;
  font-size: 1.3rem;
  margin-bottom: 16px;
  text-align: center;
}
.forgot-link {
  margin-top: 8px;
  text-align: left;
}
.login-footer {
  margin-top: 18px;
  font-size: 0.85rem;
  color: #888;
  text-align: center;
}
</style>
