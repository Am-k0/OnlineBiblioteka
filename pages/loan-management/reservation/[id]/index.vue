<template>
  <div class="page-container">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ reservation?.book.name || 'Detalji o rezervaciji' }}</h1>
        <p class="page-subtitle" v-if="reservation">
          <span class="link" @click="navigateTo('/books')">Evidencija knjige</span> / 
          <span class="link" @click="navigateTo(`/book/${reservation.book.id}`)">KNJIGA - {{ reservation.book.id }}</span> / 
          <span>rezervacija - {{ reservation.id }}</span>
        </p>
      </div>
      
      <BookMenu v-if="reservation" :book="reservation.book" />

    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div v-if="loading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-4">Učitavam detalje rezervacije...</p>
      </div>

      <div v-if="error" class="pa-4">
        <v-alert type="error">{{ error }}</v-alert>
      </div>
      
      <v-container fluid v-if="reservation && !loading" class="pa-0">
        <v-row>
          <v-col cols="12" sm="4" md="3" lg="2">
            <div class="sidebar-details">
              <img :src="bookCover" alt="Slika knjige" class="book-cover" />
              <div class="details-section">
                <div class="detail-item">
                  <span class="detail-label">Status rezervacije</span>
                  <v-chip
                    :class="getStatusClass(reservation.status)"
                    size="small"
                    class="status-chip"
                    variant="outlined"
                  >
                    {{ getStatusLabel(reservation.status) }}
                  </v-chip>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Datum rezervacije</span>
                  <span class="detail-value">{{ formatDate(reservation.reserved_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Rezervacija ističe</span>
                  <span class="detail-value">{{ formatDate(reservation.expires_at) }}</span>
                </div>
                 <div class="detail-item" v-if="reservation.librarian">
                  <span class="detail-label">Bibliotekar</span>
                  <span 
                    class="detail-value user-link" 
                    @click="navigateTo(`/users/${reservation.librarian.username}`)"
                  >
                    {{ reservation.librarian.first_name }} {{ reservation.librarian.last_name }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Učenik</span>
                  <span 
                    class="detail-value user-link" 
                    @click="navigateTo(`/users/${reservation.student.username}`)"
                   >
                    {{ reservation.student.first_name }} {{ reservation.student.last_name }}
                  </span>
                </div>
              </div>
            </div>
          </v-col>

          <v-col cols="12" sm="8" md="9" lg="10">
            </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import BookMenu from '@/components/BookMenu.vue';

const route = useRoute();
const router = useRouter();
const reservation = ref(null);
const loading = ref(true);
const error = ref(null);

const bookCover = computed(() => {
  return reservation.value?.book?.cover_image || '/images/default-book-1.jpg';
});

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

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'status-pending';
    case 'reserved': return 'status-reserved';
    case 'expired': return 'status-expired';
    case 'rejected': return 'status-rejected';
    case 'rented': return 'status-rented';
    case 'cancelled': return 'status-cancelled';
    default: return '';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Na čekanju';
    case 'reserved': return 'Potvrđeno';
    case 'expired': return 'Istekla';
    case 'rejected': return 'Odbijena';
    case 'rented': return 'Izdato';
    case 'cancelled': return 'Otkazano';
    default: return status;
  }
};

const fetchReservation = async () => {
  loading.value = true;
  error.value = null;
  const reservationId = route.params.id;

  if (!reservationId) {
    error.value = 'ID rezervacije nije pronađen u URL-u.';
    loading.value = false;
    return;
  }

  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`http://localhost/api/reservations/${reservationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    reservation.value = response.data.reservation;
  } catch (err) {
    console.error('Greška pri dohvatanju detalja rezervacije:', err);
    const errorMessage = err.response?.data?.message || 'Nepoznata greška.';
    if (err.response?.status === 403) {
      error.value = 'Nemate dozvolu da pregledate ovu rezervaciju.';
    } else {
      error.value = 'Greška pri učitavanju detalja rezervacije: ' + errorMessage;
    }
  } finally {
    loading.value = false;
  }
};

const navigateTo = (path) => {
  router.push(path);
};

onMounted(() => {
  fetchReservation();
});
</script>

<style scoped>
/* Osnovni stilovi za stranicu (preuzeto iz primjera) */
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* AŽURIRANI HEADER STILOVI */
.app-header {
  padding: 6px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
  margin-top: 2px;
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 15px;
  margin-bottom: 24px;
}

/* KRAJ AŽURIRANIH HEADER STILOVA */

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  text-transform: none;
}

/* Stilovi za specifični sadržaj ove stranice */
.sidebar-details {
  width: 100%;
  max-width: 203px;
}

.book-cover {
  width: 123px;
  height: 202px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  line-height: 1.4;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #5f6368;
  display: block;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  font-weight: 400;
  color: #202124;
}

.user-link {
  color: #1976d2;
  cursor: pointer;
}

.user-link:hover {
  text-decoration: underline;
}

.status-chip {
  font-size: 11px;
  font-weight: 600;
  height: 24px;
  padding: 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  border-width: 1.5px;
}

.status-pending { color: #FF9900; }
.status-reserved { color: #3392EA; }
.status-expired { color: #CF2A27; }
.status-rejected { color: #CF2A27; }
.status-rented { color: #4CAF50; }
.status-cancelled { color: #757575; }

</style>