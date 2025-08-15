<template>
  <div class="page-layout d-flex">
    <LoansNavigation />
    <div class="content-area">
      <div class="header-section mb-4">
        <h2>Vraćene knjige</h2>
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
          :headers="headers"
          :items="formattedBooks"
          :loading="loading"
          loading-text="Učitavam vraćene knjige..."
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

          <template v-slot:item.izdato_uceniku="{ item }">
            <span class="naziv-text">{{ item.izdato_uceniku }}</span>
          </template>

          <template v-slot:item.datum_izdavanja="{ item }">
            <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
          </template>

          <template v-slot:item.datum_vracanja="{ item }">
            <span class="datum-text">{{ formatDate(item.datum_vracanja) }}</span>
          </template>

          <template v-slot:item.zadrzavanje_knjige="{ item }">
            <span class="broj-text">{{ calculateHoldDuration(item.datum_izdavanja, item.datum_vracanja) }}</span>
          </template>

          <template v-slot:item.knjigu_izdao="{ item }">
            <span class="naziv-text">{{ item.knjigu_izdao }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="cell-actions">
              <ActionMenu
                :item="item"
                entity-name="vraćenu knjigu"
                title-property="naziv_knjige"
                :show-view="true"
                :show-izdaj="true"
                :show-vrati="true"
                :show-rezervisi="true"
                :show-otpisi="true"
                @view="handleView"
                @izdaj="handleIzdaj"
                @vrati="handleVrati"
                @rezervisi="handleRezervisi"
                @otpisi="handleOtpisi"
                @error="setError"
              />
            </div>
          </template>

          <template #no-data>
            <v-alert>Nema pronađenih vraćenih knjiga.</v-alert>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import LoansNavigation from '@/components/LoansNavigation.vue';
import ActionMenu from '@/components/ActionMenu.vue';
import PaginationFooter from '@/components/PaginationFooter.vue';

const router = useRouter();
const returnedBooks = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const defaultBookCover = '/images/default-book-1.jpg';

const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

const apiBaseUrl = 'http://localhost';

const headers = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Izdato učeniku', key: 'izdato_uceniku', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Datum vraćanja', key: 'datum_vracanja', sortable: true },
  { title: 'Zadržavanje knjige', key: 'zadrzavanje_knjige', sortable: true },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
]);

const setError = (err) => {
  error.value = err;
  setTimeout(() => error.value = null, 5000);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (err) {
    return dateString;
  }
};

const calculateHoldDuration = (issueDateString, returnDateString) => {
  if (!issueDateString || !returnDateString) return '-';
  try {
    const issueDate = new Date(issueDateString);
    const returnDate = new Date(returnDateString);
    const diffTime = Math.abs(returnDate - issueDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isNaN(totalDays)) return '-';

    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    let result = '';
    if (weeks > 0) {
      result += `${weeks} nedelja`;
      if (weeks > 1 && (weeks < 5 || weeks > 20)) result += 'e';
    }
    if (days > 0) {
      if (weeks > 0) result += ' i ';
      result += `${days} dan`;
      if (days > 1 && days < 5) result += 'a';
    }
    return result || '0 dana';
  } catch (err) {
    return '-';
  }
};

const fetchReturnedBooks = async (page = 1, perPage = 20, search = '') => {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');

    const params = {
      per_page: perPage,
      page: page,
    };
    if (search) params.search_value = search;

    const response = await axios.get(`${apiBaseUrl}/api/rentals/returned`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    });
    
    const booksData = response.data.data?.data || [];
    returnedBooks.value = booksData;
    totalItems.value = response.data.data?.total || 0;
  } catch (err) {
    error.value = 'Greška pri učitavanju vraćenih knjiga: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška');
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  currentPage.value = 1;
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

onMounted(() => { 
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value); 
});

watch([itemsPerPage, currentPage], () => {
  if(!loading.value) {
     fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
  }
});

const formattedBooks = computed(() => {
  return returnedBooks.value.map(book => {
    // Ispravljeno spajanje imena i prezimena
    const studentName = `${book.returned_by?.first_name || ''} ${book.returned_by?.last_name || ''}`.trim() || 'Nepoznat učenik';
    const librarianName = `${book.rented_out_by?.first_name || ''} ${book.rented_out_by?.last_name || ''}`.trim() || 'Nepoznat bibliotekar';

    return {
      id: book.id,
      naziv_knjige: book.book_title || 'Nepoznat naslov',
      izdato_uceniku: studentName,
      datum_izdavanja: book.rental_date,
      datum_vracanja: book.returned_at,
      knjigu_izdao: librarianName,
      slika_knjige: defaultBookCover,
    };
  });
});

const itemClass = () => 'table-row';

const handleView = (item) => {
  if (item && item.id) {
    console.log('Pogledaj detalje za:', item);
    // router.push(`/rental/${item.id}`);
  }
};

const handleIzdaj = (item) => {
  console.log('Izdaj knjigu ponovo:', item);
};

const handleVrati = (item) => {
  console.log('Vrati knjigu (akcija nema smisla za već vraćenu knjigu):', item);
  setError('Ova knjiga je već vraćena.');
};

const handleRezervisi = (item) => {
  console.log('Rezerviši knjigu:', item);
};

const handleOtpisi = (item) => {
  console.log('Otpiši knjigu:', item);
};
</script>

<style scoped>
/* Stilovi ostaju isti kao u prethodnoj verziji */
.page-layout {
  display: flex;
  height: 100vh;
}
.content-area {
  flex-grow: 1;
  padding: 24px;
  background-color: #fff;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  border-bottom: 1px solid #E0E0E0 !important;
  box-shadow: none !important;
}
.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  border-bottom-width: 2px !important;
}
.table-row {
  height: 72px !important;
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
.cell-naziv {
  width: 100%;
  overflow: hidden;
}
.book-cover-wrapper {
  width: 32px;
  height: 48px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 2px;
}
.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.naziv-text,
.datum-text,
.broj-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #212121;
}
.cell-actions {
  display: flex;
  justify-content: flex-end;
}
</style>