<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ book?.naziv_knjige || 'Učitavam...' }}</h1>
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
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="table-title">Otpiši knjigu</h2>
      </div>

      <v-data-table
        :headers="tableHeaders"
        :items="issuedBooks"
        :loading="loading"
        loading-text="Učitavam izdate knjige..."
        item-value="id"
        hide-default-footer
        hover
        show-select
        class="no-border-table"
        :item-class="itemClass"
      >
        <template #item.slika="{ item }">
          <div class="cell-naziv d-flex align-center">
            <div class="book-cover-wrapper mr-2">
              <img :src="item.slika" alt="Slika knjige" />
            </div>
          </div>
        </template>
        <template #item.datum_izdavanja="{ item }">
          <span>{{ item.datum_izdavanja }}</span>
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
          <div class="text-center py-4">
            Nema izdatih primeraka ove knjige.
          </div>
        </template>

        <template #bottom>
          <div class="pagination-and-actions">
            <v-spacer></v-spacer>
            <ActionButtons @save="handleDiscardAction" @cancel="cancel" :saveText="'Otpiši knjigu'" />
          </div>
        </template>
      </v-data-table>
      
      <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>

      <PaginationFooter
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
// Uvozimo novu BookMenu komponentu
import BookMenu from '@/components/BookMenu.vue';

const route = useRoute();
const router = useRouter();

// --- STANJE (STATE) ---
const book = ref(null);
const bookId = route.params.id;
const issuedBooks = ref([]);
const loading = ref(false);
const error = ref(null);

// Paginacija
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

// --- KONFIGURACIJA TABELE ---
const tableHeaders = [
  { title: 'Izdato učeniku', key: 'izdato_uceniku', align: 'start', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje_knjige', sortable: true },
  { title: 'Prekoračenje u danima', key: 'prekoracenje_u_danima', sortable: true },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: true },
];

const itemClass = () => 'table-row';

// --- FUNKCIJE ---

async function fetchIssuedBooks() {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('Simuliram dohvatanje podataka...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockData = [
        { id: 1, slika: 'https://i.pravatar.cc/150?img=1', izdato_uceniku: 'Pero Perović', datum_izdavanja: '01.01.2025', trenutno_zadrzavanje_knjige: '2 nedelje i 3 dana', prekoracenje_u_danima: 10, knjigu_izdao: 'Valentina Kaćelan' },
        { id: 2, slika: 'https://i.pravatar.cc/150?img=8', izdato_uceniku: 'Ana Anić', datum_izdavanja: '15.07.2025', trenutno_zadrzavanje_knjige: '5 dana', prekoracenje_u_danima: 0, knjigu_izdao: 'Valentina Kaćelan' },
    ];
    issuedBooks.value = mockData;
    totalItems.value = mockData.length;


  } catch (err) {
    console.error('Greška pri učitavanju izdatih knjiga:', err);
    error.value = 'Nije moguće učitati podatke. Molimo pokušajte ponovo.';
  } finally {
    loading.value = false;
  }
}

async function fetchBookDetails() {
  try {
    // Ovde bi bio poziv ka API-ju za detalje knjige
    // const res = await axios.get(`/books/${bookId}`);
    // book.value = { id: res.data.book.id, naziv_knjige: res.data.book.name, };
    
    // Simulacija
    book.value = { id: bookId, naziv_knjige: 'Simulacija Knjige' };
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    book.value = { id: bookId, naziv_knjige: 'Knjiga nije pronađena' };
  }
}

// Handler funkcija za otpis knjige
const handleDiscardAction = () => {
  // Logika za otpisivanje izabranih knjiga
  console.log('Akcija otpisa pokrenuta za izabrane knjige!');
  
};
const cancel = () => router.back();

// Kada se promeni strana ili broj item-a po strani, pozovi ponovo funkciju za dohvatanje
watch([currentPage, itemsPerPage], () => {
  fetchIssuedBooks();
});

// Kada se komponenta prvi put učita, dohvati podatke
onMounted(() => {
  fetchBookDetails();
  fetchIssuedBooks();
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

/* HEADER ACTIONS */
/* Ovi stilovi su sada u BookMenu.vue, ali ih ostavljam ovde za svaki slucaj da se ne poremeti dizajn */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 1.25px;
  text-transform: none;
  height: auto !important;
  padding: 8px 12px !important;
}

.active-btn {
  background-color: rgba(0, 0, 0, 0.04);
}

/* TABLE STYLES */
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
  gap: 8px;
}

.book-cover-wrapper {
  width: 32px;
  height: 52px;
  overflow: hidden;
  flex-shrink: 0;
}

.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 4px;
}

.overdue-days {
  color: #CF2A27;
}

/* CUSTOM FOOTER AND ACTIONS */
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