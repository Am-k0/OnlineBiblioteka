<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ book?.name || 'Učitavam...' }}</h1>
        <p class="page-subtitle" v-if="book">
          <span class="link" @click="router.push('/books')">Evidencija knjiga</span> /
          <span class="link" @click="router.push(`/book/${bookId}`)">KNJIGA-{{ bookId }}</span> /
          Otpiši knjigu
        </p>
        <p v-else class="page-subtitle">Učitavam...</p>
      </div>

      <BookMenu :book="book" :isActive="true" v-if="book" />
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <v-data-table
        :headers="tableHeaders"
        :items="rentedBooks"
        :loading="loading"
        loading-text="Učitavam izdate knjige..."
        item-value="rental_id"
        hide-default-footer
        hover
        class="no-border-table"
        :item-class="() => 'table-row'"
      >
        <template #item.rented_by="{ item }">
          <div class="cell-naziv d-flex align-center">
            <v-avatar size="36" class="mr-3">
              <v-img :src="defaultUserImage" :alt="`${item.rented_by.first_name} ${item.rented_by.last_name}`"></v-img>
            </v-avatar>
            <span class="naziv-text">{{ item.rented_by.first_name }} {{ item.rented_by.last_name }}</span>
          </div>
        </template>
        
        <template #item.rental_date="{ item }">
          <span class="datum-text">{{ formatDate(item.rental_date) }}</span>
        </template>
        
        <template #item.active_days="{ item }">
          <span class="broj-text" :class="{ 'overdue-text': isOverdue(item.active_days) }">{{ formatRetentionDays(item.active_days) }}</span>
        </template>

        <template #item.days_overdue="{ item }">
          <span class="broj-text" :class="{ 'overdue-text': getOverdueDays(item.active_days) > 0 }">
            {{ getOverdueDays(item.active_days) > 0 ? getOverdueDays(item.active_days) : '0' }}
          </span>
        </template>

        <template #item.rented_out_by="{ item }">
          <span class="naziv-text">{{ item.rented_out_by.first_name }} {{ item.rented_out_by.last_name }}</span>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-outline</v-icon>
            <h3 class="text-h6 mb-2 text-grey-darken-1">Nema izdatih knjiga</h3>
            <p class="text-body-2 text-grey">Trenutno nema izdatih primeraka ove knjige.</p>
          </div>
        </template>

        <template #bottom>
          <div class="pagination-and-actions">
            <v-spacer></v-spacer>
            <ActionButtons
              @save="showDiscardDialog"
              @cancel="cancel"
              :loading="isProcessing"
              saveLabel="OTPIŠI KNJIGU"
              cancelLabel="PONIŠTI"
              saveIcon="mdi-delete-outline"
              :disabled="!book || book.number_of_copies_available <= 0"
            />
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

    <v-dialog v-model="discardDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Potvrdi otpis</v-card-title>
        <v-card-text>
          Da li ste sigurni da želite otpisati ovaj primerak knjige "{{ book?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue" variant="text" @click="discardDialog = false">
            Poništi
          </v-btn>
          <v-btn color="red-darken-1" variant="text" @click="confirmDiscard">
            Otpiši
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      color="#3392EA"
      :timeout="3000"
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
    
    <v-snackbar
      v-model="errorSnackbar.show"
      color="error"
      :timeout="5000"
      top
    >
      {{ errorSnackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="errorSnackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth', 'auth-librarian']
})
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import PaginationFooter from '~/components/pagination-footer.vue';
import BookMenu from '~/components/book-menu.vue';
import ActionButtons from '~/components/action-buttons.vue'; 

const route = useRoute();
const router = useRouter();

// --- STANJE (STATE) ---
const book = ref(null);
const bookId = route.params.id;
const rentedBooks = ref([]);
const loading = ref(true);
const isProcessing = ref(false);
const defaultUserImage = '/images/default-user-1.jpg';

// Snackbar state
const snackbar = ref({
  show: false,
  text: '',
});

// Snackbar state za greške
const errorSnackbar = ref({
  show: false,
  text: '',
});

// Dialog state
const discardDialog = ref(false);

// Paginacija
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

// Politika iznajmljivanja (pretpostavljamo 30 dana)
const rentalPolicyDays = ref(30);

// --- KONFIGURACIJA TABELE ---
const tableHeaders = [
  { title: 'Izdato učeniku', key: 'rented_by', align: 'start', sortable: true },
  { title: 'Datum izdavanja', key: 'rental_date', sortable: true },
  { title: 'Trenutno zadržavanje', key: 'active_days', sortable: true },
  { title: 'Prekoračenje u danima', key: 'days_overdue', align: 'center', sortable: true },
  { title: 'Knjigu izdao', key: 'rented_out_by', sortable: true },
];

// --- API POZIVI ---
async function fetchRentedBooks() {
  loading.value = true;
  
  try {
    const params = {
      book_id: bookId,
      page: currentPage.value,
      per_page: itemsPerPage.value,
    };
    const response = await axios.get('/rentals/active', { params });
    const data = response.data.data;

    rentedBooks.value = data.data;
    totalItems.value = data.total;

  } catch (err) {
    console.error('Greška pri učitavanju izdatih knjiga:', err);
    showErrorSnackbar('Nije moguće učitati podatke o izdatim knjigama.');
  } finally {
    loading.value = false;
  }
}

async function fetchBookDetails() {
  try {
    const res = await axios.get(`/books/${bookId}`);
    book.value = res.data.book; 
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    showErrorSnackbar('Greška pri učitavanju detalja o knjizi.');
  }
}

async function fetchRentalPolicy() {
  try {
    const response = await axios.get('/policies/rental_period');
    rentalPolicyDays.value = response.data.period || 30;
  } catch (err) {
    console.error('Greška pri učitavanju politike iznajmljivanja:', err);
    // Koristimo default vrednost od 30 dana
  }
}

// --- AKCIJE ---
const showDiscardDialog = () => {
  if (!book.value || book.value.number_of_copies_available <= 0) {
    showErrorSnackbar('Nema dostupnih primeraka za otpisivanje.');
    return;
  }
  discardDialog.value = true;
};

const confirmDiscard = async () => {
  discardDialog.value = false;
  
  isProcessing.value = true;
  snackbar.value.show = false;
  errorSnackbar.value.show = false;

  try {
    await axios.post(`/books/${bookId}/discard`, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    showSnackbar('Knjiga je uspešno otpisana.');
    
    if (book.value) {
      book.value.number_of_copies_available = Math.max(0, book.value.number_of_copies_available - 1);
      book.value.total_count = Math.max(0, book.value.total_count - 1);
    }

  } catch (err) {
    console.error('Greška pri otpisivanju knjige:', err);
    let errorMessage = 'Došlo je do greške prilikom otpisivanja knjige.';
    if (err.response && err.response.data && err.response.data.error) {
      errorMessage = err.response.data.error;
    } else if (err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message;
    }
    showErrorSnackbar(errorMessage);
  } finally {
    isProcessing.value = false;
  }
};

const cancel = () => router.back();

// --- POMOĆNE FUNKCIJE ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatRetentionDays = (totalDays) => {
  if (totalDays === null || isNaN(totalDays)) return '-';
  
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  
  let parts = [];
  if (weeks > 0) {
    let weekWord = weeks === 1 ? 'nedelja' : (weeks > 1 && weeks < 5 ? 'nedelje' : 'nedelja');
    parts.push(`${weeks} ${weekWord}`);
  }
  if (days > 0) {
    let dayWord = days === 1 ? 'dan' : 'dana';
    parts.push(`${days} ${dayWord}`);
  }
  
  return parts.join(' i ') || '0 dana';
};

const isOverdue = (days) => {
  return days > rentalPolicyDays.value;
};

const getOverdueDays = (activeDays) => {
  const overdue = activeDays - rentalPolicyDays.value;
  return overdue > 0 ? overdue : 0;
};

const showSnackbar = (text) => {
  snackbar.value.text = text;
  snackbar.value.show = true;
};

const showErrorSnackbar = (text) => {
  errorSnackbar.value.text = text;
  errorSnackbar.value.show = true;
};

// --- HOOKS ---
watch([currentPage, itemsPerPage], fetchRentedBooks);

onMounted(() => {
  fetchBookDetails();
  fetchRentalPolicy();
  fetchRentedBooks();
});
</script>

<style scoped>
/* GENERAL STYLES */
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
}

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin-top: 2px;
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
}
.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 5px;
  margin-bottom: 24px;
}

.page-content {
  padding: 24px;
  flex-grow: 1;
  overflow-y: auto;
}

/* TABLE STYLES */
.no-border-table {
  border: none;
  box-shadow: none;
}
.no-border-table .v-data-table__wrapper > table > thead > tr > th {
  border-bottom: 1px solid #e0e0e0 !important;
}
.no-border-table .v-data-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid #e0e0e0 !important;
}

.table-row {
  height: 64px !important;
}

.cell-naziv {
  display: flex;
  align-items: center;
}

.naziv-text,
.datum-text,
.broj-text {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #212121;
}

.overdue-text {
  color: #CF2A27;
  font-weight: 500;
}

/* FOOTER */
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