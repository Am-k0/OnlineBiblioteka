<template>
  <div class="page-layout">
    <div class="content-area">
      <div class="table-container">
        <v-data-table
          :headers="headers"
          :items="formattedReservations"
          :loading="loading"
          loading-text="Učitavam arhivirane rezervacije..."
          item-key="id"
          hide-default-footer
          hover
          class="no-elevation no-border-table"
        >
          <template v-slot:item.reserved_at="{ item }">
            <span class="datum-text">{{ formatDate(item.reserved_at) }}</span>
          </template>

          <template v-slot:item.expires_at="{ item }">
            <span class="datum-text">{{ formatDate(item.expires_at) }}</span>
          </template>

          <template v-slot:item.book="{ item }">
            <div class="cell-naziv d-flex align-center cursor-pointer" @click="viewDetails(item)">
              <div class="book-cover-wrapper mr-3">
                <img :src="item.book_image" :alt="item.book_title" />
              </div>
              <span class="naziv-text">{{ item.book_title }}</span>
            </div>
          </template>

          <template v-slot:item.status="{ item }">
            <div class="cell-status">
              <v-chip
                :class="getStatusClass(item.status)"
                size="small"
                class="status-chip"
                :variant="getStatusVariant(item.status)"
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <ActionMenu
              :item="item"
              :show-view="true"
              @view="viewDetails"
              entity-name="rezervaciju"
              title-property="book_title"
            />
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-remove-outline</v-icon>
              <h3 class="text-h6 mb-2 text-grey-darken-1">Nema arhiviranih rezervacija</h3>
              <p class="text-body-2 text-grey">Trenutno nema arhiviranih rezervacija za ovog korisnika.</p>
            </div>
          </template>
        </v-data-table>
      </div>
      
      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import ActionMenu from '../action-menu.vue';

// --- STANJE ---
const route = useRoute();
const router = useRouter();
const archivedReservations = ref([]);
const loading = ref(true);
const studentId = ref(null);
const error = ref(null);

const apiBaseUrl = 'http://localhost';
const defaultBookCover = '/images/default-book-1.jpg';

// --- KONFIGURACIJA TABELE ---
const headers = [
  { title: 'Naziv Knjige', key: 'book', sortable: true },
  { title: 'Datum rezervacije', key: 'reserved_at', sortable: true },
  { title: 'Rezervacija ističe', key: 'expires_at', sortable: true },
  { title: 'Status', key: 'status', sortable: true, align: 'center' },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
];

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
    return (status === 'rented') ? 'outlined' : 'flat';
};

const getStatusClass = (status) => {
    switch (status) {
        case 'rented': return 'status-rented';
        case 'expired': return 'status-expired';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'rented': return 'Izdato';
    case 'expired': return 'Rezervacija istekla';
    case 'cancelled': return 'Rezervacija otkazana';
    default: return status;
  }
};

const setError = (err) => {
  error.value = err;
  setTimeout(() => error.value = null, 5000);
};

// --- COMPUTED VRIJEDNOSTI ---
const formattedReservations = computed(() => {
  const filteredReservations = archivedReservations.value.filter(res => res.status !== 'rejected');
  
  return filteredReservations.map(res => ({
    id: res.id,
    book_title: res.book?.name || 'Nepoznat naslov',
    book_image: res.book?.cover_image ? `${apiBaseUrl}/storage/${res.book.cover_image}` : defaultBookCover,
    reserved_at: res.reserved_at,
    expires_at: res.expires_at,
    status: res.status,
  }));
});

// --- API FUNKCIJE ---
const getStudentIdByUsername = async (username) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${apiBaseUrl}/api/users/${username}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    });
    return response.data?.[0]?.id || null;
  } catch (err) {
    console.error('Greška pri dohvatanju ID-a korisnika po username-u:', err);
    setError('Greška pri dohvatanju podataka korisnika: ' + 
      (err.response?.data?.message || err.message || 'Nepoznata greška'));
    return null;
  }
};

const fetchArchivedReservations = async () => {
  loading.value = true;
  archivedReservations.value = [];
  error.value = null;

  try {
    const username = route.params.username;
    if (!username) {
      setError('Korisničko ime studenta nije pronađeno u URL-u.');
      return;
    }

    const id = await getStudentIdByUsername(username);
    if (!id) {
      setError('ID studenta nije pronađen za zadato korisničko ime.');
      return;
    }
    studentId.value = id;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Niste prijavljeni');
    }

    const authHeaders = { 
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      } 
    };

    const response = await axios.get(`${apiBaseUrl}/api/reservations/archived`, {
      ...authHeaders,
      params: {
        student_id: studentId.value
      }
    });

    const reservationsData = response.data.reservations?.data || response.data.data || [];
    
    const filteredReservations = reservationsData.filter(reservation => 
      String(reservation.student_id) === String(studentId.value)
    );
    
    archivedReservations.value = filteredReservations;

  } catch (error) {
    console.error('Greška pri dohvatanju arhiviranih rezervacija:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Nepoznata greška';
    setError('Greška pri dohvatanju arhiviranih rezervacija: ' + errorMessage);
    
    if (error.response?.status === 401) {
      router.push('/login');
    }
    
    archivedReservations.value = [];
  } finally {
    loading.value = false;
  }
};

const viewDetails = (item) => {
  router.push(`/book-rental/reservation/${item.id}`);
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  fetchArchivedReservations();
});

watch(
  () => route.params.username,
  (newUsername, oldUsername) => {
    if (newUsername && newUsername !== oldUsername) {
      fetchArchivedReservations();
    }
  }
);
</script>

<style scoped>
.page-layout { 
  width: 100%;
  padding: 0;
}

.content-area { 
  width: 100%;
  padding: 24px; 
  max-width: none;
}

.table-container { 
  padding: 24px; 
  background-color: white; 
  border-radius: 8px; 
}

/* Stilovi za uklanjanje okvira i senke */
.no-elevation {
    box-shadow: none !important;
}

.no-border-table .v-data-table__wrapper table {
    border: none !important;
}

.no-border-table .v-data-table__wrapper table thead,
.no-border-table .v-data-table__wrapper table tbody,
.no-border-table .v-data-table__wrapper table tr,
.no-border-table .v-data-table__wrapper table th,
.no-border-table .v-data-table__wrapper table td {
    border-bottom: 1px solid #E0E0E0 !important;
}

.no-border-table .v-data-table__wrapper table thead tr th {
  font-size: 12px;
  color: #616161 !important;
  text-transform: uppercase;
  font-weight: 500;
}

.cell-naziv { 
  display: flex; 
  align-items: center; 
  width: 100%; 
  overflow: hidden; 
  cursor: pointer; /* Dodato za vizuelnu indikaciju */
}

.cell-naziv:hover .naziv-text {
  color: #3489f8; /* Dodato za hover efekat */
}

.book-cover-wrapper { 
  width: 32px; 
  height: 48px; 
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
}

.naziv-text, 
.datum-text { 
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

.cell-status { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
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

/* Stilovi za status chipove - usklađeni sa drugim fajlom */
.status-rented {
    background-color: transparent !important;
    color: #3392EA !important;
    border: 1px solid #3392EA !important;
}

.status-expired {
    background-color: transparent !important;
    color: #CF2A27 !important;
    border: 1px solid #CF2A27 !important;
}


.status-cancelled {
    background-color: transparent !important;
    color: #CF2A27 !important;
    border: 1px solid #CF2A27 !important;
}
</style>