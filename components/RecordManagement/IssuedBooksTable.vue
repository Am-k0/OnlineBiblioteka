<template>
  <div class="page-layout d-flex flex-column">
    <div class="content-area">
      <div>
        <v-data-table
          v-model:selected="selectedItems"
          :headers="visibleHeaders"
          :items="issuedBooks"
          :loading="loading"
          loading-text="Učitavam izdаte knjige..."
          item-value="id"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          hide-default-footer
          hover
          show-select
          class="no-border-table"
        >
          <template v-slot:item.data-table-select="{ item }">
            <div class="h-[56px] flex items-center justify-center">
              <v-checkbox-btn :value="item.id" class="no-checkbox-border"></v-checkbox-btn>
            </div>
          </template>

          <template v-slot:item.izdato_uceniku="{ item }">
            <span class="naziv-text">{{ item.izdato_uceniku }}</span>
          </template>

          <template v-slot:item.datum_izdavanja="{ item }">
            <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
          </template>

          <template v-slot:item.trenutno_zadrzavanje="{ item }">
            <span 
              class="broj-text" 
              :class="{ 'overdue-text': isOverdue(item.datum_izdavanja) }"
            >
              {{ calculateCurrentDuration(item.datum_izdavanja) }}
            </span>
          </template>

          <template v-slot:item.knjigu_izdao="{ item }">
            <span class="naziv-text">{{ item.knjigu_izdao }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="cell-actions">
              <ActionMenu
                :item="item"
                entity-name="izdatu knjigu"
                title-property="naziv_knjige"
                :show-view="true"
                :show-vrati="false"
                :show-otpisi="false"
                :show-izdaj="false"
                :show-edit="false"
                :show-delete="false"
                :show-rezervisi="false"
                @view="handleView"
                @error="showErrorSnackbar"
              />
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-remove-outline</v-icon>
              <h3 class="text-h6 mb-2 text-grey-darken-1">Nema pronađenih izdatih kopija za ovu knjigu</h3>
              <p class="text-body-2 text-grey">Trenutno ne postoje izdate kopije ove knjige.</p>
            </div>
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
      </div>
    </div>

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
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import ActionMenu from '@/components/ActionMenu.vue';
import PaginationFooter from '@/components/PaginationFooter.vue';

const route = useRoute();
const router = useRouter();

const issuedBooks = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const apiBaseUrl = 'http://localhost';
const rentalPeriodInDays = 30;

const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);
const selectedItems = ref([]);

// Snackbar state
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 5000,
});

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Izdato učeniku', key: 'izdato_uceniku', sortable: false },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: false },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje', sortable: false },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: false },
  { title: '', key: 'actions', align: 'end', sortable: false },
]);

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
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (err) {
    return dateString;
  }
};

const calculateCurrentDuration = (issueDateString) => {
  if (!issueDateString) return '0 dana';
  try {
    const issueDate = new Date(issueDateString);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - issueDate.getTime();
    let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return '0 dana';

    const years = Math.floor(totalDays / 365);
    totalDays %= 365;
    const months = Math.floor(totalDays / 30);
    totalDays %= 30;
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    const parts = [];
    if (years > 0) {
      parts.push(`${years} godin${years === 1 ? 'a' : (years >= 2 && years <= 4 ? 'e' : 'a')}`);
    }
    if (months > 0) {
      parts.push(`${months} mjesec${months === 1 ? '' : (months >= 2 && months <= 4 ? 'a' : 'i')}`);
    }
    if (weeks > 0) {
      parts.push(`${weeks} nedelj${weeks === 1 ? 'a' : (weeks >= 2 && weeks <= 4 ? 'e' : 'a')}`);
    }
    if (days > 0) {
      parts.push(`${days} dan${days === 1 ? '' : (days >= 2 && days <= 4 ? 'a' : 'a')}`);
    }

    return parts.join(', ') || '0 dana';
  } catch (err) {
    return '0 dana';
  }
};

const isOverdue = (issueDateString) => {
  if (!issueDateString) return false;
  try {
    const issueDate = new Date(issueDateString);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - issueDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return totalDays > rentalPeriodInDays;
  } catch (err) {
    return false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const fetchIssuedBooks = async (page = 1, perPage = 20, search = '') => {
  loading.value = true;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');
    
    const bookId = route.params.id;
    if (!bookId) {
      throw new Error('ID knjige nije pronađen u URL-u.');
    }

    const params = {
      per_page: perPage,
      page: page,
      book_id: bookId,
    };
    const response = await axios.get(`${apiBaseUrl}/api/rentals/active`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params,
    });
    
    const booksData = response.data.data?.data || [];
    
    issuedBooks.value = booksData.map(rental => ({
      id: rental.rental_id,
      naziv_knjige: rental.book_title || 'Nepoznat naslov',
      izdato_uceniku: rental.rented_by 
        ? `${rental.rented_by.first_name || ''} ${rental.rented_by.last_name || ''}`.trim()
        : 'Nepoznat učenik',
      datum_izdavanja: rental.rental_date,
      knjigu_izdao: rental.rented_out_by 
        ? `${rental.rented_out_by.first_name || ''} ${rental.rented_out_by.last_name || ''}`.trim()
        : 'Nepoznat izdavalac',
    }));
    
    totalItems.value = response.data.data?.total || 0;
  } catch (err) {
    console.error('Greška pri učitavanju izdatih knjiga:', err);
    showErrorSnackbar('Greška pri učitavanju izdatih knjiga: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška'));
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handleView = (item) => {
  router.push(`/loan-management/details/${item.id}`); 
}

// Uklonjene su funkcije handleOtpisi i handleVrati jer više nisu potrebne
// s obzirom na to da su opcije za otpis i vraćanje uklonjene iz menija.

onMounted(() => {
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
});

watch([itemsPerPage, currentPage, searchQuery], () => {
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
});
</script>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
}

.content-area {
  flex-grow: 1;
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
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.overdue-text {
  color: #CF2A27;
}
</style>