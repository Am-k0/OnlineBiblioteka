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
            <div class="cell-naziv d-flex align-center cursor-pointer" @click="viewDetails(item)">
              <div class="book-cover-wrapper mr-3">
                <img :src="item.book_image" :alt="item.book_title" />
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
            <div class="d-flex align-center justify-end">
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
                  <v-list-item @click="viewDetails(item)">
                    <template #prepend>
                      <v-icon icon="mdi-file-document-outline"></v-icon>
                    </template>
                    <v-list-item-title>Pogledaj detalje</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="isStudent && item.status === 'pending'"
                    @click="showCancelDialog(item)"
                  >
                    <template #prepend>
                      <v-icon icon="mdi-cancel"></v-icon>
                    </template>
                    <v-list-item-title>Otkazi rezervaciju</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-remove-outline</v-icon>
              <h3 class="text-h6 mb-2 text-grey-darken-1">Nema aktivnih rezervacija</h3>
              <p class="text-body-2 text-grey">Trenutno ne postoji nijedna aktivna rezervacija za ovog korisnika.</p>
            </div>
          </template>
        </v-data-table>
      </div>

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
const isStudent = ref(false);
const isLibrarian = ref(false);

const cancelDialog = ref(false);
const bookToCancel = ref(null);

const apiBaseUrl = 'http://localhost';
const defaultBookCover = '/images/default-book-1.jpg';

// Snackbar state
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 5000,
});

// --- KONFIGURACIJA TABELE ---
const headers = [
  { title: 'Naziv Knjige', key: 'book', sortable: true },
  { title: 'Datum rezervacije', key: 'reserved_at', sortable: true },
  { title: 'Rezervacija ističe', key: 'expires_at', sortable: true },
  { title: 'Status', key: 'status', sortable: true, align: 'center' },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
];

// --- HELPER FUNKCIJE ---
const showErrorSnackbar = (message) => {
  snackbar.value.text = message;
  snackbar.value.color = 'error';
  snackbar.value.timeout = null;
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
    showErrorSnackbar('Greška pri dohvatanju podataka korisnika: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška'));
    return null;
  }
};

const fetchActiveReservations = async () => {
  loading.value = true;
  activeReservations.value = [];

  const username = route.params.username;
  if (!username) {
    showErrorSnackbar('Korisničko ime studenta nije pronađeno u URL-u.');
    loading.value = false;
    return;
  }

  const id = await getStudentIdByUsername(username);
  if (!id) {
    showErrorSnackbar('ID studenta nije pronađen za zadato korisničko ime.');
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
      isLibrarian.value = userObject.role === 'librarian';
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
    showErrorSnackbar('Greška pri dohvatanju aktivnih rezervacija: ' +
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

    await axios.post(`${apiBaseUrl}/api/reservations/${bookToCancel.value.id}/cancel`, null, authHeaders);

    snackbar.value.text = 'Rezervacija je uspješno otkazana.';
    snackbar.value.color = 'success';
    snackbar.value.timeout = 5000;
    snackbar.value.show = true;

    await fetchActiveReservations();

    cancelDialog.value = false;
    bookToCancel.value = null;

  } catch (err) {
    showErrorSnackbar('Greška pri otkazivanju rezervacije: ' + (err.response?.data?.error || err.message));
  }
};

const confirmReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/confirm`, null, authHeaders);
    
    snackbar.value.text = 'Rezervacija je uspješno potvrđena.';
    snackbar.value.color = 'success';
    snackbar.value.timeout = 5000;
    snackbar.value.show = true;

    await fetchActiveReservations();
  } catch (err) {
    console.error('Greška pri potvrdi rezervacije:', err);
    showErrorSnackbar('Greška pri potvrdi rezervacije: ' + (err.response?.data?.error || err.message));
  }
};

const rejectReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/reject`, null, authHeaders);
    
    snackbar.value.text = 'Rezervacija je uspješno odbijena.';
    snackbar.value.color = 'success';
    snackbar.value.timeout = 5000;
    snackbar.value.show = true;

    await fetchActiveReservations();
  } catch (err) {
    console.error('Greška pri odbijanju rezervacije:', err);
    showErrorSnackbar('Greška pri odbijanju rezervacije: ' + (err.response?.data?.error || err.message));
  }
};

const viewDetails = (item) => {
  router.push(`/book-rental/reservation/${item.id}`);
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
  cursor: pointer; /* Dodato za vizuelnu indikaciju */
}
.cell-naziv:hover .naziv-text {
  color: #3489f8; /* Promjena boje teksta na hover */
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