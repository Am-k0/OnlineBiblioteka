<template>
  <div class="page-layout d-flex">
    <LoansNavigation />
    <div class="content-area">
      <div class="header-section mb-4">
        <h2>Arhivirane rezervacije</h2>
        <v-text-field
          v-model="searchQuery"
          append-inner-icon="mdi-magnify"
          placeholder="Pretraži rezervacije..."
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
          :items="archivedReservations"
          :loading="loading"
          loading-text="Učitavam arhivirane rezervacije..."
          item-value="id"
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
            <v-chip :color="getStatusColor(item.status)" variant="tonal" label size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="cell-actions">
              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="handleDetails(item)" prepend-icon="mdi-eye-outline">
                    <v-list-item-title>Pogledaj detalje</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/axios';
import LoansNavigation from '@/components/LoansNavigation.vue';
import PaginationFooter from '@/components/PaginationFooter.vue';

// --- STANJE (STATE) ---
const router = useRouter();
const archivedReservations = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

// Paginacija
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

// API konfiguracija
const apiBaseUrl = 'http://localhost'; // Pretpostavljeni API URL
const defaultBookCover = '/images/default-book-1.jpg';

// --- KONFIGURACIJA TABELE ---
const visibleHeaders = [
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Datum rezervacije', key: 'datum_rezervacije', sortable: true },
  { title: 'Rezervacija ističe', key: 'rezervacija_istekla', sortable: true },
  { title: 'Rezervaciju podnio', key: 'rezervaciju_podnio', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
];

const itemClass = () => 'table-row';

// --- HELPER FUNKCIJE ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (err) {
    return dateString;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'izdato':
      return 'success';
    case 'isteklo':
      return 'error';
    case 'otkazano':
      return 'warning';
    default:
      return 'info';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'izdato':
      return 'Izdato';
    case 'isteklo':
      return 'Istekla';
    case 'otkazano':
      return 'Otkazana';
    default:
      return status;
  }
};

const getImageUrl = (item) => {
  // KOMENTAR ZA BACKEND: Ovde se pretpostavlja da API vraća putanju do slike knjige unutar objekta 'item'.
  // Ako je struktura drugačija, npr. `item.book.cover_image`, potrebno je prilagoditi ovu liniju.
  const imagePath = item.book?.cover_image || null;
  if (imagePath) {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // KOMENTAR ZA BACKEND: Putanja do slike na serveru. Prilagodite `${apiBaseUrl}/storage/${imagePath}`
    // ukoliko je putanja drugačija na Vašem backendu.
    return `${apiBaseUrl}/storage/${imagePath}`;
  }
  return defaultBookCover;
};

// --- API FUNKCIJE ---
async function fetchArchivedReservations(page = 1, perPage = 20, search = '') {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Niste prijavljeni');
    }

    const params = {
      per_page: perPage,
      page: page,
      // KOMENTAR ZA BACKEND: Parametar za filtriranje rezervacija po statusu.
      // Pretpostavlja se da će backend prepoznati 'archived' status.
      // Ako vaš backend koristi drugi parametar (npr. 'is_archived: true'), prilagodite ga.
      status: 'archived',
    };

    // KOMENTAR ZA BACKEND: Parametar za pretragu. 'search_value' je pretpostavljeni naziv.
    // Ako vaš backend koristi drugi naziv (npr. 'query', 'search'), prilagodite ga.
    if (search) params.search_value = search;

    // KOMENTAR ZA BACKEND: Endpoint za dohvatanje rezervacija.
    // Pretpostavljam da je putanja `/api/reservations`. Prilagodite ovu putanju ukoliko je drugačija.
    const response = await axios.get(`${apiBaseUrl}/api/reservations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    });
    
    // KOMENTAR ZA BACKEND: Struktura API odgovora.
    // Pretpostavljam da su podaci unutar `response.data.data.data`.
    // Totalni broj stavki za paginaciju se nalazi u `response.data.data.total`.
    // Ukoliko je struktura drugačija (npr. `response.data.reservations`), prilagodite putanje.
    const reservationsData = response.data?.data?.data || [];
    
    // Mapiramo podatke iz API-ja u format koji nam je potreban za tabelu
    archivedReservations.value = reservationsData.map(reservation => ({
      id: reservation.id,
      // KOMENTAR ZA BACKEND: Dohvatanje naziva knjige.
      // Pretpostavlja se da je knjiga ugnježdeni objekat unutar rezervacije, sa nazivom 'title'.
      // Npr. `reservation.book.title`. Prilagodite ukoliko je drugačije.
      naziv_knjige: reservation.book?.title || 'Nepoznat naslov',
      book: reservation.book, // Čuvamo ceo book objekat za sliku
      // KOMENTAR ZA BACKEND: Polja za datume.
      // Pretpostavljaju se nazivi `start_date` i `end_date`. Prilagodite ukoliko su drugačiji.
      datum_rezervacije: reservation.start_date,
      rezervacija_istekla: reservation.end_date,
      // KOMENTAR ZA BACKEND: Dohvatanje imena i prezimena korisnika.
      // Pretpostavlja se da je korisnik ugnježdeni objekat `reserved_by` sa poljima `name` i `last_name`.
      // Prilagodite ukoliko je drugačije.
      rezervaciju_podnio: `${reservation.reserved_by?.name || ''} ${reservation.reserved_by?.last_name || ''}`.trim() || 'Nepoznat korisnik',
      // KOMENTAR ZA BACKEND: Polje za status.
      // Status bi trebalo da bude tekstualna vrednost (npr. 'izdato', 'isteklo', 'otkazano').
      status: reservation.status,
    }));
    
    totalItems.value = response.data?.data?.total || 0;

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
const handleSearch = () => {
  // KOMENTAR ZA BACKEND: Pri pretrazi, resetujemo stranicu na 1 i ponovo dohvatamo podatke sa novim parametrom za pretragu.
  currentPage.value = 1;
  fetchArchivedReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  currentPage.value = 1; // Resetujemo na prvu stranicu pri promeni broja stavki
  // KOMENTAR ZA BACKEND: Poziv API-ja sa novim brojem stavki po stranici.
  fetchArchivedReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  // KOMENTAR ZA BACKEND: Poziv API-ja sa novom stranicom.
  fetchArchivedReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handleDetails = (item) => {
  if (item && item.id) {
    // KOMENTAR ZA BACKEND: Mesto za preusmeravanje na stranicu sa detaljima rezervacije.
    // Putanja bi trebalo da sadrži ID rezervacije, npr. `/reservations/${item.id}`.
    console.log('Pogledaj detalje za rezervaciju:', item.id);
  }
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  // KOMENTAR ZA BACKEND: Inicijalni poziv za dohvatanje podataka kada se stranica učita.
  fetchArchivedReservations();
});

// --- WATCHERS ---
watch([itemsPerPage, currentPage], () => {
  // KOMENTAR ZA BACKEND: 'Watcher' koji automatski ponovo poziva API svaki put kada se
  // promene `itemsPerPage` ili `currentPage`.
  fetchArchivedReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
});
</script>

<style scoped>
/* Ostatak stila je isti kao u prethodnim verzijama */
.page-layout {
  display: flex;
  height: 100vh;
}
.content-area {
  flex-grow: 1;
  padding: 24px;
  background-color: #f5f6f8;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-field {
  max-width: 300px;
}

.search-field .v-input__control {
  border: none !important;
  box-shadow: none !important;
}

.search-field .v-field__outline {
  display: none;
}

.no-border-table {
  border: none;
  box-shadow: none;
}

.table-row {
  height: 56px !important;
}

.cell-naziv {
  width: 100%;
  overflow: hidden;
}

.book-cover-wrapper {
  width: 32px;
  height: 52px;
  overflow: hidden;
  flex-shrink: 0;
}

.book-cover-wrapper img {
  width: 32px;
  height: 52px;
  object-fit: cover;
  display: block;
}

.naziv-text,
.datum-text,
.broj-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}
</style>