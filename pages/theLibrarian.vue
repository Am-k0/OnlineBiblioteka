<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Bibliotekari</h1>
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
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import UsersTable from '~/components/usersTable.vue' // ✅ PROVERI PUTANJU!
import api from '@/axios' // ✅ PROVERI PUTANJU!

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
    router.push(`/thelibrarian/${user.username}`); // Navigacija po username-u
  } else {
    errorMessage.value = 'Korisničko ime nije dostupno za prikaz detalja.';
  }
};

const handleEditUser = (user) => {
  console.log('[LibrarianPage] Uređivanje korisnika:', user);
  router.push(`/thelibrarian/edit/${user.id}`);
};

const handleDeleteUser = async (user) => {
  console.log('[LibrarianPage] Pokušaj brisanja korisnika:', user);
  try {
    loading.value = true;
    await api.delete(`/users`, { data: { users_id: [user.id] } }); // API za brisanje po ID-u
    console.log('[LibrarianPage] Korisnik uspešno obrisan:', user);
    fetchUsers(); // Ponovo dohvati podatke nakon brisanja
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
/* Održavaš postojeće stilove */
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