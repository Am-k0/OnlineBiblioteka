<template>
  <div class="page-layout d-flex">
    <LoansNavigation />
    <div class="content-area">
      <div class="header-section mb-4">
        <h2>Izdavanje knjiga</h2>
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
          loading-text="Učitavam izdаte knjige..."
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
            <span class="datum-text">{{ calculateReturnDate(item.datum_izdavanja) }}</span>
          </template>

          <template v-slot:item.trenutno_zadrzavanje="{ item }">
            <span 
              class="broj-text" 
              :class="{ 'overdue-text': isOverdue(item.datum_izdavanja) }"
            >
              {{ calculateCurrentDuration(item.datum_izdavanja) }}
            </span>
          </template>

          <template v-slot:item.knjiga_izdao="{ item }">
            <span class="naziv-text">{{ item.knjiga_izdao }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="cell-actions">
              <ActionMenu
                :item="item"
                entity-name="izdatu knjigu"
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
            <v-alert>Nema pronađenih izdatih knjiga.</v-alert>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import LoansNavigation from '@/components/LoansNavigation.vue'
import ActionMenu from '@/components/ActionMenu.vue'
import PaginationFooter from '@/components/PaginationFooter.vue'

const router = useRouter()
const issuedBooks = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const defaultBookCover = '/images/default-book-1.jpg'
const apiBaseUrl = 'http://localhost'

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const rentalPeriodInDays = 30; // Definisanje roka za iznajmljivanje

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Izdato učeniku', key: 'izdato_uceniku', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Datum vraćanja', key: 'datum_vracanja', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje', sortable: true },
  { title: 'Knjigu izdao', key: 'knjiga_izdao', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

const props = defineProps({
  search: { type: String, default: '' },
})

const setError = (err) => {
  error.value = err
  setTimeout(() => error.value = null, 5000)
}

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

const calculateReturnDate = (issueDateString) => {
  if (!issueDateString) return '-'
  try {
    const issueDate = new Date(issueDateString)
    const returnDate = new Date(issueDate)
    returnDate.setDate(issueDate.getDate() + rentalPeriodInDays)
    return returnDate.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (err) {
    return '-'
  }
}

const calculateCurrentDuration = (issueDateString) => {
  if (!issueDateString) return '0 dana'
  try {
    const issueDate = new Date(issueDateString)
    const currentDate = new Date()
    const diffTime = currentDate.getTime() - issueDate.getTime()
    let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) return '0 dana'

    const years = Math.floor(totalDays / 365)
    totalDays %= 365
    const months = Math.floor(totalDays / 30)
    totalDays %= 30
    const weeks = Math.floor(totalDays / 7)
    const days = totalDays % 7

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
    return '0 dana'
  }
}

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

const getImageUrl = (book) => {
  const bookData = book.book || book;
  if (!bookData || !bookData.images) return undefined;
  
  const image = (bookData.images || []).find(img => img.type === 'front_cover')
  return image ? `${apiBaseUrl}/storage/${image.path}` : undefined
}

const fetchIssuedBooks = async (page = 1, perPage = 20, search = '') => {
  loading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Niste prijavljeni')

    const params = {
      per_page: perPage,
      page: page,
    }
    if (search) params.search_value = search

    const response = await axios.get(`${apiBaseUrl}/api/rentals/active`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    })
    
    console.log('API Response:', response.data) // Debug log
    
    const booksData = response.data.data?.data || []
    issuedBooks.value = booksData
    totalItems.value = response.data.data?.total || 0
  } catch (err) {
    console.error('Fetch error:', err) // Debug log
    error.value = 'Greška pri učitavanju izdatih knjiga: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška')
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

onMounted(() => { 
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value) 
})

watch([itemsPerPage, currentPage], () => {
  fetchIssuedBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
})

const filteredBooks = computed(() => {
  return issuedBooks.value.map(book => {
    console.log('Processing book:', book) // Debug log
    
    // Kreiranje puna imena sa fallback vrijednostima
    const studentFullName = book.rented_by 
      ? `${book.rented_by.first_name || ''} ${book.rented_by.last_name || ''}`.trim()
      : 'Nepoznat učenik'
      
    const librarianFullName = book.rented_out_by 
      ? `${book.rented_out_by.first_name || ''} ${book.rented_out_by.last_name || ''}`.trim()
      : 'Nepoznat izdavalac'

    return {
      ...book,
      id: book.rental_id,
      naziv_knjige: book.book_title || 'Nepoznat naslov',
      izdato_uceniku: studentFullName || 'Nepoznat učenik',
      datum_izdavanja: book.rental_date,
      knjiga_izdao: librarianFullName || 'Nepoznat izdavalac',
      slika_knjige: getImageUrl(book),
    }
  })
})

const itemClass = () => 'table-row'

const handleView = (item) => {
  if (item && item.id) {
    router.push(`/loan-management/details/${item.id}`)
  }
}

const handleOtpisi = (item) => {
  if (item && item.book && item.book.id) {
    router.push(`/book/${item.book.id}/discard`)
  } else {
    setError('Greška: ID knjige za otpisivanje nije pronađen.');
  }
}

const handleVrati = (item) => {
  if (item && item.id) {
    console.log(`Pokušavam da vratim knjigu sa ID-om ${item.id}`);
  } else {
    setError('Greška: ID knjige za vraćanje nije pronađen.');
  }
}
</script>

<style scoped>
/* Vaši stilovi ostaju nepromenjeni */
.page-layout {
  display: flex;
  height: 100vh;
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

.overdue-text {
  color: #CF2A27;
}
</style>