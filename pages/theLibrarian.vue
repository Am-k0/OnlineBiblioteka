<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <h1 class="page-title">Bibliotekari</h1>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="header-actions">
        <v-btn
          color="primary"
          class="add-button"
          @click="onAddBibliotekar"
          prepend-icon="mdi-plus"
        >
          NOVI BIBLIOTEKAR
        </v-btn>
        <div class="search-wrapper">
          <v-text-field
            v-model="search"
            placeholder="Pretraži bibliotekare..."
            hide-details
            density="compact"
            variant="solo"
            flat
            rounded
            class="search-field"
            append-inner-icon="mdi-magnify"
            @input="handleSearchInput"
          />
        </div>
      </div>
      <UsersTable
        :items="users"
        :loading="loading"
        :initial-current-page="currentPage"
        :initial-items-per-page="itemsPerPage"
        :total-items="totalItems"
        :error="errorMessage"
        :role-map="roleMap"
        entity-display-name="bibliotekara" @update:itemsPerPage="updateItemsPerPage"
        @update:currentPage="updateCurrentPage"
        @view="handleViewUser"
        @edit="handleEditUser"
        @delete="handleDeleteUser"
        @retry-fetch="fetchUsers"
        :hide-table-borders="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import UsersTable from '~/components/usersTable.vue' 
import api from '@/axios' 

const search = ref('')
const router = useRouter()

const users = ref([])
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(20)
const totalItems = ref(0)
const errorMessage = ref(null)

const roleMap = {
  1: 'Učenik',       
  2: 'Bibliotekar',  
};

const fetchUsers = async () => {
  console.log(`[LibrarianPage] Dohvaćam bibliotekare. Stranica: ${currentPage.value}, Po stranici: ${itemsPerPage.value}, Pretraga: ${search.value}`);
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await api.get('/users', {
      params: {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search_value: search.value,
        role_id: 2, // Filter za bibliotekare
      }
    });

    console.log('[LibrarianPage] API odgovor za bibliotekare:', response.data);

    const paginationData = response.data.data;
    users.value = paginationData.data;
    totalItems.value = paginationData.total;
    currentPage.value = paginationData.current_page;
    itemsPerPage.value = paginationData.per_page;
    console.log(`[LibrarianPage] Podaci ažurirani. Ukupno: ${totalItems.value}, Trenutna stranica: ${currentPage.value}`);

  } catch (error) {
    console.error('[LibrarianPage] Greška pri dohvatanju bibliotekara:', error);
    if (error.response) {
      console.error('[LibrarianPage] Greška u odgovoru API-ja:', error.response.data);
      if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
      } else if (error.response.data && error.response.data.errors) {
        errorMessage.value = Object.values(error.response.data.errors).flat().join(', ');
      } else {
        errorMessage.value = `Greška: ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage.value = 'Nema odgovora od servera. Proverite mrežnu konekciju.';
    } else {
      errorMessage.value = 'Desila se neočekivana greška. Pokušajte ponovo.';
    }
    users.value = [];
    totalItems.value = 0;
    currentPage.value = 1;
    itemsPerPage.value = 20;
  } finally {
    loading.value = false;
    console.log('[LibrarianPage] Završeno dohvatanje bibliotekara. Loading: false');
  }
};

onMounted(() => {
  console.log('[LibrarianPage] Komponenta montirana. Pokrećem dohvatanje bibliotekara.');
  fetchUsers();
});

watch([currentPage, itemsPerPage], () => {
  console.log(`[LibrarianPage] currentPage ili itemsPerPage se promenio. Pokrećem novo dohvatanje.`);
  fetchUsers();
});

let searchTimeout = null;
const handleSearchInput = () => {
  console.log('[LibrarianPage] Unos u pretragu:', search.value);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    console.log('[LibrarianPage] Debounced search. Resetujem stranicu na 1 i dohvaćam.');
    currentPage.value = 1;
    fetchUsers();
  }, 500);
};

const updateItemsPerPage = (value) => {
  console.log('[LibrarianPage] updateItemsPerPage pozvan:', value);
  itemsPerPage.value = value;
  currentPage.value = 1;
};

const updateCurrentPage = (value) => {
  console.log('[LibrarianPage] updateCurrentPage pozvan:', value);
  currentPage.value = value;
};

const handleViewUser = (user) => {
  console.log('[LibrarianPage] Prikaz korisnika (detalji):', user);
  if (user.username) {
    router.push(`/users/${user.username}`); 
  } else {
    errorMessage.value = 'Korisničko ime nije dostupno za prikaz detalja.';
  }
};

const handleEditUser = (user) => {
  console.log('[LibrarianPage] Uređivanje korisnika:', user);
  router.push(`/users/edit/${user.id}`);
};

const handleDeleteUser = async (user) => {
  console.log('[LibrarianPage] Pokušaj brisanja korisnika:', user);
  try {
    loading.value = true;
    await api.delete(`/users`, { data: { users_id: [user.id] } }); 
    console.log('[LibrarianPage] Korisnik uspešno obrisan:', user);
    fetchUsers(); 
  } catch (error) {
    console.error('[LibrarianPage] Greška pri brisanju korisnika:', error);
    if (error.response) {
      errorMessage.value = error.response.data.message || 'Greška pri brisanja korisnika.';
    } else {
      errorMessage.value = 'Greška pri brisanja korisnika. Nema odgovora od servera.';
    }
  } finally {
    loading.value = false;
    console.log('[LibrarianPage] Završeno brisanje korisnika. Loading: false');
  }
};

const onAddBibliotekar = () => {
  console.log('[LibrarianPage] Preusmeravam na stranicu za dodavanje novog bibliotekara.');
  router.push('/newLibrarian')
}
</script>

<style scoped>
.page-container {
  padding: 0; 
  background-color: white; 
  display: flex;
  flex-direction: column;
  min-height: 100vh; 
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
  padding-right: 0; 
}

.add-button {
  font-weight: 500 !important;
  font-size: 14px !important;
  line-height: 100% !important; 
  letter-spacing: 1.25px !important;
  vertical-align: middle;
  width: 195px !important;
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
  width: 170px;
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