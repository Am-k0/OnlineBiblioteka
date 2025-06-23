<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useRouter } from '#imports'

const client = useSupabaseClient()
const router = useRouter()

const credentials = ref({ email: '', password: '' })
const errorMsg = ref<string | null>(null)
const loading = ref(false)
const visible = ref(false)
const formIsValid = ref(false)

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email is not valid',
]
const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
  (v: string) =>
    /[a-zA-Z]/.test(v) && /\d/.test(v) ||
    'Password must contain at least one letter and one number',
]

async function signIn() {
  if (!formIsValid.value) return

  loading.value = true
  errorMsg.value = null

  try {
    const { error } = await client.auth.signInWithPassword({
      email: credentials.value.email,
      password: credentials.value.password,
    })
    if (error) throw error
    router.push('/')
  } catch (error: any) {
    errorMsg.value = 'Invalid login credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
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

        <!-- Pomereno ovde ispod forgot-link -->
        <div v-if="errorMsg" class="error-text">
          {{ errorMsg }}
        </div>

        <div class="login-footer">
          ©2021 ICT Cortex. All rights reserved.
        </div>
      </v-card>
    </div>
  </div>
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
