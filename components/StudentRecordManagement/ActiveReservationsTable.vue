<template>
  <div class="page-layout">
    <div class="content-area">
      <div class="table-container">
        <v-data-table
          :headers="headers"
          :items="formattedReservations"
          :loading="loading"
          item-key="id"
          hide-default-footer
          hover
        >
          <template v-slot:item.reserved_at="{ item }">
            <span class="datum-text">{{ formatDate(item.reserved_at) }}</span>
          </template>

          <template v-slot:item.expires_at="{ item }">
            <span class="datum-text">{{ formatDate(item.expires_at) }}</span>
          </template>

          <template v-slot:item.book="{ item }">
            <div class="cell-naziv d-flex align-center">
              <div class="book-cover-wrapper mr-3">
                <img :src="item.book_image" alt="Slika knjige" />
              </div>
              <span class="naziv-text">{{ item.book_title }}</span>
            </div>
          </template>

          <template v-slot:item.status="{ item }">
            <div class="cell-status">
              <div v-if="isLibrarian && item.status === 'pending'" class="d-flex align-center">
                <v-btn icon color="green" variant="text" size="small" @click="confirmReservation(item.id)">
                  <v-icon>mdi-check</v-icon>
                </v-btn>
                <v-btn icon color="red" variant="text" size="small" @click="rejectReservation(item.id)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
              <v-chip
                v-else
                :color="getStatusColor(item.status)"
                :class="getStatusClass(item.status)"
                size="small"
                class="status-chip"
                variant="flat"
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex align-center justify-end" v-if="isStudent && (item.status === 'pending' || item.status === 'reserved')">
              <v-menu>
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
                  <v-list-item @click="showCancelDialog(item)">
                    <v-list-item-title>Otkazi rezervaciju</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <template v-slot:no-data>
            <v-alert :value="true" type="info">Nema aktivnih rezervacija za ovog korisnika.</v-alert>
          </template>
        </v-data-table>
      </div>

      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>

      <v-dialog v-model="cancelDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">Potvrdi otkazivanje</v-card-title>
          <v-card-text>
            Da li ste sigurni da želite da otkažete rezervaciju za knjigu **{{ bookToCancel?.book_title }}**?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" variant="text" @click="cancelDialog = false">Ne</v-btn>
            <v-btn color="red darken-1" variant="text" @click="cancelReservation">Da, otkaži</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

// --- STANJE ---
const route = useRoute();
const router = useRouter();
const activeReservations = ref([]);
const loading = ref(true);
const studentId = ref(null);
const error = ref(null);
const isStudent = ref(false);
const isLibrarian = ref(false); // Dodato stanje za bibliotekara

const cancelDialog = ref(false);
const bookToCancel = ref(null);

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

const getStatusColor = (status) => {
  switch (status) {
    case 'reserved': return 'orange';
    case 'rejected': return 'red';
    case 'pending': return 'blue';
    default: return 'grey';
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

const getStatusLabel = (status) => {
  switch (status) {
    case 'reserved': return 'Rezervisano';
    case 'rejected': return 'Odbijeno';
    case 'pending': return 'Na čekanju';
    default: return status;
  }
};

const setError = (err) => {
  error.value = err;
  setTimeout(() => error.value = null, 5000);
};

// --- COMPUTED VRIJEDNOSTI ---
const formattedReservations = computed(() => {
  return activeReservations.value.map(res => ({
    id: res.id,
    book_id: res.book?.id,
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

const fetchActiveReservations = async () => {
  loading.value = true;
  activeReservations.value = [];
  error.value = null;

  const username = route.params.username;
  if (!username) {
    setError('Korisničko ime studenta nije pronađeno u URL-u.');
    loading.value = false;
    return;
  }

  const id = await getStudentIdByUsername(username);
  if (!id) {
    setError('ID studenta nije pronađen za zadato korisničko ime.');
    loading.value = false;
    return;
  }
  studentId.value = id;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Niste prijavljeni');
    }

    const userString = localStorage.getItem('user');
    if (userString) {
      const userObject = JSON.parse(userString);
      isStudent.value = userObject.role === 'student';
      isLibrarian.value = userObject.role === 'librarian'; // Dodata provjera za bibliotekara
    } else {
      isStudent.value = false;
      isLibrarian.value = false;
    }

    const response = await axios.get(`${apiBaseUrl}/api/reservations/active`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    });

    const allReservations = response.data.reservations?.data || [];

    const filteredReservations = allReservations.filter(reservation =>
      String(reservation.student_id) === String(studentId.value)
    );

    activeReservations.value = filteredReservations;

  } catch (error) {
    console.error('Greška pri dohvatanju aktivnih rezervacija:', error);
    setError('Greška pri dohvatanju aktivnih rezervacija: ' +
      (error.response?.data?.message || error.message || 'Nepoznata greška'));
    activeReservations.value = [];
  } finally {
    loading.value = false;
  }
};

const showCancelDialog = (item) => {
  bookToCancel.value = item;
  cancelDialog.value = true;
};

const cancelReservation = async () => {
  if (!bookToCancel.value) return;

  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const response = await axios.post(`${apiBaseUrl}/api/reservations/${bookToCancel.value.id}/cancel`, null, authHeaders);

    console.log('Rezervacija otkazana:', response.data);

    await fetchActiveReservations();

    cancelDialog.value = false;
    bookToCancel.value = null;

  } catch (err) {
    setError('Greška pri otkazivanju rezervacije: ' + (err.response?.data?.error || err.message));
  }
};

const confirmReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/confirm`, null, authHeaders);
    await fetchActiveReservations(); // Osvježi listu nakon akcije
  } catch (err) {
    console.error('Greška pri potvrdi rezervacije:', err);
    setError('Greška pri potvrdi rezervacije: ' + (err.response?.data?.error || err.message));
  }
};

const rejectReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/reject`, null, authHeaders);
    await fetchActiveReservations(); // Osvježi listu nakon akcije
  } catch (err) {
    console.error('Greška pri odbijanju rezervacije:', err);
    setError('Greška pri odbijanju rezervacije: ' + (err.response?.data?.error || err.message));
  }
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  fetchActiveReservations();
});

watch(
  () => route.params.username,
  (newUsername) => {
    if (newUsername) {
      fetchActiveReservations();
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
.cell-naziv {
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
  border-radius: 4px;
  margin-right: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
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
/* Novi stilovi za status chipove */
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
</style>