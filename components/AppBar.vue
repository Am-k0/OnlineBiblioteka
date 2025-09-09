<template>
  <v-app-bar
    flat
    height="72"
    class="pa-0 d-flex flex-row"
    style="width: 100%; position: fixed; top: 0; z-index: 10;"
  >
    <NuxtLink
      to="/"
      class="d-flex align-center"
      style="
        height: 72px;
        width: 273px;
        background-color: #2D8CE4;
        padding: 16px 32px;
        gap: 16px;
        cursor: pointer;
        text-decoration: none;
      "
    >
      <img 
        src="/images/logo-1.png" 
        alt="Logo" 
        style="height: 24px; width: 24px;"
        class="mr-2"
      >
      <span class="text-white custom-text-style">
        Online Biblioteka
      </span>
    </NuxtLink>

    <div
      class="d-flex align-center justify-end"
      style="
        flex: 1;
        height: 72px;
        background-color: #3392EA;
        padding-left: 16px;
        padding-right: 16px; 
        gap: 8px; 
      "
    >
      <v-btn icon to="/dashboard" style="width: 24px; height: 24px;">
        <v-icon color="white" size="24">mdi-bell-outline</v-icon>
      </v-btn>

      <span class="text-white font-weight-bold" style="
        width: 1px;
        height: 26px;
        border-right: 1px solid white;
        opacity: 1;
      "></span>
      
      <v-menu v-if="user?.role === 'librarian'" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" style="width: 24px; height: 24px;">
            <v-icon color="white" size="24">mdi-plus</v-icon>
          </v-btn>
        </template>
        
        <v-list class="custom-menu-list">
          <v-list-item
            v-for="(item, index) in items"
            :key="index"
            :to="item.to"
            :active-color="'#3392EA'"
            class="custom-list-item"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon" size="24"></v-icon>
            </template>
            <v-list-item-title class="custom-title">{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <div 
            v-bind="props"
            class="d-flex align-center" 
            style="
              height: 40px;
              padding-left: 8px; 
              gap: 16px;
              cursor: pointer;
            "
          >
            <span class="text-white custom-text-style">bildstudio</span> 
            <v-avatar
              size="40"
              image="/images/default-user-1.jpg"
            ></v-avatar>
          </div>
        </template>
        
        <v-list class="avatar-menu-list">
          <v-list-item
            :to="profileLink"
            active-color="#3392EA"
            class="custom-list-item"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-account" size="24"></v-icon>
            </template>
            <v-list-item-title class="custom-title">Profil</v-list-item-title>
          </v-list-item>
          
          <v-list-item
            @click="logout"
            active-color="#3392EA"
            class="custom-list-item"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-logout" size="24"></v-icon>
            </template>
            <v-list-item-title class="custom-title">Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Definišemo tip za korisnika da bismo izbjegli greške
interface User {
  role: string;
  username: string;
  // Dodajte ostala polja po potrebi
}

const items = [
  { title: 'Bibliotekar', icon: 'mdi-account', to: '/newLibrarian' },
  { title: 'Ucenik', icon: 'mdi-account-group', to: '/newStudent' },
  { title: 'Knjiga', icon: 'mdi-book-open-page-variant', to: '/newBook' },
  { title: 'Autor', icon: 'mdi-clipboard-text', to: '/newAuthor' },
];

// IZMJENA OVDJE: Dodajemo reaktivnu varijablu za čuvanje podataka o korisniku
const user = ref<User | null>(null);

// IZMJENA OVDJE: Učitavamo podatke o korisniku kada se komponenta montira (samo na klijentu)
onMounted(() => {
  if (process.client) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error("Greška pri parsiranju korisničkih podataka iz local storage-a:", e);
      }
    }
  }
});

const profileLink = computed(() => {
  // Koristimo reaktivnu `user` varijablu umjesto direktnog pristupa localStorage
  if (user.value && user.value.username) {
    return `/users/${user.value.username}`;
  }
  return '/'; 
});

const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  user.value = null; // Očisti stanje korisnika
  router.push('/login');
};
</script>

<style scoped>
.custom-text-style {
  font-family: 'Roboto', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 100%;
  letter-spacing: 0%;
  vertical-align: middle;
}

.custom-menu-list {
  min-width: 317px !important;
  max-width: 317px !important;
  height: 208px;
}
.avatar-menu-list {
  min-width: 200px !important;
  max-width: 200px !important;
  border-radius: 8px;
  overflow: hidden;
}

.custom-list-item {
  height: 52px;
}

.custom-title {
  font-family: 'Roboto', sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  line-height: 100% !important;
  letter-spacing: 0.25px !important;
}

/* Stil za aktivnu stavku */
.v-list-item--active .custom-title {
  color: #3392EA !important;
}

.v-list-item--active .v-list-item__prepend .v-icon {
  color: #3392EA !important;
}
</style>