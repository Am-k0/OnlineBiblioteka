<template>
  <div class="table-container">
    <div class="header-section">
      <v-text-field
        v-model="searchQuery"
        append-inner-icon="mdi-magnify"
        placeholder="Pretraži knjige..."
        variant="plain"
        density="compact"
        class="search-field"
        clearable
        @input="handleSearch"
      />
    </div>

    <div>
      <v-data-table
        :headers="visibleHeaders"
        :items="formattedReservations"
        :loading="loading"
        loading-text="Učitavam arhivirane rezervacije..."
        item-value="id"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        hide-default-footer
        hover
        class="no-border-table"
        :item-class="itemClass"
      >
        <template v-slot:item.naziv_knjige="{ item }">
          <div class="cell-naziv d-flex align-center">
            <div class="book-cover-wrapper mr-2">
              <img :src="getImageUrl(item)" :alt="item.naziv_knjige" />
            </div>
            <span class="naziv-text">{{ item.naziv_knjige }}</span>
          </div>
        </template>

        <template v-slot:item.datum_rezervacije="{ item }">
          <span class="datum-text">{{ formatDate(item.datum_rezervacije) }}</span>
        </template>

        <template v-slot:item.rezervacija_istekla="{ item }">
          <span class="datum-text">{{ formatDate(item.rezervacija_istekla) }}</span>
        </template>

        <template v-slot:item.rezervaciju_podnio="{ item }">
          <span class="naziv-text">{{ item.rezervaciju_podnio }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip 
            :class="getStatusClass(item.status)"
            size="small" 
            class="status-chip"
            :variant="getStatusVariant(item.status)"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <ActionMenu
              :item="item"
              :show-view="true"
              @view="viewDetails"
            />
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-remove-outline</v-icon>
            <h3 class="text-h6 mb-2 text-grey-darken-1">Nema arhiviranih rezervacija</h3>
            <p class="text-body-2 text-grey">Sve rezervacije su trenutno aktivne ili nema podataka.</p>
          </div>
        </template>
      </v-data-table>

      <PaginationFooter
        v-model:itemsPerPage="itemsPerPage"
        v-model:currentPage="currentPage"
        :total-items="totalItems"
        class="pagination-footer mt-4"
        @update:itemsPerPage="handleItemsPerPageChange"
        @update:currentPage="handlePageChange"
      />

      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import PaginationFooter from '@/components/PaginationFooter.vue';
// DODATO: Uvoz ActionMenu komponente
import ActionMenu from '@/components/ActionMenu.vue';

// --- STANJE (STATE) ---
const router = useRouter();
const archivedReservations = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

// API konfiguracija
const apiBaseUrl = 'http://localhost';
const defaultBookCover = '/images/default-book-1.jpg';
const defaultAvatar = '/images/default-user-1.jpg';

// --- KONFIGURACIJA TABELE ---
// MODIFIKOVANO: Dodata kolona za akcije
const visibleHeaders = [
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Datum rezervacije', key: 'datum_rezervacije', sortable: true },
  { title: 'Rezervacija ističe', key: 'rezervacija_istekla', sortable: true },
  { title: 'Rezervaciju podnio', key: 'rezervaciju_podnio', sortable: true },
  { title: 'Status', key: 'status', sortable: true, align: 'center' },
  { title: '', key: 'actions', sortable: false, align: 'end' }, // Nova kolona
];

const itemClass = () => 'table-row';

// --- COMPUTED VRIJEDNOSTI ---
const filteredReservations = computed(() => {
  return archivedReservations.value.filter(reservation => reservation.status !== 'rejected');
});

const formattedReservations = computed(() => {
  return filteredReservations.value.map(reservation => {
    const bookName = reservation.book?.name || 'Nepoznat naslov';
    const studentName = `${reservation.student?.first_name || ''} ${reservation.student?.last_name || ''}`.trim() || 'Nepoznat korisnik';

    return {
      id: reservation.id,
      naziv_knjige: bookName,
      slika_knjige: reservation.book?.cover_image,
      datum_rezervacije: reservation.reserved_at,
      rezervacija_istekla: reservation.expires_at,
      rezervaciju_podnio: studentName,
      status: reservation.status,
    };
  });
});

// --- HELPER FUNKCIJE ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`;
  } catch (err) {
    return dateString;
  }
};

const getStatusVariant = (status) => {
    return (status === 'rented' || status === 'expired' || status === 'cancelled' || status === 'rejected') ? 'outlined' : 'flat';
};

const getStatusText = (status) => {
  switch (status) {
    case 'rented':
      return 'Izdato';
    case 'expired':
      return 'Rezervacija istekla';
    case 'cancelled':
      return 'Rezervacija otkazana';
    case 'rejected':
      return 'Odbijena';
    default:
      return status;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'rented':
      return 'status-rented';
    case 'rejected':
      return 'status-rejected';
    case 'cancelled':
      return 'status-cancelled';
    case 'expired':
        return 'status-expired';
    default:
      return '';
  }
};

const getImageUrl = (item) => {
  const imagePath = item.slika_knjige || null;
  if (imagePath) {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${apiBaseUrl}/storage/${imagePath}`;
  }
  return defaultBookCover;
};

// --- API FUNKCIJE ---
async function fetchArchivedReservations() {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Niste prijavljeni');
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
    
    const params = {
      page: currentPage.value,
      per_page: itemsPerPage.value,
      search_value: searchQuery.value,
    };

    const response = await axios.get(`${apiBaseUrl}/api/reservations/archived`, { ...authHeaders, params });
    
    archivedReservations.value = response.data.reservations.data || [];
    totalItems.value = response.data.reservations.total || 0;
    
  } catch (err) {
    console.error('Greška pri učitavanju arhiviranih rezervacija:', err);
    error.value = 'Greška pri učitavanju arhiviranih rezervacija: ' + 
      (err.response?.data?.message || err.message || 'Nepoznata greška');
    
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
}

// --- HANDLER FUNKCIJE ---
// DODATO: Funkcija za navigaciju na detalje
const viewDetails = (item) => {
  router.push(`/loan-management/reservation/${item.id}`);
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchArchivedReservations();
};

const handleItemsPerPageChange = () => {
  currentPage.value = 1;
  fetchArchivedReservations();
};

const handlePageChange = () => {
  fetchArchivedReservations();
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  fetchArchivedReservations();
});

watch([itemsPerPage, currentPage], () => {
  if(!loading.value) {
     fetchArchivedReservations();
  }
})
</script>

<style scoped>
/* Osnovni stilovi ostaju nepromijenjeni, samo dodajemo nove */
.table-container {
  flex-grow: 1;
  padding: 0 24px 24px 24px;
  background-color: #fff;
}
.header-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: -14px;
}
.search-field { max-width: 300px; }
.search-field .v-input__control { border: none !important; box-shadow: none !important; }
.search-field .v-field__outline { display: none; }
.search-field .v-field__prepend-inner { padding-left: 0; margin-right: 8px; }
.search-field .v-field__input { padding-left: 0; }
.no-border-table { border: none; box-shadow: none; }
.no-border-table .v-data-table__wrapper table,
.no-border-table .v-data-table__wrapper table thead,
.no-border-table .v-data-table__wrapper table tbody,
.no-border-table .v-data-table__wrapper table tr,
.no-border-table .v-data-table__wrapper table th,
.no-border-table .v-data-table__wrapper table td { border: none !important; border-bottom: none !important; box-shadow: none !important; }

.no-border-table .v-data-table__wrapper > table > thead > tr > th {
  border-bottom: 1px solid #E0E0E0 !important;
  font-size: 12px;
  color: #616161 !important;
  text-transform: uppercase;
  font-weight: 500;
}

.no-border-table .v-data-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid #E0E0E0 !important;
}

.table-row { height: 56px !important; }

.cell-naziv, .cell-profile { width: 100%; overflow: hidden; }

.book-cover-wrapper {
  width: 32px;
  height: 52px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 4px;
  margin-right: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 50%;
  margin-right: 12px;
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }

.naziv-text, .datum-text {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.2;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #212121;
}

.status-chip {
  font-size: 11px;
  font-weight: 500;
  height: 24px;
  padding: 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
}

.cell-status { display: flex; justify-content: center; align-items: center; }

/* Novi stilovi za izgled statusa */
.status-rented {
  color: #3392EA !important;
  border-color: #3392EA !important;
}
.status-rejected {
  color: #CF2A27 !important;
  border-color: #CF2A27 !important;
}
.status-cancelled {
  color: #757575 !important;
  border-color: #757575 !important;
}
.status-expired {
  color: #CF2A27 !important;
  border-color: #CF2A27 !important;
}
</style>