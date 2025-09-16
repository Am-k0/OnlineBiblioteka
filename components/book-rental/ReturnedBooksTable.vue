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
        :items="filteredBooks"
        :loading="loading"
        loading-text="Učitavam vraćene knjige..."
        item-value="id"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        hide-default-footer
        hover
        class="no-border-table"
        :item-class="itemClass"
      >
        <template v-slot:item.naziv_knjige="{ item }">
          <div class="cell-naziv d-flex align-center cursor-pointer" @click="handleView(item)">
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
          <div class="d-flex align-center justify-end">
            <ActionMenu
              :item="item"
              entity-name="knjigu"
              title-property="naziv_knjige"
              :show-view="true"
              :show-izdaj="false"
              :show-vrati="false"
              :show-rezervisi="false"
              :show-otpisi="false"
              @view="handleView"
              @error="showErrorSnackbar"
            />
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-book-arrow-right-outline</v-icon>
            <h3 class="text-h6 mb-2 text-grey-darken-1">Trenutno nema vraćenih knjiga</h3>
            <p class="text-body-2 text-grey">Nema podataka o vraćenim knjigama u sistemu.</p>
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
        <v-btn color="white" variant="text" @click="snackbar.show = false">Zatvori</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import PaginationFooter from '~/components/pagination-footer.vue'
import ActionMenu from '~/components/action-menu.vue'

const router = useRouter()
const returnedBooks = ref([])
const loading = ref(false)
const searchQuery = ref('')
const defaultBookCover = '/images/default-book-1.jpg'
const apiBaseUrl = 'http://localhost'
const userRole = ref(null);

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 5000,
});

const isLibrarian = computed(() => userRole.value === 'librarian')

const visibleHeaders = ref([
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
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
  snackbar.value.timeout = null; 
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

    const years = Math.floor(totalDays / 365)
    let remainingDays = totalDays % 365
    const months = Math.floor(remainingDays / 30)
    remainingDays %= 30
    const weeks = Math.floor(remainingDays / 7)
    const days = remainingDays % 7

    const parts = []
    if (years > 0) {
      parts.push(`${years} godin${years === 1 ? 'a' : (years >= 2 && years <= 4 ? 'e' : 'a')}`)
    }
    if (months > 0) {
      parts.push(`${months} mjesec${months === 1 ? '' : (months >= 2 && months <= 4 ? 'a' : 'i')}`)
    }
    if (weeks > 0) {
      parts.push(`${weeks} nedelj${weeks === 1 ? 'a' : (weeks >= 2 && weeks <= 4 ? 'e' : 'a')}`)
    }
    if (days > 0) {
      parts.push(`${days} dan${days === 1 ? '' : (days >= 2 && days <= 4 ? 'a' : 'a')}`)
    }
    
    return parts.join(', ') || '0 dana'
  } catch (err) {
    return '-'
  }
}

const getImageUrl = (book) => {
  const bookData = book.book || book
  if (!bookData || !bookData.images) return undefined
  const image = (bookData.images || []).find(img => img.type === 'front_cover')
  return image ? `${apiBaseUrl}/storage/${image.path}` : undefined
}

const fetchReturnedBooks = async (page = 1, perPage = 20, search = '') => {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Niste prijavljeni')
    const params = { per_page: perPage, page: page }
    if (search) params.search_value = search
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
    showErrorSnackbar('Greška pri učitavanju vraćenih knjiga: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška'))
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const handleView = (item) => {
  if (item && item.id) {
    router.push(`/book-rental/details/${item.id}`)
  } else {
    showErrorSnackbar('Detalji o knjizi nisu dostupni.');
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}
const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}
const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const user = localStorage.getItem('user')
    if (user) {
      userRole.value = JSON.parse(user).role
    }
  }
  fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
})

watch([itemsPerPage, currentPage], () => {
  if (!loading.value) {
    fetchReturnedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
  }
})

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
      slika_knjige: getImageUrl(book),
    }
  })
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
.no-border-table :deep(th) {
  white-space: nowrap !important;
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
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:first-child,
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:first-child {
  padding-left: 16px !important;
}
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:last-child,
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:last-child {
  padding-right: 16px !important;
}

.cell-naziv {
  width: 100%;
  overflow: hidden;
  cursor: pointer;
}
.cell-naziv:hover .naziv-text {
  color: #3489f8;
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