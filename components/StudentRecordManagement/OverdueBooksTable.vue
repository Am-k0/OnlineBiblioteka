<template>
  <div class="table-container">
    <h2>Knjige u prekoračenju</h2>
    <div class="content-area">
      <v-data-table
        :headers="headers"
        :items="formattedOverdueBooks"
        :loading="loading"
        loading-text="Učitavam knjige u prekoračenju..."
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

        <template v-slot:item.book_title="{ item }">
          <div class="cell-naziv d-flex align-center">
            <div class="book-cover-wrapper mr-2">
              <v-img
                :src="item.cover_image"
                alt="Naslovna slika knjige"
                class="book-cover-image"
                width="32"
                height="52"
              ></v-img>
            </div>
            <span class="naziv-text">{{ item.book_title }}</span>
          </div>
        </template>
  
        <template v-slot:item.rental_date="{ item }">
          <span class="datum-text">{{ formatDate(item.rental_date) }}</span>
        </template>
        
        <template v-slot:item.days_overdue="{ item }">
          <span class="broj-text overdue-text">{{ item.days_overdue }}</span>
        </template>
  
        <template v-slot:item.total_rental_days="{ item }">
          <span class="broj-text">{{ formatHoldDuration(item.total_rental_days) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="cell-actions">
            <ActionMenu
              :item="item"
              entity-name="knjigu u prekoračenju"
              title-property="book_title"
              :show-view="true"
              :show-vrati="true"
              :show-otpisi="true"
              :show-izdaj="false"
              :show-edit="false"
              :show-delete="false"
              :show-rezervisi="false"
              @view="handleView"
              @vrati="handleVrati"
              @otpisi="handleOtpisi"
              @error="setError"
            />
          </div>
        </template>
  
        <template #no-data>
          <v-alert>Ovaj student nema knjiga u prekoračenju.</v-alert>
        </template>
      </v-data-table>
  
      <PaginationFooter
        v-model:itemsPerPage="itemsPerPage"
        v-model:currentPage="currentPage"
        :total-items="totalItems"
        class="pagination-footer mt-4"
        @update:itemsPerPage="fetchOverdueBooks"
        @update:currentPage="fetchOverdueBooks"
      />
      
      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/axios';
import PaginationFooter from '@/components/PaginationFooter.vue';
import ActionMenu from '@/components/ActionMenu.vue';

const route = useRoute();
const overdueBooks = ref([]);
const loading = ref(false);
const error = ref(null);
const studentId = ref(null);

const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

const defaultBookCover = '/images/default-book-1.jpg';

const headers = ref([
  { title: 'Naziv Knjige', key: 'book_title', sortable: true },
  { title: 'Datum izdavanja', key: 'rental_date', sortable: true },
  { title: 'Prekoračenje u danima', key: 'days_overdue', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'total_rental_days', sortable: true },
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

const formatHoldDuration = (totalDays) => {
  if (totalDays === null || totalDays === undefined || isNaN(totalDays)) return '-';
  if (totalDays < 0) totalDays = 0;

  let years = Math.floor(totalDays / 365);
  let remainingDays = totalDays % 365;
  let months = Math.floor(remainingDays / 30);
  remainingDays %= 30;
  let weeks = Math.floor(remainingDays / 7);
  let days = remainingDays % 7;

  let parts = [];
  if (years > 0) parts.push(`${years} godin${years === 1 ? 'a' : (years >= 2 && years <= 4 ? 'e' : 'a')}`);
  if (months > 0) parts.push(`${months} mjesec${months === 1 ? '' : (months >= 2 && months <= 4 ? 'a' : 'i')}`);
  if (weeks > 0) parts.push(`${weeks} nedelj${weeks === 1 ? 'a' : (weeks >= 2 && weeks <= 4 ? 'e' : 'a')}`);
  if (days > 0) parts.push(`${days} dan${days === 1 ? '' : (days >= 2 && days <= 4 ? 'a' : 'a')}`);

  return parts.join(', ') || '0 dana';
};

const getStudentIdByUsername = async (username) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`http://localhost/api/users/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data?.[0]?.id || null;
  } catch (err) {
    console.error('Greška pri dohvaćanju ID-a korisnika po username-u:', err);
    return null;
  }
};

const fetchOverdueBooks = async () => {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Niste prijavljeni');
    }

    const username = route.params.username;
    if (!username) {
      throw new Error('Korisničko ime nije pronađeno u URL-u.');
    }

    const id = await getStudentIdByUsername(username);
    if (!id) {
      throw new Error('ID studenta nije pronađen za zadato korisničko ime.');
    }
    studentId.value = id;

    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
      student_id: studentId.value,
    };

    const response = await axios.get(`http://localhost/api/rentals/overdue`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params,
    });

    const data = response.data?.data || {};
    overdueBooks.value = data.data || [];
    totalItems.value = data.total || 0;
  } catch (err) {
    console.error('Greška pri učitavanju knjiga u prekoračenju:', err);
    error.value = 'Greška pri učitavanju knjiga u prekoračenju: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOverdueBooks();
});

watch([itemsPerPage, currentPage], () => {
  fetchOverdueBooks();
});

const formattedOverdueBooks = computed(() => {
  return overdueBooks.value.map(book => {
    return {
      id: book.rental_id,
      cover_image: book.book_cover_path || defaultBookCover,
      book_title: book.book_title || 'Nepoznat naslov',
      rental_date: book.rental_date,
      days_overdue: book.days_overdue || 0,
      total_rental_days: book.total_rental_days,
    };
  });
});

const handleView = (item) => {
  console.log(`Prikaz detalja za knjigu u prekoračenju: ${item.book_title} (ID: ${item.id})`);
  // Ovdje možete dodati logiku za preusmjeravanje na stranicu detalja
};

const handleVrati = (item) => {
  console.log(`Vraćanje knjige: ${item.book_title} (ID: ${item.id})`);
  // Ovdje ide logika za API poziv za vraćanje knjige
};

const handleOtpisi = (item) => {
  console.log(`Otpisivanje knjige: ${item.book_title} (ID: ${item.id})`);
  // Ovdje ide logika za API poziv za otpisivanje
};
</script>

<style scoped>
.table-container {
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.content-area {
  padding: 0;
}

h2 {
  font-family: Roboto, sans-serif;
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 16px;
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

.book-cover-wrapper {
  width: 32px;
  height: 52px;
  overflow: hidden;
  flex-shrink: 0;
}

.book-cover-wrapper .book-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 0;
  margin: 0;
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

.overdue-text {
  color: #CF2A27;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination-footer {
  box-shadow: none;
}
</style>