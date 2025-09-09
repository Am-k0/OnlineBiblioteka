<template>
  <div class="white-background">
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

      <template v-slot:item.student="{ item }">
        <div class="cell-profile d-flex align-center">
          <div class="profile-avatar mr-3">
            <img :src="item.avatar" alt="Avatar" />
          </div>
          <span class="naziv-text">{{ item.student_name }}</span>
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
        <div class="cell-actions">
          <ActionMenu
            :item="item"
            entity-name="arhiviranu rezervaciju"
            title-property="student_name"
            :show-view="true"
            :show-delete="false"
            :show-otpisi="false"
            :show-izdaj="false"
            :show-vrati="false"
            :show-rezervisi="false"
            @view="viewDetails"
          />
        </div>
      </template>

      <template v-slot:no-data>
        <div class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-remove-outline</v-icon>
          <h3 class="text-h6 mb-2 text-grey-darken-1">Nema arhiviranih rezervacija za ovu knjigu</h3>
          <p class="text-body-2 text-grey">Ova knjiga nema arhiviranih rezervacija.</p>
        </div>
      </template>
    </v-data-table>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import ActionMenu from '@/components/ActionMenu.vue';

const route = useRoute();
const router = useRouter();
const archivedReservations = ref([]);
const loading = ref(true);
const defaultAvatar = '/images/default-user-1.jpg';
const apiBaseUrl = 'http://localhost';

// Snackbar state
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 5000,
});

const headers = [
  { title: 'Datum rezervacije', key: 'reserved_at', sortable: true },
  { title: 'Rezervacija ističe', key: 'expires_at', sortable: true },
  { title: 'Rezervaciju podnio', key: 'student', sortable: false, minWidth: '200px' },
  { title: 'Status', key: 'status', sortable: true, align: 'center' },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
];

const showErrorSnackbar = (message) => {
  snackbar.value.text = message;
  snackbar.value.color = 'error';
  snackbar.value.timeout = null; // Bez tajmera
  snackbar.value.show = true;
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

const formattedReservations = computed(() => {
    const filtered = archivedReservations.value.filter(res => res.status !== 'rejected');
    
    return filtered.map(res => ({
        ...res,
        student_name: `${res.student?.first_name || ''} ${res.student?.last_name || ''}`.trim() || 'Nepoznat korisnik',
        avatar: res.student?.avatar ? `${apiBaseUrl}/storage/${res.student.avatar}` : defaultAvatar,
    }));
});

const fetchArchivedReservations = async () => {
    loading.value = true;
    
    try {
        const bookId = route.params.id;
        if (!bookId) {
            showErrorSnackbar('ID knjige nije pronađen u URL-u.');
            archivedReservations.value = [];
            return;
        }

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
                book_id: bookId
            }
        });

        const reservationsData = response.data.reservations?.data || response.data.data || [];
        
        const filteredReservations = reservationsData.filter(reservation => 
            String(reservation.book_id) === String(bookId)
        );
        
        archivedReservations.value = filteredReservations;

    } catch (error) {
        console.error('Greška pri dohvatanju arhiviranih rezervacija:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Nepoznata greška';
        showErrorSnackbar('Greška pri učitavanju arhiviranih rezervacija: ' + errorMessage);
        
        if (error.response?.status === 401) {
            router.push('/login');
        }
        
        archivedReservations.value = [];
    } finally {
        loading.value = false;
    }
};

const viewDetails = (item) => {
  if (item && item.id) {
    router.push(`/loan-management/reservation/${item.id}`);
  }
};

onMounted(() => {
    fetchArchivedReservations();
});

watch(
    () => route.params.id,
    (newId, oldId) => {
        if (newId && newId !== oldId) {
            fetchArchivedReservations();
        }
    }
);
</script>

<style scoped>
.white-background {
    background-color: white;
    padding: 20px;
}

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

.cell-profile {
  display: flex;
  align-items: center;
}

.profile-avatar {
  width: 36px;
  height: 36px;
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

.status-rejected {
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