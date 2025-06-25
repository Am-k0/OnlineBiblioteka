<template>
  <div>
    <div class="header-container">
      <div class="left-section">
        <v-toolbar-title class="toolbar-title">
          Autori
        </v-toolbar-title>
        <v-btn color="primary" dark class="add-button" @click="onAddAutor">
          + NOVI AUTOR
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        placeholder="Pretraži autora ..."
        hide-details
        dense
        solo
        class="search-field"
        rounded
        prepend-inner-icon="mdi-magnify"
      />
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

const onAddAutor = () => {
  router.push('/newauthor')
}
</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 16px;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.search-field {
  width: 300px;
}

.search-field :deep(.v-input__control) {
  min-height: 36px !important;
}

.search-field :deep(.v-field) {
  border-radius: 18px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.add-button {
  height: 36px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  background-color: #1976D2 !important;
  color: white !important;
}
</style>
