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

        <template v-slot:item.naziv_knjige="{ item }">
          <div class="cell-naziv d-flex align-center">
            <div class="book-cover-wrapper mr-2">
              <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige" />
            </div>
            <span class="naziv-text">{{ item.naziv_knjige }}</span>
          </div>
        </template>

        <template v-slot:item.datum_izdavanja="{ item }">
          <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
        </template>
        
        <template v-slot:item.izdato_uceniku="{ item }">
          <span class="naziv-text">{{ item.izdato_uceniku }}</span>
        </template>

        <template v-slot:item.prekoracenje_u_danima="{ item }">
          <span class="broj-text overdue-text">{{ item.prekoracenje_u_danima }}</span>
        </template>

        <template v-slot:item.trenutno_zadrzavanje="{ item }">
          <span class="broj-text">{{ item.trenutno_zadrzavanje }}</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center justify-end">
            <ActionMenu
              :item="item"
              entity-name="knjigu"
              title-property="naziv_knjige"
              :show-view="true"
              :show-vrati="false"
              :show-otpisi="false"
              @view="handleView"
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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import PaginationFooter from '@/components/PaginationFooter.vue'
import ActionMenu from '@/components/ActionMenu.vue'

const router = useRouter()
const overdueBooks = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const defaultBookCover = '/images/default-book-1.jpg'
const apiBaseUrl = 'http://localhost'

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const rentalPeriodInDays = 30

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Izdato učeniku', key: 'izdato_uceniku', sortable: true },
  { title: 'Prekoračenje u danima', key: 'prekoracenje_u_danima', align: 'center', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
])

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

const formatHoldDuration = (totalDays) => {
  if (totalDays === null || totalDays === undefined || isNaN(totalDays)) return '-'
  if (totalDays < 0) totalDays = 0

  let months = Math.floor(totalDays / 30)
  let remainingDaysAfterMonths = totalDays % 30
  let weeks = Math.floor(remainingDaysAfterMonths / 7)
  let days = remainingDaysAfterMonths % 7

  let parts = []
  if (months > 0) {
    let monthWord = 'mjesec'
    if (months > 1 && months < 5) monthWord += 'a'
    else if (months >= 5) monthWord += 'i'
    parts.push(`${months} ${monthWord}`)
  }
  if (weeks > 0) {
    let weekWord = 'nedelja'
    if (weeks > 1 && weeks < 5) weekWord += 'e'
    parts.push(`${weeks} ${weekWord}`)
  }
  if (days > 0) {
    let dayWord = 'dan'
    if (days > 1 && days < 5) dayWord += 'a'
    parts.push(`${days} ${dayWord}`)
  }

  return parts.join(' i ') || '0 dana'
}

const getImageUrl = (book) => {
  const bookData = book.book || book
  if (!bookData || !bookData.images) return undefined
  
  const image = (bookData.images || []).find(img => img.type === 'front_cover')
  return image ? `${apiBaseUrl}/storage/${image.path}` : undefined
}

const fetchOverdueBooks = async (page = 1, perPage = 20, search = '') => {
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

    const response = await axios.get(`${apiBaseUrl}/api/rentals/overdue`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    })
    
    const booksData = response.data.data?.data || []
    overdueBooks.value = booksData
    totalItems.value = response.data.data?.total || 0
  } catch (err) {
    error.value = 'Greška pri učitavanju knjiga u prekoračenju: ' +
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
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
}

// Funkcija za navigaciju na stranicu sa detaljima
const handleView = (item) => {
  router.push(`/loan-management/details/${item.id}`);
}

onMounted(() => { 
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value) 
})

watch([itemsPerPage, currentPage], () => {
  fetchOverdueBooks(currentPage.value, itemsPerPage.value, searchQuery.value)
})

const filteredBooks = computed(() => {
  return overdueBooks.value.map(book => {
    const studentFullName = book.rented_by 
      ? `${book.rented_by.first_name || ''} ${book.rented_by.last_name || ''}`.trim()
      : 'Nepoznat učenik'

    return {
      ...book,
      id: book.rental_id,
      naziv_knjige: book.book_title || 'Nepoznat naslov',
      datum_izdavanja: book.rental_date,
      izdato_uceniku: studentFullName || 'Nepoznat učenik',
      prekoracenje_u_danima: book.days_overdue || 0,
      trenutno_zadrzavanje: formatHoldDuration(book.total_rental_days),
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