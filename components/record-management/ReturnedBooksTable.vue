<template>
  <div class="table-container">
    <div>
      <v-data-table
        :headers="visibleHeaders"
        :items="filteredBooks"
        :loading="loading"
        loading-text="Učitavam istorijat vraćanja..."
        item-value="id"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        hide-default-footer
        hover
        class="no-border-table"
        :item-class="itemClass"
      >
        
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
          <div class="d-flex align-center justify-end">
            <ActionMenu
              :item="item"
              entity-name="knjigu"
              title-property="naziv_knjige"
              @view="handleView"
              :show-view="true"
              :show-delete="false"
              :show-otpisi="false"
              :show-izdaj="false"
              :show-vrati="false"
              :show-rezervisi="false"
            />
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-arrow-right-outline</v-icon>
            <h3 class="text-h6 mb-2 text-grey-darken-1">Nema vraćenih kopija ove knjige</h3>
            <p class="text-body-2 text-grey">Ne postoji zapis da je ova knjiga ikada bila vraćena.</p>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import PaginationFooter from '~/components/pagination-footer.vue'
import ActionMenu from '~/components/action-menu.vue'

const router = useRouter()
const route = useRoute()

const returnedBooks = ref([])
const loading = ref(false)
const apiBaseUrl = 'http://localhost'

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)

const bookId = computed(() => route.params.id)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 5000,
});

const visibleHeaders = ref([
  { title: 'Izdato učeniku', key: 'izdato_uceniku', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Datum vraćanja', key: 'datum_vracanja', sortable: true },
  { title: 'Zadržavanje knjige', key: 'zadrzavanje_knjige', sortable: true },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
])

const showErrorSnackbar = (message) => {
  snackbar.value.text = message;
  snackbar.value.color = 'error';
  snackbar.value.timeout = 5000;
  snackbar.value.show = true;
};

const showSuccessSnackbar = (message) => {
  snackbar.value.text = message;
  snackbar.value.color = 'success';
  snackbar.value.timeout = 5000;
  snackbar.value.show = true;
};

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (err) {
    return dateString
  }
}

const calculateHoldDuration = (issueDateString, returnDateString) => {
  if (!issueDateString || !returnDateString) return '-'
  try {
    const issueDate = new Date(issueDateString)
    const returnDate = new Date(returnDateString)
    const diffTime = Math.abs(returnDate - issueDate)
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
     
    if (isNaN(totalDays)) return '-'

    const weeks = Math.floor(totalDays / 7)
    const days = totalDays % 7

    let result = ''
    if (weeks > 0) {
      result += `${weeks} nedelj${weeks === 1 ? 'a' : (weeks >= 2 && weeks <= 4 ? 'e' : 'a')}`
    }
    if (days > 0) {
      if (weeks > 0) result += ' i '
      result += `${days} dan${days === 1 ? '' : (days >= 2 && days <= 4 ? 'a' : 'a')}`
    }
    return result || '0 dana'
  } catch (err) {
    return '-'
  }
}

const fetchReturnedBooks = async (id, page = 1, perPage = 20) => {
  if (!id) return;
  loading.value = true

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Niste prijavljeni')

    const params = {
      per_page: perPage,
      page: page,
      book_id: id,
    }

    const response = await axios.get(`${apiBaseUrl}/api/rentals/returned`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    })
     
    const booksData = response.data.data?.data || []
    returnedBooks.value = booksData
    totalItems.value = response.data.data?.total || 0
  } catch (err) {
    showErrorSnackbar('Greška pri učitavanju istorijata: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška'))
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  fetchReturnedBooks(bookId.value, currentPage.value, itemsPerPage.value)
}

const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchReturnedBooks(bookId.value, currentPage.value, itemsPerPage.value)
}

const handleView = (item) => {
  router.push(`/book-rental/details/${item.id}`);
}

onMounted(() => { 
  fetchReturnedBooks(bookId.value, currentPage.value, itemsPerPage.value) 
})

watch([itemsPerPage, currentPage], () => {
  if(!loading.value) {
     fetchReturnedBooks(bookId.value, currentPage.value, itemsPerPage.value)
  }
})

watch(bookId, (newId) => {
  if (newId) {
    currentPage.value = 1;
    returnedBooks.value = [];
    fetchReturnedBooks(newId, currentPage.value, itemsPerPage.value);
  }
});


const filteredBooks = computed(() => {
  return returnedBooks.value.map(book => {
    const studentName = book.returned_by 
      ? `${book.returned_by.first_name || ''} ${book.returned_by.last_name || ''}`.trim()
      : 'Nepoznat učenik'
     
    const librarianName = book.rented_out_by 
      ? `${book.rented_out_by.first_name || ''} ${book.rented_out_by.last_name || ''}`.trim()
      : 'Nepoznat bibliotekar'

    return {
      ...book,
      id: book.rental_id,
      book_id: book.book_id,
      naziv_knjige: book.book_title || 'Nepoznat naslov',
      izdato_uceniku: studentName || 'Nepoznat učenik',
      datum_izdavanja: book.rental_date,
      datum_vracanja: book.returned_at,
      knjigu_izdao: librarianName || 'Nepoznat bibliotekar',
    }
  })
})

const itemClass = () => 'table-row'
</script>

<style scoped>
.table-container {
  flex-grow: 1;
  padding: 24px; 
  background-color: #fff;
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

.v-data-table :deep(th) {
  white-space: nowrap !important;
}

.table-row {
  height: 56px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-last-child(1),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-last-child(1) {
  padding-right: 16px !important;
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
</style>