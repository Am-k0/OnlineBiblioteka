<template>
  <div class="table-container">
    <div class="header-section">
      <v-text-field
        v-model="searchQuery"
        append-inner-icon="mdi-magnify"
        placeholder="Pretraži knjige..."
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
        :items="sortedReservations"
        :loading="loading"
        loading-text="Učitavam aktivne rezervacije i detalje..."
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

        <template v-slot:item.rezervacija_istice="{ item }">
          <span class="datum-text">{{ formatDate(item.rezervacija_istice) }}</span>
        </template>
        
        <template v-slot:item.rezervaciju_podnio="{ item }">
          <div class="cell-profile d-flex align-center">
            <div class="profile-avatar mr-3">
              <img :src="item.avatar_url || defaultAvatar" alt="Avatar" />
            </div>
            <span class="naziv-text">{{ item.rezervaciju_podnio }}</span>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <div class="cell-status">
            <div v-if="isLibrarian && item.status === 'pending'" class="d-flex align-center">
              <v-btn icon color="green" variant="text" size="x-small" @click="confirmReservation(item.id)">
                <v-icon>mdi-check</v-icon>
              </v-btn>
              <v-btn icon color="red" variant="text" size="x-small" @click="rejectReservation(item.id)">
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
          <div class="cell-actions">
            <ActionMenu
              :item="item"
              :show-view="true"
              :show-izdaj="item.status !== 'rejected'"
              @view="viewDetails"
              @izdaj="issueBook"
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
  
  <v-dialog v-model="showIssueDialog" max-width="500px">
    <v-card>
      <v-card-title class="headline">Potvrdi izdavanje knjige</v-card-title>
      <v-card-text>
        Da li ste sigurni da želite da izdate knjigu **{{ bookToIssue?.naziv_knjige }}** učeniku **{{ bookToIssue?.rezervaciju_podnio }}**?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="showIssueDialog = false">Poništi</v-btn>
        <v-btn color="red darken-1" text @click="confirmIssue">Potvrdi</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import PaginationFooter from '@/components/PaginationFooter.vue'
import ActionMenu from '@/components/ActionMenu.vue' 

const router = useRouter()
const activeReservations = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const defaultBookCover = '/images/default-book-1.jpg'
const defaultAvatar = '/images/default-user-1.jpg'
const apiBaseUrl = 'http://localhost'

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const isLibrarian = ref(false)

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true, minWidth: '250px' },
  { title: 'Datum rezervacije', key: 'datum_rezervacije', sortable: true },
  { title: 'Rezervacija istice', key: 'rezervacija_istice', sortable: true },
  { title: 'Rezervaciju podnio', key: 'rezervaciju_podnio', sortable: true, minWidth: '200px' },
  { title: 'Status', key: 'status', align: 'center', sortable: true },
  { title: '', key: 'actions', sortable: false },
])

const showIssueDialog = ref(false);
const bookToIssue = ref(null);

const setError = (err) => {
  error.value = err
  setTimeout(() => error.value = null, 5000)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}.`
  } catch (err) { 
    return dateString 
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'reserved': return 'white'
    case 'rejected': return 'white'
    case 'pending': return 'orange'
    case 'rented': return 'blue'
    default: return 'default'
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'reserved': return 'status-reserved'
    case 'rejected': return 'status-rejected'
    case 'pending': return 'status-pending'
    case 'rented': return 'status-rented'
    default: return ''
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'reserved': return 'Rezervisano'
    case 'rejected': return 'Odbijeno'
    case 'pending': return 'Na čekanju'
    case 'rented': return 'Izdato'
    default: return status
  }
}

const fetchActiveReservations = async () => {
  loading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Niste prijavljeni')
    
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
    
    const userString = localStorage.getItem('user')
    if (userString) {
      const userObject = JSON.parse(userString)
      isLibrarian.value = userObject.role === 'librarian'
    } else {
      isLibrarian.value = false;
    }

    const params = {
      page: currentPage.value,
      per_page: itemsPerPage.value,
      search_value: searchQuery.value,
    }

    const response = await axios.get(`${apiBaseUrl}/api/reservations/active`, { ...authHeaders, params })
    
    const reservationsData = response.data.reservations.data
    activeReservations.value = reservationsData || [] 
    totalItems.value = response.data.reservations.total || 0

  } catch (err) {
    error.value = 'Greška pri učitavanju aktivnih rezervacija: ' + (err.response?.data?.message || err.message)
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const confirmReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token')
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
    
    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/confirm`, null, authHeaders)
    
    fetchActiveReservations()
  } catch (err) {
    setError('Greška pri potvrdi rezervacije: ' + (err.response?.data?.error || err.message))
  }
}

const rejectReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('auth_token')
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
    
    await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/reject`, null, authHeaders)
    
    fetchActiveReservations()
  } catch (err) {
    setError('Greška pri odbijanju rezervacije: ' + (err.response?.data?.error || err.message))
  }
}

const viewDetails = (item) => {
  // Ažuriran kod za navigaciju
  router.push(`/loan-management/reservation/${item.id}`);
}

const issueBook = (item) => {
  bookToIssue.value = item;
  showIssueDialog.value = true;
}

const confirmIssue = async () => {
  showIssueDialog.value = false;
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('auth_token')
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
    
    const payload = {
      book_id: bookToIssue.value.book.id,
      student_id: bookToIssue.value.student.id,
      reservation_id: bookToIssue.value.id 
    };
    
    const res = await axios.post(`${apiBaseUrl}/api/rentals`, payload, authHeaders);
    
    alert(res.data.message || 'Knjiga je uspešno izdata!');
    fetchActiveReservations(); 

  } catch (err) {
    console.error('Greška pri izdavanju knjige:', err);
    if (err.response && err.response.data && err.response.data.error) {
        error.value = err.response.data.error;
    } else {
        error.value = 'Došlo je do greške prilikom izdavanja knjige.';
    }
  } finally {
    loading.value = false;
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchActiveReservations()
}

const handleItemsPerPageChange = () => {
  currentPage.value = 1
  fetchActiveReservations()
}

const handlePageChange = () => fetchActiveReservations()

onMounted(() => { 
  fetchActiveReservations()
})

const filteredReservations = computed(() => {
  return activeReservations.value.map(reservation => {
    return {
      ...reservation,
      id: reservation.id,
      naziv_knjige: reservation.book.name || 'Nepoznat naslov',
      slika_knjige: reservation.book.cover_image || defaultBookCover,
      datum_rezervacije: reservation.reserved_at || reservation.created_at,
      rezervacija_istice: reservation.expires_at,
      rezervaciju_podnio: `${reservation.student.first_name || ''} ${reservation.student.last_name || ''}`.trim() || 'Nepoznat korisnik',
      avatar_url: reservation.student.avatar || defaultAvatar,
      status: reservation.status || 'nepoznat',
      book: reservation.book,
      student: reservation.student
    }
  })
})

const sortedReservations = computed(() => {
  return [...filteredReservations.value].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') {
      return -1;
    }
    if (a.status !== 'pending' && b.status === 'pending') {
      return 1;
    }
    return 0;
  });
})

const itemClass = () => 'table-row'
</script>

<style scoped>
.table-container {
  flex-grow: 1;
  padding: 0 24px 24px 24px;
  background-color: #fff;
}

.header-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: -14px;
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

.search-field .v-field__prepend-inner {
  padding-left: 0;
  margin-right: 8px;
}

.search-field .v-field__input {
  padding-left: 0;
}

.no-border-table {
  border: none;
  box-shadow: none;
}

.no-border-table .v-data-table__wrapper table,
.no-border-table .v-data-table__wrapper table thead,
.no-border-table .v-data-table__wrapper table tbody,
.no-border-table .v-data-table__wrapper table tr,
.no-border-table .v-data-table__wrapper table th,
.no-border-table .v-data-table__wrapper table td {
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

.table-row {
  height: 56px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(1),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(1) {
  width: 56px !important;
  padding-left: 16px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-last-child(1),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-last-child(1) {
  padding-right: 16px !important;
}

.cell-naziv, .cell-profile {
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
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.no-checkbox-border .v-selection-control__input {
  border: none !important;
}

.status-reserved {
  background-color: transparent !important;
  color: #3392EA !important;
  border: 1px solid #3392EA !important;
}

.status-rejected {
  background-color: transparent !important;
  color: #CF2A27 !important;
  border: 1px solid #CF2A27 !important;
}

.status-pending {
  background-color: transparent !important;
  color: #FF9900 !important;
  border: 1px solid #FF9900 !important;
}

.status-rented {
  background-color: transparent !important;
  color: #4CAF50 !important;
  border: 1px solid #4CAF50 !important;
}
</style>