<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Autori</h1>
      <div class="header-actions">
        <v-btn color="primary" class="add-button" @click="onAddAutor" prepend-icon="mdi-plus">
          NOVI AUTOR
        </v-btn>
        <div class="search-wrapper">
          <v-text-field
            v-model="search"
            placeholder="Pretraži autore..."
            hide-details
            density="compact"
            variant="solo"
            flat
            rounded
            class="search-field"
            append-inner-icon="mdi-magnify"
            @keyup.enter="onSearch"
          />
        </div>
      </div>
    </div>
    <AutoriTable :search="search" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AutoriTable from '@/components/AutoriTable.vue'

const search = ref('')
const router = useRouter()
const onAddAutor = () => router.push('/newauthor')
const onSearch = () => {} // pretraga je reaktivna, nije potreban poseban handler
</script>



<style scoped>
.page-container {
  padding: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
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

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.add-button {
  font-family: 'Roboto', sans-serif !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  line-height: 100% !important;
  letter-spacing: 1.25px !important;
  width: 147px !important;
  height: 36px !important;
  align-items: center;
  justify-content: center;
  background-color: #3392EA !important;
  color: white !important;
}

.search-field {
  font-family: 'Roboto', sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  line-height: 100% !important;
  letter-spacing: 0.25px !important;
  width: 132px;
  height: 24px;
}

.search-field :deep(input) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 14px;
}

.search-field :deep(.v-icon) {
  font-size: 24px !important;
  opacity: 0.6;
 
}



</style>
