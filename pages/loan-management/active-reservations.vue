<template>
  <div class="page-layout d-flex">
    <LoansNavigation />
    <div class="content-area">
      <div class="header-section mb-4">
        <h2>Aktivne rezervacije</h2>
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
          :headers="headers"
          :items="formattedReservations"
          :loading="loading"
          loading-text="Učitavam aktivne rezervacije..."
          item-value="id"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          hide-default-footer
          hover
          show-select
          class="no-border-table"
          :item-class="itemClass"
        >
          <template v-slot:item.data-table-select="{ item }">
            <div class="h-[56px] flex items-center justify-center">
              <v-checkbox-btn :value="item.id" class="no-checkbox-border"></v-checkbox-btn>
            </div>
          </template>

          <template v-slot:item.naziv_knjige="{ item }">
            <div class="cell-naziv d-flex align-center">
              <div class="book-cover-wrapper mr-2">
                <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige" />
              </div>
              <span class="naziv-text">{{ item.naziv_knjige }}</span>
            </div>
          </template>

          <template v-slot:item.datum_rezervacije="{ item }">
            <span class="datum-text">{{ formatDate(item.datum_rezervacije) }}</span>
          </template>
          
          <template v-slot:item.rezervisano_uceniku="{ item }">
            <span class="naziv-text">{{ item.rezervisano_uceniku }}</span>
          </template>

          <template v-slot:item.rezervisano_uceniku_profile="{ item }">
            <div class="cell-profile d-flex align-center">
              <div class="profile-avatar mr-2">
                <img :src="item.avatar_url || defaultAvatar" alt="Avatar" />
              </div>
              <span class="naziv-text">{{ item.rezervisano_uceniku }}</span>
            </div>
          </template>

          <template v-slot:item.status="{ item }">
            <div class="cell-status">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="outlined"
                class="status-chip"
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="cell-actions">
              <ActionMenu
                :item="item"
                entity-name="rezervaciju"
                title-property="naziv_knjige"
                @view="handleView"
                @issue="handleIzdaj"
                @cancel="handleOtkazi"
                @extend="handleProdulji"
                @contact="handleKontakt"
                @error="setError"
              />
            </div>
          </template>

          <template #no-data>
            <v-alert>Nema pronađenih aktivnih rezervacija.</v-alert>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import LoansNavigation from '@/components/LoansNavigation.vue';
import ActionMenu from '@/components/ActionMenu.vue';
import PaginationFooter from '@/components/PaginationFooter.vue';

const router = useRouter();
const activeReservations = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const defaultBookCover = '/images/default-book-1.jpg';
const defaultAvatar = '/images/default-avatar.png';

// Paginacija
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

const apiBaseUrl = 'http://localhost';

// Definicija kolona za tabelu prema slici
const headers = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Datum rezervacije', key: 'datum_rezervacije', sortable: true },
  { title: 'Rezervisano učeniku', key: 'rezervisano_uceniku_profile', sortable: true },
  { title: 'Status', key: 'status', align: 'center', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
]);

const setError = (err) => {
  error.value = err;
  setTimeout(() => error.value = null, 5000);
};

// Funkcija za formatiranje datuma
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (err) {
    return dateString;
  }
};

// Funkcije za status
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'orange';
    case 'ready': return 'green';
    case 'expired': return 'red';
    case 'cancelled': return 'grey';
    default: return 'blue';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Na čekanju';
    case 'ready': return 'Spremna';
    case 'expired': return 'Istekla';
    case 'cancelled': return 'Otkazana';
    default: return 'Aktivna';
  }
};

// Funkcija za dohvatanje aktivnih rezervacija
const fetchActiveReservations = async (page = 1, perPage = 20, search = '') => {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');

    const params = {
      per_page: perPage,
      page: page,
      status: 'active', // Filtriramo samo aktivne rezervacije
    };
    if (search) params.search_value = search;

    // Endpoint za aktivne rezervacije
    const response = await axios.get(`${apiBaseUrl}/api/reservations`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      params,
    });
    
    const reservationsData = response.data.data?.data || [];
    activeReservations.value = reservationsData;
    totalItems.value = response.data.data?.total || 0;
  } catch (err) {
    error.value = 'Greška pri učitavanju aktivnih rezervacija: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška');
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

// Handleri za pretragu i paginaciju
const handleSearch = () => {
  currentPage.value = 1;
  fetchActiveReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  currentPage.value = 1;
  fetchActiveReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  fetchActiveReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
};

// Dohvatanje podataka prilikom montiranja komponente
onMounted(() => { 
  fetchActiveReservations(currentPage.value, itemsPerPage.value, searchQuery.value); 
});

// Kompjutovana properti za formatiranje podataka za tabelu
const formattedReservations = computed(() => {
  return activeReservations.value.map(reservation => {
    return {
      id: reservation.id,
      naziv_knjige: reservation.book?.title || reservation.book_title || 'Nepoznat naslov',
      datum_rezervacije: reservation.reservation_date || reservation.created_at,
      rezervisano_uceniku: `${reservation.user?.first_name || ''} ${reservation.user?.last_name || ''}`.trim() || 'Nepoznat učenik',
      status: reservation.status || 'active',
      slika_knjige: reservation.book?.cover_image || defaultBookCover,
      avatar_url: reservation.user?.avatar || defaultAvatar,
    };
  });
});

const itemClass = () => 'table-row';

// Handleri za akcije iz menija
const handleView = (item) => { 
  if (item && item.id) {
    console.log('Pogledaj detalje rezervacije:', item);
    // router.push(`/reservations/${item.id}`);
  }
};

const handleIzdaj = (item) => { 
  if (item && item.id) {
    console.log('Izdaj rezervisanu knjigu:', item);
    // Implementirati logiku za izdavanje knjige iz rezervacije
  }
};

const handleOtkazi = async (item) => { 
  if (item && item.id) {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${apiBaseUrl}/api/reservations/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Osvježi listu nakon brisanja
      fetchActiveReservations(currentPage.value, itemsPerPage.value, searchQuery.value);
    } catch (err) {
      setError('Greška pri otkazivanju rezervacije: ' + (err.response?.data?.message || err.message));
    }
  }
};

const handleProdulji = (item) => { 
  if (item && item.id) {
    console.log('Produži rezervaciju:', item);
    // Implementirati logiku za produžavanje rezervacije
  }
};

const handleKontakt = (item) => { 
  if (item && item.id) {
    console.log('Kontaktiraj učenika:', item);
    // Implementirati logiku za kontaktiranje učenika
  }
};
</script>

<style scoped>
/* Stilovi preuzeti i prilagođeni iz postojeće stranice */
.page-layout {
  display: flex;
  height: 100vh;
}
.content-area {
  flex-grow: 1;
  padding: 24px;
  background-color: #fff;
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
.no-border-table {
  border: none;
  box-shadow: none;
}
.no-border-table .v-data-table__wrapper table {
  border-collapse: collapse;
}
.no-border-table .v-data-table__wrapper > table > thead > tr > th,
.no-border-table .v-data-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid #E0E0E0 !important;
}
.table-row {
  height: 56px !important;
}
.cell-naziv,
.cell-profile {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}
.book-cover-wrapper {
  width: 32px;
  height: 48px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 2px;
  margin-right: 12px;
}
.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-avatar {
  width: 32px;
  height: 32px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 50%;
  margin-right: 12px;
}
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.naziv-text,
.datum-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #212121;
}
.cell-status {
  display: flex;
  justify-content: center;
}
.status-chip {
  font-size: 12px;
  font-weight: 500;
}
.cell-actions {
  display: flex;
  justify-content: flex-end;
}
.no-checkbox-border .v-selection-control__input {
  border: none !important;
}
</style>