<template>
  <div class="table-container">
    <h2>Evidencija iznajmljivanja</h2>
    <div class="content-area">
      <v-data-table
        :headers="visibleHeaders"
        :items="filteredBooks"
        :loading="loading"
        loading-text="Učitavam izdate knjige..."
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
              <img :src="item.slika_knjige" alt="Slika knjige" />
            </div>
            <span class="naziv-text">{{ item.naziv_knjige }}</span>
          </div>
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
          <v-alert>Nema pronađenih izdatih knjiga za ovog učenika.</v-alert>
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
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ActionMenu from '@/components/ActionMenu.vue'
import PaginationFooter from '@/components/PaginationFooter.vue'

const router = useRouter()
const route = useRoute()
const issuedBooks = ref([])
const loading = ref(false)
const error = ref(null)
const defaultBookCover = '/images/default-book-1.jpg'
const apiBaseUrl = 'http://localhost'
const studentId = ref(null); // Dodano novo ref za spremanje ID-a

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const rentalPeriodInDays = 30;

const visibleHeaders = ref([
  { title: 'Naziv Knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true },
  { title: 'Trenutno zadržavanje knjige', key: 'trenutno_zadrzavanje', sortable: true },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
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
    if (years > 0) parts.push(`${years} godin${years === 1 ? 'a' : 'e'}`)
    if (months > 0) parts.push(`${months} mjesec${months === 1 ? '' : 'i'}`)
    if (weeks > 0) parts.push(`${weeks} nedelj${weeks === 1 ? 'a' : 'e'}`)
    if (days > 0) parts.push(`${days} dan${days === 1 ? '' : 'a'}`)

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

const getStudentIdByUsername = async (username) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${apiBaseUrl}/api/users/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data[0]?.id || null;
  } catch (err) {
    console.error('Greška pri dohvaćanju ID-a korisnika po username-u:', err);
    return null;
  }
};

const fetchIssuedBooks = async () => {
  loading.value = true
  error.value = null

  const username = route.params.username;
  if (!username) {
    setError('Greška: Korisničko ime nije pronađeno u URL-u.');
    loading.value = false;
    return;
  }

  // Prvo dohvati ID studenta na temelju korisničkog imena
  const id = await getStudentIdByUsername(username);
  if (!id) {
    setError('Greška: ID studenta nije pronađen za zadato korisničko ime.');
    loading.value = false;
    return;
  }
  studentId.value = id;

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Niste prijavljeni')

    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
      student_id: studentId.value,
    }

    const response = await axios.get(`${apiBaseUrl}/api/rentals/active`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    })
    
    issuedBooks.value = response.data.data?.data || []
    totalItems.value = response.data.data?.total || 0
  } catch (err) {
    error.value = 'Greška pri učitavanju izdatih knjiga: ' +
      (err.response?.data?.message || err.message || 'Nepoznata greška')
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  fetchIssuedBooks()
}

const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchIssuedBooks()
}

onMounted(() => { 
  fetchIssuedBooks() 
})

watch([itemsPerPage, currentPage], () => {
  fetchIssuedBooks()
})

const filteredBooks = computed(() => {
  return issuedBooks.value.map(rental => {
    const librarianFullName = rental.rented_out_by 
      ? `${rental.rented_out_by.first_name || ''} ${rental.rented_out_by.last_name || ''}`.trim()
      : 'Nepoznat izdavalac'

    return {
      ...rental,
      id: rental.rental_id,
      naziv_knjige: rental.book_title || 'Nepoznat naslov',
      datum_izdavanja: rental.rental_date,
      knjigu_izdao: librarianFullName,
      slika_knjige: defaultBookCover,
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
  setError('Greška: Informacije o ID-ju knjige nisu dostupne za otpisivanje sa ove stranice.');
}

const handleVrati = (item) => {
  if (item && item.id) {
    console.log(`Akcija za vraćanje knjige pokrenuta za iznajmljivanje ID: ${item.id}`);
    // Ovdje ide logika za API poziv za vraćanje knjige
  } else {
    setError('Greška: ID iznajmljivanja za vraćanje nije pronađen.');
  }
}
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