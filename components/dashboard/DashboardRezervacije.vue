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
        <v-alert type="info" dense>Nema novih rezervacija na čekanju.</v-alert>
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
const defaultAvatar = '/images/default-user-1.jpg';
const apiBaseUrl = 'http://localhost';

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

    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Token nije pronađen');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    
    const response = await axios.get(`${apiBaseUrl}/api/reservations/active`, { ...authHeaders });
    
    if (response.data && response.data.reservations && response.data.reservations.data) {
      reservations.value = response.data.reservations.data.map(res => ({
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
  } finally {
    loading.value = false;
  }
};

const confirmReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/confirm`, null, authHeaders);
    fetchReservations(); // Ponovo učitaj listu da se ažurira
  } catch (err) {
    error.value = 'Greška pri potvrdi rezervacije: ' + (err.response?.data?.error || err.message);
  }
};

const rejectReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/reject`, null, authHeaders);
    fetchReservations(); // Ponovo učitaj listu da se ažurira
  } catch (err) {
    error.value = 'Greška pri odbijanju rezervacije: ' + (err.response?.data?.error || err.message);
  }
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

/* NOVI STILOVI ZA DATUM */
.reservation-date {
  width: 105px;
  flex-shrink: 0;
  text-align: left;
  color: #5f6368;
  padding: 4px 8px;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  margin-right: 130px; 
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 50px;
  flex-shrink: 0;
  justify-content: flex-start;
  color: #5f6368;
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

/* NOVI STILOVI ZA STATUS */
.status-chip {
  font-size: 11px;
  font-weight: 500;
  height: 24px;
  min-width: 93px;
  padding: 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  margin-left: -50px; /* Dodato za pomeranje ulevo */
}

/* STANJA ZA LOADER I GRESKU */
.loading-state,
.error-state,
.no-data-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>