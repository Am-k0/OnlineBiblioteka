<template>
  <div class="page-layout d-flex flex-column">
    <div class="content-area">
      <div>
        <v-data-table
          v-model:selected="selectedItems"
          :headers="visibleHeaders"
          :items="formattedBooks"
          :loading="loading"
          loading-text="Učitavam knjige u prekoračenju..."
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

          <template v-slot:item.izdato_uceniku="{ item }">
            <span class="naziv-text">{{ item.izdato_uceniku }}</span>
          </template>

          <template v-slot:item.datum_izdavanja="{ item }">
            <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
          </template>

          <template v-slot:item.prekoracenje_u_danima="{ item }">
            <span class="broj-text overdue-text">{{ item.prekoracenje_u_danima }}</span>
          </template>

          <template v-slot:item.trenutno_zadrzavanje="{ item }">
            <span class="broj-text">{{ item.trenutno_zadrzavanje }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="cell-actions">
              <ActionMenu
                :item="item"
                entity-name="knjigu u prekoračenju"
                title-property="naziv_knjige"
                :show-view="true"
                :show-vrati="true"
                :show-otpisi="true"
                :show-izdaj="false"
                :show-edit="false"
                :show-delete="false"
                :show-rezervisi="false"
                @view="handleView"
                @otpisi="handleOtpisi"
                @vrati="handleVrati"
                @error="setError"
              />
            </div>
          </template>

          <template #no-data>
            <v-alert>Nema pronađenih knjiga u prekoračenju.</v-alert>
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
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import ActionMenu from '@/components/ActionMenu.vue';
import PaginationFooter from '@/components/PaginationFooter.vue';

const route = useRoute();
const router = useRouter();
const overdueBooks = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const apiBaseUrl = 'http://localhost';

// Paginacija
const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);
const selectedItems = ref([]);

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: false },
  { title: 'Izdato uceniku', key: 'izdato_uceniku', sortable: false },
  { title: 'Prekoracenje u danima', key: 'prekoracenje_u_danima', sortable: false },
  { title: 'Trenutno zadrzavanje knjige', key: 'trenutno_zadrzavanje', sortable: false },
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
      year: 'numeric',
    });
  } catch (err) {
    return dateString;
  }
};

const calculateOverdueDays = (issueDateString) => {
  if (!issueDateString) return 0;
  try {
    const issueDate = new Date(issueDateString);
    const currentDate = new Date();
    const rentalPeriodInDays = 30; // Pretpostavljeni rok za vraćanje

    const diffTime = currentDate.getTime() - issueDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const overdueDays = totalDays > rentalPeriodInDays ? totalDays - rentalPeriodInDays : 0;
    return overdueDays;

  } catch (err) {
    return 0;
  }
};

const formatHoldDuration = (issueDateString) => {
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

const fetchOverdueBooks = async (page = 1, perPage = 20, search = '') => {
  loading.value = true;
  error.value = null;

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
      book_id: bookId, // Dodat je ID knjige u params
    };
    if (search) params.search_value = search;

    const response = await axios.get(`${apiBaseUrl}/api/rentals/overdue`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      params,
    });
    
    const booksData = response.data.data?.data || [];
    overdueBooks.value = booksData;
    totalItems.value = response.data.data?.total || 0;
  } catch (err) {
    error.value = 'Greška pri učitavanju knjiga u prekoračenju: ' +
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
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  currentPage.value = 1;
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
};

onMounted(() => {
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
});

watch([itemsPerPage, currentPage, searchQuery], () => {
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value);
});

const formattedBooks = computed(() => {
  return overdueBooks.value.map(rental => {
    const studentFullName = rental.rented_by
      ? `${rental.rented_by.first_name || ''} ${rental.rented_by.last_name || ''}`.trim()
      : 'Nepoznat učenik';

    return {
      id: rental.rental_id,
      naziv_knjige: rental.book_title || 'Nepoznat naslov',
      izdato_uceniku: studentFullName,
      datum_izdavanja: rental.rental_date,
      prekoracenje_u_danima: calculateOverdueDays(rental.rental_date),
      trenutno_zadrzavanje: formatHoldDuration(rental.rental_date),
    };
  });
});

const itemClass = () => 'table-row';

// Handleri za akcije iz menija
const handleView = (item) => {
  if (item && item.id) {
    router.push(`/loan-management/details/${item.id}`);
  }
};
const handleIzdaj = (item) => {
  if (item && item.id) {
    console.log('Izdaj knjigu:', item);
  }
};
const handleVrati = (item) => {
  if (item && item.id) {
    router.push(`/loan/${item.id}/return`);
  }
};
const handleRezervisi = (item) => {
  if (item && item.id) {
    router.push(`/loan/${item.id}/reserve`);
  }
};
const handleOtpisi = (item) => {
  if (item && item.id) {
    router.push(`/book/${item.book_id}/discard`);
  }
};
const handleDelete = (item) => {
  if (item && item.id) {
    console.log('Obriši knjigu:', item);
  }
};
</script>

<style scoped>
/* Vaši stilovi ostaju nepromenjeni */
.page-layout {
  display: flex;
  flex-direction: column;
}

.content-area {
  flex-grow: 1;
  padding: 24px;
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

.no-border-table {
  border: none;
  box-shadow: none;
}

.no-border-table .v-data-table__wrapper table {
  border-collapse: collapse;
}

.no-border-table .v-data-table__wrapper > table > thead > tr > th,
.no-border-table .v-data-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid #E0E0E0 !important;
}

.table-row {
  height: 56px !important;
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
  border-radius: 2px;
  margin-right: 12px;
}

.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.overdue-text {
  color: #CF2A27;
}
</style>