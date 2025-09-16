<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    app
    class="custom-sidebar"
  >
    <div class="d-flex flex-column" style="height: 100%;">
      <div>
        <v-list>
          <v-list-item
            :prepend-icon="rail ? 'mdi-menu' : 'mdi-close'"
            title=""
            class="toggle-menu-item"
            @click.stop="rail = !rail"
            style="min-height: 48px !important; padding-left: 16px !important; padding-right: 16px !important;"
          />
        </v-list>
        <v-divider style="margin-top: 0px;" />
      </div>

      <v-list density="compact" nav class="custom-icon-list">
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/"
          :class="{ 'active-link': $route.path === '/' }"
        />
        
        <v-list-item
          v-if="user?.role === 'librarian'"
          prepend-icon="mdi-account"
          title="Bibliotekari"
          to="/librarians"
          :class="{ 'active-link': $route.path === '/librarians' }"
        />
        
        <v-list-item
          v-if="user?.role === 'librarian'"
          prepend-icon="mdi-account-group"
          title="Učenici"
          to="/students"
          :class="{ 'active-link': $route.path === '/students' }"
        />
        
        <v-list-item
          prepend-icon="mdi-book"
          title="Knjige"
          to="/books"
          :class="{ 'active-link': $route.path === '/books' }"
        />
        
        <v-list-item
          prepend-icon="mdi-account-edit"
          title="Autori"
          to="/authors"
          :class="{ 'active-link': $route.path === '/authors' }"
        />
        
        <v-list-item
          prepend-icon="mdi-swap-horizontal"
          title="Izdavanje knjiga"
          to="/book-rental"
          :class="{ 'active-link': $route.path.startsWith('/book-rental') }"
        />
      </v-list>

      <v-spacer />

      <div>
        <v-divider />
        <v-list density="compact" nav class="custom-icon-list">
          <v-list-item
            v-if="user?.role === 'librarian'"
            prepend-icon="mdi-cog"
            title="Podešavanja"
            to="/settings"
            :class="{ 'active-link': $route.path === '/settings' }"
          />
        </v-list>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from '#app'

const $route = useRoute()
const drawer = ref(true)
const rail = ref(true)

const user = process.client
  ? JSON.parse(localStorage.getItem('user') || 'null')
  : null
</script>

<style scoped>
/* Boji aktivnu ikonicu i tekst u plavo */
.active-link :deep(.v-list-item__prepend .v-icon),
.active-link :deep(.v-list-item-title) {
  color: #3392EA !important;
}

.toggle-menu-item .v-list-item__prepend .v-icon {
  color: #666 !important;
  font-size: 24px !important;
}

.toggle-menu-item:hover .v-list-item__prepend .v-icon {
  color: #333 !important;
}

.v-navigation-drawer--rail .toggle-menu-item .v-list-item-title {
  display: none;
}
</style>