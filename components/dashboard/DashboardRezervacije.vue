<template>
  <v-card class="reservations-card" flat>
    <v-card-title class="card-title">
      REZERVACIJE KNJIGA
    </v-card-title>

    <div class="reservations-list">
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="#4E60FF"></v-progress-circular>
      </div>

      <div v-else-if="error" class="error-state">
        <v-alert type="error" dense>{{ error }}</v-alert>
      </div>

      <div v-else-if="pendingReservations.length === 0" class="no-data-state">
        <v-icon size="60" color="grey lighten-1">mdi-calendar-check-outline</v-icon>
        <span class="no-data-text">Nema novih rezervacija na čekanju.</span>
      </div>

      <div v-else v-for="reservation in pendingReservations" :key="reservation.id" class="reservation-item">
        
        <div class="user-info">
          <v-avatar size="40">
            <v-img :src="reservation.avatar_url || defaultAvatar" alt="Korisnički avatar"></v-img>
          </v-avatar>
          <span class="user-name">{{ reservation.rezervaciju_podnio }}</span>
        </div>

        <div class="book-title">
          <span>{{ reservation.naziv_knjige }}</span>
        </div>

        <div class="reservation-date">
          <span>{{ formatDate(reservation.datum_rezervacije) }}</span>
        </div>

        <div class="action-icons">
          <div v-if="isLibrarian" class="d-flex align-center">
            <v-btn icon color="green" variant="text" size="small" @click="confirmReservation(reservation.id)">
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn icon color="red" variant="text" size="small" @click="rejectReservation(reservation.id)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <div v-else-if="isStudent" class="d-flex align-center">
            <v-chip
              :color="getStatusColor(reservation.status)"
              :class="getStatusClass(reservation.status)"
              size="small"
              class="status-chip"
              variant="flat"
            >
              {{ getStatusLabel(reservation.status) }}
            </v-chip>
            <v-menu v-if="reservation.status === 'pending'">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  color="grey-darken-1"
                  size="small"
                  v-bind="props"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="viewDetails(reservation)">
                  <template #prepend>
                    <v-icon icon="mdi-file-document-outline"></v-icon>
                  </template>
                  <v-list-item-title>Pogledaj detalje</v-list-item-title>
                </v-list-item>
                
                <v-list-item
                  @click="showCancelDialog(reservation)"
                >
                  <template #prepend>
                    <v-icon icon="mdi-cancel"></v-icon>
                  </template>
                  <v-list-item-title>Otkazi rezervaciju</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          
          <v-chip v-else :color="getStatusColor(reservation.status)" size="small" class="status-chip" variant="outlined">
            {{ getStatusLabel(reservation.status) }}
          </v-chip>
        </div>
      </div>
    </div>

    <v-card-actions class="card-actions">
      <NuxtLink :to="{ path: '/loan-management', query: { tab: 'active-reservations' } }" class="show-all-link">
        <v-icon size="small" class="show-all-icon">mdi-calendar-blank-outline</v-icon>
        <span class="show-all-text">Prikaži Sve</span>
      </NuxtLink>
    </v-card-actions>
  </v-card>

  <v-dialog v-model="cancelDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">Potvrdi otkazivanje</v-card-title>
      <v-card-text>
        Da li ste sigurni da želite da otkažete rezervaciju za knjigu **{{ bookToCancel?.naziv_knjige }}**?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" variant="text" @click="cancelDialog = false">Ne</v-btn>
        <v-btn color="red darken-1" variant="text" @click="cancelReservation">Da, otkaži</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="bottom right"
  >
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const reservations = ref([]);
const loading = ref(false);
const error = ref(null);
const isLibrarian = ref(false);
const isStudent = ref(false);
const defaultAvatar = '/images/default-user-1.jpg';
const apiBaseUrl = 'http://localhost';

const cancelDialog = ref(false);
const bookToCancel = ref(null);

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
});

const showSnackbar = (message, color = 'success') => {
  snackbar.value.message = message;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

const pendingReservations = computed(() => {
  return reservations.value
    .filter(r => r.status === 'pending')
    .slice(0, 8); // Ograničava na maksimalno 8 rezervacija
});

const getLoggedInUser = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user || null;
    } catch (e) {
        console.error('Greška pri parsiranju user objekta iz localStorage-a:', e);
        return null;
    }
};

const fetchReservations = async () => {
  loading.value = true;
  error.value = null;

  try {
    const user = getLoggedInUser();
    if (!user) throw new Error('Niste prijavljeni');
    isLibrarian.value = user.role === 'librarian';
    isStudent.value = user.role === 'student';

    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Token nije pronađen');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    
    const response = await axios.get(`${apiBaseUrl}/api/reservations/active`, { ...authHeaders });
    
    if (response.data && response.data.reservations && response.data.reservations.data) {
      const allReservations = response.data.reservations.data;
      if (isStudent.value) {
        reservations.value = allReservations.filter(res => res.student_id === user.id);
      } else {
        reservations.value = allReservations;
      }

      reservations.value = reservations.value.map(res => ({
        id: res.id,
        naziv_knjige: res.book?.name || 'Nepoznat naslov',
        rezervaciju_podnio: `${res.student?.first_name || ''} ${res.student?.last_name || ''}`.trim() || 'Nepoznat korisnik',
        datum_rezervacije: res.created_at,
        status: res.status,
        avatar_url: res.student?.avatar || defaultAvatar,
      }));
    }
  } catch (err) {
    console.error('Greška pri učitavanju rezervacija:', err);
    error.value = 'Greška pri učitavanju rezervacija. Proverite vezu sa serverom.';
    if (err.response?.status === 401) {
      router.push('/login');
    }
    showSnackbar('Greška pri učitavanju rezervacija.', 'error');
  } finally {
    loading.value = false;
  }
};

const confirmReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/confirm`, null, authHeaders);
    fetchReservations();
    showSnackbar('Rezervacija je uspješno potvrđena.', 'success');
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Greška pri potvrdi rezervacije.';
    showSnackbar(errorMessage, 'error');
  }
};

const rejectReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/reject`, null, authHeaders);
    fetchReservations();
    showSnackbar('Rezervacija je uspješno odbijena.', 'success');
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Greška pri odbijanju rezervacije.';
    showSnackbar(errorMessage, 'error');
  }
};

const showCancelDialog = (reservation) => {
  bookToCancel.value = reservation;
  cancelDialog.value = true;
};

const cancelReservation = async () => {
  if (!bookToCancel.value) return;

  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    await axios.post(`${apiBaseUrl}/api/reservations/${bookToCancel.value.id}/cancel`, null, authHeaders);
    
    showSnackbar('Rezervacija je uspješno otkazana.', 'success');
    await fetchReservations();

    cancelDialog.value = false;
    bookToCancel.value = null;

  } catch (err) {
    const errorMessage = err.response?.data?.error || 'Greška pri otkazivanju rezervacije.';
    showSnackbar(errorMessage, 'error');
  }
};

const viewDetails = (reservation) => {
  router.push(`/loan-management/reservation/${reservation.id}`);
};

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

const getStatusColor = (status) => {
  switch (status) {
    case 'reserved': return 'primary';
    case 'rejected': return 'red';
    case 'pending': return 'orange';
    case 'rented': return 'success';
    default: return 'default';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'reserved': return 'Rezervisano';
    case 'rejected': return 'Odbijeno';
    case 'pending': return 'Na čekanju';
    case 'rented': return 'Izdato';
    default: return status;
  }
};

const getStatusClass = (status) => {
    switch (status) {
        case 'reserved': return 'status-reserved';
        case 'rejected': return 'status-rejected';
        case 'pending': return 'status-pending';
        default: return '';
    }
};

onMounted(() => {
  fetchReservations();
});
</script>

<style scoped>
/* POSTOJEĆI STILOVI */
.reservations-card {
  width: 700px;
  background-color: #ffffff;
  padding: 8px 0;
  border: none;
  box-shadow: none;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #5f6368;
  padding: 8px 24px 16px 24px;
  letter-spacing: 0.5px;
}

.reservations-list {
  display: flex;
  flex-direction: column;
}

.reservation-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 56px;
  padding: 8px 24px;
  border-bottom: 1px solid #F1F1F1;
}

.reservation-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px; 
  width: 190px;
  flex-shrink: 0;
}

.user-name {
  font-weight: 500;
}

.book-title {
  flex-grow: 1;
  padding: 0 16px;
  text-align: left;
}


.reservation-date {
  width: 105px;
  flex-shrink: 0;
  text-align: left;
  color: #5f6368;
  padding: 4px 8px;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
   margin-right: 10px;
}


.action-icons {
  display: flex;
  align-items: center;
  justify-content: flex-end; 
  gap: 16px;
  width: 200px; 
  flex-shrink: 0;
}


.action-icons .status-chip {
  margin-left: auto; 
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px 0px 16px;
}

.show-all-link {
    text-decoration: none;
    display: flex;
    align-items: center;
    color: #4E60FF;
    font-size: 14px;
    font-weight: 500;
    gap: 4px;
}

.status-chip {
  font-size: 11px;
  font-weight: 500;
  height: 24px;
  min-width: 93px;
  padding: 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
}


.status-reserved {
  background-color: transparent !important;
  color: #FF9900 !important;
  border: 1px solid #FF9900 !important;
}
.status-rejected {
  background-color: transparent !important;
  color: #CF2A27 !important;
  border: 1px solid #CF2A27 !important;
}
.status-pending {
  background-color: transparent !important;
  color: #3392EA !important;
  border: 1px solid #3392EA !important;
}


.loading-state,
.error-state,
.no-data-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  text-align: center;
}

.no-data-text {
  font-size: 16px;
  color: #757575;
  margin-top: 16px;
}
</style>