<template>
  <div class="table-container">
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
        
        <template v-slot:item.izdato_uceniku="{ item }">
          <span class="naziv-text">{{ item.izdato_uceniku }}</span>
        </template>

        <template v-slot:item.datum_izdavanja="{ item }">
          <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
        </template>
        
        <template v-slot:item.prekoracenje_u_danima="{ item }">
          <span class="broj-text overdue-text">{{ item.prekoracenje_u_danima }} dana</span>
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
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-timer-off-outline</v-icon>
            <h3 class="text-h6 mb-2 text-grey-darken-1">Trenutno nema kopija ove knjige u prekoračenju</h3>
            <p class="text-body-2 text-grey">Sve izdate knjige su vraćene na vrijeme.</p>
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
import { useRouter } from 'vue-router'
import axios from 'axios'
import PaginationFooter from '@/components/PaginationFooter.vue'
import ActionMenu from '@/components/ActionMenu.vue'

const router = useRouter()
const overdueBooks = ref([])
const loading = ref(false)
const apiBaseUrl = 'http://localhost'

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 5000,
});

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Izdato učeniku', key: 'izdato_uceniku', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Prekoračenje u danima', key: 'prekoracenje_u_danima', align: 'center', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje', sortable: true },
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

const formatHoldDuration = (totalDays) => {
  if (totalDays === null || totalDays === undefined || isNaN(totalDays)) return '-'
  if (totalDays < 0) totalDays = 0

  let years = Math.floor(totalDays / 365)
  totalDays %= 365
  let months = Math.floor(totalDays / 30)
  totalDays %= 30
  let weeks = Math.floor(totalDays / 7)
  let days = totalDays % 7

  let parts = []
  if (years > 0) {
    let yearWord = 'godina'
    if (years === 1) yearWord = 'godina'
    else if (years >= 2 && years <= 4) yearWord = 'godine'
    else yearWord = 'godina'
    parts.push(`${years} ${yearWord}`)
  }
  if (months > 0) {
    let monthWord = 'mjesec'
    if (months === 1) monthWord = 'mjesec'
    else if (months >= 2 && months <= 4) monthWord = 'mjeseca'
    else monthWord = 'mjeseci'
    parts.push(`${months} ${monthWord}`)
  }
  if (weeks > 0) {
    let weekWord = 'nedelja'
    if (weeks === 1) weekWord = 'nedelja'
    else if (weeks >= 2 && weeks <= 4) weekWord = 'nedelje'
    else weekWord = 'nedelja'
    parts.push(`${weeks} ${weekWord}`)
  }
  if (days > 0) {
    let dayWord = 'dan'
    if (days === 1) dayWord = 'dan'
    else if (days >= 2 && days <= 4) dayWord = 'dana'
    else dayWord = 'dana'
    parts.push(`${days} ${dayWord}`)
  }

  return parts.join(', ') || '0 dana'
}

const fetchOverdueBooks = async (page = 1, perPage = 20) => {
  loading.value = true

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Niste prijavljeni')

    const params = {
      per_page: perPage,
      page: page,
    }

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
    showErrorSnackbar('Greška pri učitavanju knjiga u prekoračenju: ' +
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
  fetchOverdueBooks(currentPage.value, itemsPerPage.value)
}

const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchOverdueBooks(currentPage.value, itemsPerPage.value)
}

const handleView = (item) => {
  router.push(`/loan-management/details/${item.id}`); 
}

onMounted(() => { 
  fetchOverdueBooks(currentPage.value, itemsPerPage.value) 
})

watch([itemsPerPage, currentPage], () => {
  fetchOverdueBooks(currentPage.value, itemsPerPage.value)
})

const filteredBooks = computed(() => {
  return overdueBooks.value.map(book => {
    const student = book.rented_by
    const studentFullName = student 
      ? `${student.name || ''} ${student.last_name || ''}`.trim()
      : 'Nepoznat učenik'

    return {
      ...book,
      id: book.rental_id,
      book_id: book.book_id,
      naziv_knjige: book.book_title || 'Nepoznat naslov',
      datum_izdavanja: book.rental_date,
      izdato_uceniku: studentFullName,
      prekoracenje_u_danima: book.days_overdue || 0,
      trenutno_zadrzavanje: formatHoldDuration(book.total_rental_days),
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