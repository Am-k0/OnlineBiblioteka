<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ book?.naziv_knjige || 'Učitavam...' }}</h1>
        <p class="page-subtitle" v-if="book">
          <span class="link" @click="router.push('/books')">Evidencija knjiga</span> /
          <span class="link" @click="router.push(`/book/${bookId}`)">KNJIGA-{{ bookId }}</span> /
          Vrati knjigu
        </p>
        <p v-else class="page-subtitle">Učitavam...</p>
      </div>

      <BookMenu :book="book" :isActive="true" v-if="book" />
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="table-title">Vrati knjigu</h2>
      </div>

      <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">{{ error }}</v-alert>
      <v-alert v-if="successMessage" type="success" class="mb-4" closable @click:close="successMessage = null">{{ successMessage }}</v-alert>

      <v-data-table
        :headers="tableHeaders"
        :items="issuedBooks"
        :loading="loading"
        loading-text="Učitavam izdate knjige..."
        item-value="rental_id"
        hide-default-footer
        hover
        show-select
        v-model="selected"
        class="no-border-table"
        :item-class="itemClass"
      >
        <template #item.izdato_uceniku="{ item }">
          <div class="cell-naziv d-flex align-center">
            <v-avatar size="36" class="mr-2">
              <img :src="getProfilePictureUrl(item.student_profile_picture)" alt="Avatar" class="avatar-img" />
            </v-avatar>
            <span class="naziv-text">{{ item.izdato_uceniku }}</span>
          </div>
        </template>
        <template #item.datum_izdavanja="{ item }">
          <span>{{ formatDate(item.datum_izdavanja) }}</span>
        </template>
        <template #item.trenutno_zadrzavanje_knjige="{ item }">
          <span>{{ item.trenutno_zadrzavanje_knjige }}</span>
        </template>
        <template #item.prekoracenje_u_danima="{ item }">
          <span :class="{'overdue-days': item.prekoracenje_u_danima > 0}">{{ item.prekoracenje_u_danima }}</span>
        </template>
        <template #item.knjigu_izdao="{ item }">
          <span>{{ item.knjigu_izdao }}</span>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-check-outline</v-icon>
            <h3 class="text-h6 mb-2 text-grey-darken-1">Nema izdatih primeraka</h3>
            <p class="text-body-2 text-grey">Svi primerci ove knjige su vraćeni ili trenutno nisu izdati.</p>
          </div>
        </template>

        <template #bottom>
          <div class="pagination-and-actions">
            <v-spacer></v-spacer>
            <ActionButtons @save="handleReturnAction" @cancel="cancel" :saveText="'Vrati knjigu'" />
          </div>
        </template>
      </v-data-table>
      
      <PaginationFooter
        v-if="totalItems > 0"
        v-model:itemsPerPage="itemsPerPage"
        v-model:currentPage="currentPage"
        :total-items="totalItems"
        class="pagination-footer mt-4"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import ActionButtons from '@/components/ActionButtons.vue';
import PaginationFooter from '@/components/PaginationFooter.vue';
// Import the new BookMenu component
import BookMenu from '@/components/BookMenu.vue';

const route = useRoute();
const router = useRouter();

// --- STANJE (STATE) ---
const book = ref(null);
const bookId = route.params.id;
const issuedBooks = ref([]);
const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);
const selected = ref([]);

// Paginacija
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

// API konfiguracija
const apiBaseUrl = 'http://localhost'; // Vaš API URL
const token = localStorage.getItem('auth_token');

// --- KONFIGURACIJA TABELE ---
const tableHeaders = [
  { title: 'Izdato učeniku', key: 'izdato_uceniku', align: 'start', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje_knjige', sortable: true },
  { title: 'Prekoračenje u danima', key: 'prekoracenje_u_danima', sortable: true },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: true },
];

const itemClass = () => 'table-row';

// --- HELPER FUNKCIJE ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getProfilePictureUrl = (picturePath) => {
  if (!picturePath) return '/images/default-user-1.jpg'; // Podrazumevani avatar ako backend ne pošalje sliku
  if (picturePath.startsWith('http')) return picturePath;
  return `${apiBaseUrl}/storage/${picturePath}`;
};

const calculateCurrentDays = (issueDateString) => {
  if (!issueDateString) return '0 dana';
  const issueDate = new Date(issueDateString);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate - issueDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Danas";
  if (diffDays === 1) return "1 dan";
  return `${diffDays} dana`;
};

const calculateOverdueDays = (issueDateString, rentalDays = 30) => {
  if (!issueDateString) return 0;
  const issueDate = new Date(issueDateString);
  const currentDate = new Date();
  const returnDate = new Date(issueDate);
  returnDate.setDate(issueDate.getDate() + rentalDays);
  if (currentDate > returnDate) {
    const diffTime = Math.abs(currentDate - returnDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
};

// --- API FUNKCIJE ---
async function fetchIssuedBooks() {
  loading.value = true;
  error.value = null;
  selected.value = [];
  
  try {
    if (!token) throw new Error('Niste prijavljeni');

    const response = await axios.get(`${apiBaseUrl}/api/rentals/active`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: itemsPerPage.value, page: currentPage.value, book_id: bookId },
    });
    
    const rentalsData = response.data.data?.data || [];
    
    // ISPRAVLJENO: Mapiranje podataka sa backenda na format koji našoj komponenti treba
    issuedBooks.value = rentalsData.map(rental => ({
      rental_id: rental.id, // Koristimo 'id' koji sada (nadamo se) šalje backend
      izdato_uceniku: `${rental.rented_by?.name || ''} ${rental.rented_by?.last_name || ''}`.trim() || 'Nepoznat učenik',
      student_profile_picture: rental.rented_by?.profile_picture || null,
      datum_izdavanja: rental.rental_date,
      trenutno_zadrzavanje_knjige: calculateCurrentDays(rental.rental_date),
      prekoracenje_u_danima: calculateOverdueDays(rental.rental_date),
      knjigu_izdao: `${rental.rented_out_by?.name || ''} ${rental.rented_out_by?.last_name || ''}`.trim() || 'Nepoznat izdavalac',
    }));
    
    totalItems.value = response.data.data?.total || 0;
  } catch (err) {
    console.error('Greška pri učitavanju izdatih knjiga:', err);
    error.value = `Greška pri učitavanju izdatih knjiga: ${err.response?.data?.message || err.message}`;
    if (err.response?.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
}

async function fetchBookDetails() {
  try {
    if (!token) throw new Error('Niste prijavljeni');
    const response = await axios.get(`${apiBaseUrl}/api/books/${bookId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    book.value = {
      id: response.data.book?.id || bookId,
      naziv_knjige: response.data.book?.name || response.data.book?.title || 'Nepoznat naslov',
    };
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    book.value = { id: bookId, naziv_knjige: 'Knjiga nije pronađena' };
  }
}

async function returnBooks(rentalIds) {
  loading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    if (!token) throw new Error('Niste prijavljeni');
    if (!rentalIds || rentalIds.length === 0) throw new Error('Nema ID-jeva za vraćanje');

    const promises = rentalIds.map(rentalId => 
      axios.post(`${apiBaseUrl}/api/rentals/${rentalId}/return`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );

    await Promise.all(promises);
    return { success: true, count: rentalIds.length };
  } catch (err) {
    console.error('Greška pri vraćanju knjiga:', err);
    const errorMessage = `Greška pri vraćanju knjiga: ${err.response?.data?.error || err.response?.data?.message || err.message}`;
    error.value = errorMessage;
    return { success: false, error: errorMessage };
  } finally {
    loading.value = false;
  }
}

// --- HANDLER FUNKCIJE ---
const handleReturnAction = async () => {
  error.value = null;
  successMessage.value = null;

  const rentalIdsToReturn = selected.value;

  if (rentalIdsToReturn.length === 0) {
    error.value = 'Morate izabrati barem jedan primerak knjige za vraćanje.';
    return;
  }
  
  const confirmation = confirm(`Da li ste sigurni da želite da vratite ${rentalIdsToReturn.length} izabran(a) primerak/primerka?`);
  if (!confirmation) return;
  
  const result = await returnBooks(rentalIdsToReturn);
  
  if (result.success) {
    successMessage.value = `Uspešno vraćeno ${result.count} knjiga!`;
    selected.value = [];
    await fetchIssuedBooks();
  }
};

const cancel = () => router.back();

// --- WATCHERS ---
watch([currentPage, itemsPerPage], fetchIssuedBooks);

// --- LIFECYCLE ---
onMounted(() => {
  fetchBookDetails();
  fetchIssuedBooks();
});
</script>

<style scoped>
/* CSS stilovi ostaju nepromenjeni */
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f6f8;
}

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

.table-title {
  font-size: 20px;
  font-weight: 500;
  color: #222;
  margin: 0;
}

.no-border-table {
  border: none;
  box-shadow: none;
}

.table-row {
  height: 56px;
}

.cell-naziv {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}

.naziv-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overdue-days {
  color: #CF2A27;
  font-weight: 500;
}

.pagination-and-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  border-top: 1px solid #e0e0e0;
  background-color: white;
}

.pagination-footer {
  margin-top: 16px;
}
</style>