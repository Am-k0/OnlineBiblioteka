<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <h1 class="page-title">Učenici</h1>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="header-actions">
        <v-btn
          color="primary"
          class="add-button"
          @click="onAddKorisnik"
          prepend-icon="mdi-plus"
        >
          NOVI UČENIK
        </v-btn>
        <div class="search-wrapper">
          <v-text-field
            v-model="search"
            placeholder="Pretraži učenike..."
            hide-details
            density="compact"
            variant="solo"
            flat
            rounded
            class="search-field"
            append-inner-icon="mdi-magnify"
          />
        </div>
      </div>
      <UsersTable :search="search" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UsersTable from '~/components/usersTable.vue'

const search = ref('')
const router = useRouter()

const onAddKorisnik = () => {
  router.push('/newStudent')
}
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  padding: 24px 24px 0 24px;
}

.page-title {
  font-family: 'Roboto', sans-serif !important;
  font-size: 20px;
  font-weight: 500;
  color: #222;
  line-height: 100%;
  letter-spacing: 0.15px;
  vertical-align: middle;
  margin: 0;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 20px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-left: 0;
  padding-right: 24px;
}

.add-button {
  font-weight: 500 !important;
  font-size: 14px !important;
  line-height: 100% !important;
  letter-spacing: 1.25px !important;
  vertical-align: middle;
  width: 147px !important;
  height: 36px !important;
  border-radius: 4px !important;
  background-color: #3392EA !important;
  color: white !important;
  text-transform: uppercase;
  padding: 12px 16px 12px 12px !important;
  gap: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: none !important;
}

.search-field {
  font-family: 'Roboto', sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  line-height: 100% !important;
  letter-spacing: 0.25px !important;
  width: 132px;
  height: 24px;
  border: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.search-field :deep(input) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 14px;
  min-height: unset !important;
  height: 24px !important;
}

.search-field :deep(.v-field__overlay) {
    background-color: transparent !important;
}

.search-field :deep(.v-field__outline) {
    border: none !important;
}

.search-field :deep(.v-field__field) {
    height: 24px !important;
    padding: 0 !important;
}

.search-field :deep(.v-field__append-inner) {
    height: 24px !important;
    align-items: center;
    padding-top: 0 !important;
}

.search-field :deep(.v-icon) {
  font-size: 24px !important;
  opacity: 0.6;
}
</style>