<template>
  <v-app>
    <!-- Sakrij AppBar i SideBar ako je ruta /login -->
    <AppBar v-if="showLayout" />
    <SideBar v-if="showLayout" />

    <v-main :class="{ 'main-content': showLayout }">
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRoute } from '#app'
import { computed } from 'vue'
import AppBar from '~/components/AppBar.vue'
import SideBar from '~/components/sidebar.vue'

const route = useRoute()

// Ako nije login stranica, prikazuj layout
const showLayout = computed(() => route.path !== '/login')
</script>

<style scoped>
.main-content {
  background-color: #F5F7FA;
  padding-top: 72px; /* da ne pokrije appbar */
}
</style>
