<template>
  <div class="page-container">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ rental?.book?.name || 'Detalji o iznajmljivanju' }}</h1>
        <p class="page-subtitle" v-if="rental">
          <span class="link" @click="navigateTo('/books')">Evidencija knjige</span> / 
          <span class="link" @click="navigateTo(`/book/${rental.book.id}`)">KNJIGA - {{ rental.book.id }}</span> / 
          <span>iznajmljivanje - {{ rental.id }}</span>
        </p>
      </div>
      
      <BookMenu v-if="rental" :book="rental.book" />
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div v-if="loading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-4">Učitavam detalje iznajmljivanja...</p>
      </div>

      <div v-if="error" class="pa-4">
        <v-alert type="error">{{ error }}</v-alert>
      </div>
      
      <v-container fluid v-if="rental && !loading" class="pa-0">
        <v-row>
          <v-col cols="12" sm="4" md="3" lg="2">
            <div class="sidebar-details">
              <img :src="bookCover" alt="Slika knjige" class="book-cover" />
              <div class="details-section">
                <div class="detail-item">
                  <span class="detail-label">Tip transakcije</span>
                  <v-chip
                    :class="getStatusClass()"
                    size="small"
                    class="status-chip"
                    variant="outlined"
                  >
                    {{ getStatusLabel() }}
                  </v-chip>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Datum akcije</span>
                  <span class="detail-value">{{ formatDate(rental.rented_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Trenutno zadržavanje knjige</span>
                  <span class="detail-value">{{ rental.days_rented || 0 }} dana(a)</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Prekoračenje</span>
                  <span class="detail-value">{{ getOverdueMessage() }}</span>
                </div>
                <div class="detail-item" v-if="rental.librarian">
                  <span class="detail-label">Bibliotekar</span>
                  <span 
                    class="detail-value user-link" 
                    @click="navigateTo(`/users/${rental.librarian.username}`)"
                  >
                    {{ rental.librarian.first_name }} {{ rental.librarian.last_name }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Učenik</span>
                  <span 
                    class="detail-value user-link" 
                    @click="navigateTo(`/users/${rental.student.username}`)"
                   >
                    {{ rental.student.first_name }} {{ rental.student.last_name }}
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
const rental = ref(null);
const loading = ref(true);
const error = ref(null);
const rentalPeriod = ref(30); 

const bookCover = computed(() => {
  return rental.value?.book?.cover_image || '/images/default-book-1.jpg';
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
    return dateString.split('T')[0];
  }
};

const getStatusClass = () => {
  if (!rental.value) return 'status-rented';
  
  const message = rental.value.message;
  if (message === 'This book has been returned.') return 'status-returned';
  if (message === 'This rental is overdue!') return 'status-overdue';
  if (message === 'Rental period is still valid.') return 'status-rented';
  
  // Ažurirana logika da koristi rentalPeriod
  if (rental.value.days_rented > rentalPeriod.value) return 'status-overdue';
  return 'status-rented';
};

const getStatusLabel = () => {
  if (!rental.value) return 'Izdavanje knjige';
  
  const message = rental.value.message;
  if (message === 'This book has been returned.') return 'Vraćena knjiga';
  if (message === 'This rental is overdue!') return 'U prekoračenju';
  if (message === 'Rental period is still valid.') return 'Izdavanje knjige';

  if (rental.value.days_rented > rentalPeriod.value) return 'U prekoračenju';
  return 'Izdavanje knjige';
};

const getOverdueMessage = () => {
  if (!rental.value) return 'Nema';
  
  const message = rental.value.message;
  if (message === 'This rental is overdue!') {
    const overdueDays = rental.value.days_rented - rentalPeriod.value;
    return overdueDays > 0 ? `${overdueDays} dana` : 'U prekoračenju';
  }
  
  if (message === 'This book has been returned.') return 'Nema';
  
  // Ažurirana fallback logika
  if (rental.value.days_rented && rental.value.days_rented > rentalPeriod.value) {
    return `${rental.value.days_rented - rentalPeriod.value} dana`;
  }
  
  return 'Nema';
};

const fetchPolicies = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get('http://localhost/api/policies', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    
    const policy = response.data.find(p => p.name === 'rental_period');
    if (policy) {
      rentalPeriod.value = policy.period;
    }
  } catch (err) {
    console.error('Greška pri dohvatanju polisa:', err);
  }
};

const fetchRental = async () => {
  loading.value = true;
  error.value = null;
  const rentalId = route.params.id;

  if (!rentalId) {
    error.value = 'ID iznajmljivanja nije pronađen u URL-u.';
    loading.value = false;
    return;
  }

  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`http://localhost/api/rentals/${rentalId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    
    rental.value = response.data.rental || response.data;
    if (response.data.message && rental.value) {
      rental.value.message = response.data.message;
    }

  } catch (err) {
    console.error('Greška pri dohvatanju detalja iznajmljivanja:', err);
    const errorMessage = err.response?.data?.message || 'Nepoznata greška.';
    if (err.response?.status === 403) {
      error.value = 'Nemate dozvolu da pregledate ovo iznajmljivanje.';
    } else if (err.response?.status === 404) {
      error.value = 'Iznajmljivanje nije pronađeno.';
    } else {
      error.value = 'Greška pri učitavanju detalja iznajmljivanja: ' + errorMessage;
    }
  } finally {
    loading.value = false;
  }
};

const navigateTo = (path) => {
  router.push(path);
};

onMounted(() => {
  fetchPolicies().then(() => {
    fetchRental();
  });
});
</script>

<style scoped>
/* Osnovni stilovi za stranicu */
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
  margin-top: 10px;
  margin-bottom: 24px;
}

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

/* Dodani statusi za iznajmljivanje */
.status-rented { 
  color: #3392EA; 
  border-color: #3392EA;
}
.status-returned { 
  color: #4CAF50; 
  border-color: #4CAF50;
}
.status-overdue { 
  color: #CF2A27; 
  border-color: #CF2A27;
}

/* Loading i error stilovi */
.text-center {
  text-align: center;
}

.pa-10 {
  padding: 40px;
}

.pa-4 {
  padding: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>