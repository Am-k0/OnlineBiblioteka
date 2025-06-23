<template>
  <v-navigation-drawer
    expand-on-hover
    rail
    app
  >
    <v-list>
      <v-list-item prepend-icon="mdi-menu" title="Meni"></v-list-item>
    </v-list>

    <v-divider />

    <v-list density="compact" nav class="custom-icon-list">
      <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/" :class="{ 'active-icon': $route.path === '/' }" />
      <v-list-item prepend-icon="mdi-account" title="Bibliotekari" to="/TheLibrarian" :class="{ 'active-icon': $route.path === '/TheLibrarian' }" />
      <v-list-item prepend-icon="mdi-account-group" title="Učenici" to="/students" :class="{ 'active-icon': $route.path === '/students' }" />
      <v-list-item prepend-icon="mdi-book-open-page-variant" title="Knjige" to="/books" :class="{ 'active-icon': $route.path === '/books' }" />
      <v-list-item prepend-icon="mdi-clipboard-text" title="Autori" to="/authors" :class="{ 'active-icon': $route.path === '/authors' }" />
      <v-list-item prepend-icon="mdi-swap-horizontal" title="Izdavanje knjiga" to="/publicationOfBooks" :class="{ 'active-icon': $route.path === '/publicationOfBooks' }" />
    </v-list>

    <v-divider />

    <v-list density="compact" nav class="custom-icon-list">
      <v-list-item prepend-icon="mdi-cog" title="Podešavanja" to="/settings" :class="{ 'active-icon': $route.path === '/settings' }" />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useRoute } from '#app'
const $route = useRoute()
</script>




<style>
.active-icon .v-list-item__prepend .v-icon {
  color: #3392EA !important;
}

.custom-sidebar {
  width: 56px !important;
  height: 1008px !important;
  background-color: #F5F7FA !important;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: blur(4px);
}

.sidebar-list {
  gap: 10px;
}

.sidebar-item {
  padding: 16px !important;
  min-height: 56px !important;
}

/* .custom-icon-list .v-list-item__prepend > .v-icon {
  font-size: 56px;
  width: 56px;
  height: 56px;
}

.custom-icon-list .v-list-item__prepend {
  padding: 16px;
}

.custom-icon-list .v-list-item {
  margin-bottom: 10px;
}

.custom-icon-list .v-list-item__prepend {
  display: flex;
  align-items: center;
  justify-content: center;
} */

</style>