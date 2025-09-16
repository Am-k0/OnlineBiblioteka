<template>
  <div>
    <v-data-table
      :headers="visibleHeaders"
      :items="books"
      :loading="loading"
      loading-text="Učitavam knjige i statistiku..."
      item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      class="no-border-table"
      :item-class="itemClass"
    >
      <template #item.naziv_knjige="{ item }">
        <div class="cell-naziv d-flex align-center cursor-pointer" @click="handleView(item)">
          <div class="book-cover-wrapper mr-2">
            <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige"/>
          </div>
          <span class="naziv-text">{{ item.naziv_knjige }}</span>
        </div>
      </template>

      <template #item.u_prekoracenju="{ item }">
        <span :class="{ 'text-error': item.u_prekoracenju > 0 }">{{ item.u_prekoracenju }}</span>
      </template>

      <template #item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu
            :item="item"
            entity-name="knjigu"
            title-property="naziv_knjige"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
            @otpisi="handleOtpisi"
            @izdaj="handleIzdaj"
            @vrati="handleVrati"
            @rezervisi="handleRezervisi"
            @error="showErrorSnackbar"
            :show-view="true"
            :show-edit="isLibrarian"
            :show-delete="isLibrarian"
            :show-otpisi="isLibrarian"
            :show-izdaj="isLibrarian"
            :show-vrati="isLibrarian || isStudent"
            :show-rezervisi="isLibrarian || isStudent"
          />
        </div>
      </template>

      <template #no-data>
        <v-alert>Nema pronađenih knjiga.</v-alert>
      </template>
    </v-data-table>

    <PaginationFooter
      v-model:itemsPerPage="itemsPerPage"
      v-model:currentPage="currentPage"
      :total-items="totalItems"
      class="pagination-footer mt-4"
    />

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
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
import { ref, watch, onMounted, computed } from 'vue'
import axios from '@/axios'
import ActionMenu from '~/components/action-menu.vue'
import PaginationFooter from '~/components/pagination-footer.vue'
import { navigateTo } from '#app';

const props = defineProps({
  search: {
    type: String,
    default: ''
  }
})

const books = ref([])
const loading = ref(false)
const defaultBookCover = '/images/default-book-1.jpg'
const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const user = ref(null);

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
})

const isLibrarian = computed(() => user.value && user.value.role === 'librarian');
const isStudent = computed(() => user.value && user.value.role === 'student');

const visibleHeaders = [
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Autor', key: 'autor', sortable: true },
  { title: 'Kategorija', key: 'kategorija', sortable: true },
  { title: 'Na raspolaganju', key: 'na_raspolaganju', sortable: false },
  { title: 'Rezervisano', key: 'rezervisano', sortable: false },
  { title: 'Izdato', key: 'izdato', sortable: false },
  { title: 'U prekoračenju', key: 'u_prekoracenju', sortable: false },
  { title: 'Ukupna količina', key: 'ukupna_kolicina', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
]

const itemClass = () => 'table-row'

function showErrorSnackbar(message) {
  snackbar.value.text = message;
  snackbar.value.color = 'error';
  snackbar.value.show = true;
}

function showSuccessSnackbar(message) {
  snackbar.value.text = message;
  snackbar.value.color = 'success';
  snackbar.value.show = true;
}

async function fetchBooks(page = 1, perPage = 20) {
  loading.value = true
  
  try {
    const [
      booksResponse,
      activeRentalsResponse,
      overdueRentalsResponse,
      activeReservationsResponse
    ] = await Promise.all([
      axios.get('/books', { params: { page, per_page: perPage, search_value: props.search } }),
      axios.get('/rentals/active?book=true'),
      axios.get('/rentals/overdue?book=true'),
      axios.get('/reservations/active?book=true')
    ]);

    const booksData = booksResponse.data.books.data || [];
    totalItems.value = booksResponse.data.books.total || 0;
    
    const activeRentals = activeRentalsResponse.data.data?.data || [];
    const overdueRentals = overdueRentalsResponse.data.data?.data || [];
    const activeReservations = activeReservationsResponse.data.reservations?.data || [];

    const rentalIdToBookIdMap = {};
    activeRentals.forEach(rental => {
        if (rental.rental_id && rental.book_id) {
            rentalIdToBookIdMap[rental.rental_id] = rental.book_id;
        }
    });

    const issuedCounts = {};
    activeRentals.forEach(rental => {
      if (rental.book_id) {
        issuedCounts[rental.book_id] = (issuedCounts[rental.book_id] || 0) + 1;
      }
    });

    const overdueCounts = {};
    overdueRentals.forEach(overdue => {
        const bookId = rentalIdToBookIdMap[overdue.rental_id];
        if (bookId) {
            overdueCounts[bookId] = (overdueCounts[bookId] || 0) + 1;
        }
    });
    
    const reservedCounts = {};
    activeReservations.forEach(reservation => {
      if (reservation.book_id) {
        reservedCounts[reservation.book_id] = (reservedCounts[reservation.book_id] || 0) + 1;
      }
    });

    books.value = booksData.map(book => {
      const total_copies = book.number_of_copies_available || 0;
      const issued_count = issuedCounts[book.id] || 0;
      const reserved_count = reservedCounts[book.id] || 0;

      return {
        id: book.id,
        naziv_knjige: book.name || 'Nepoznat naziv',
        autor: (book.authors && book.authors.length)
          ? book.authors.map(a => `${a.first_name} ${a.last_name}`).join(', ')
          : 'Nepoznat autor',
        kategorija: (book.categories && book.categories.length)
          ? book.categories.map(c => c.name).join(', ')
          : '-',
        slika_knjige: getImageUrl(book),
        
        ukupna_kolicina: total_copies,
        izdato: issued_count,
        rezervisano: reserved_count,
        u_prekoracenju: overdueCounts[book.id] || 0,
        na_raspolaganju: total_copies - issued_count - reserved_count,
      }
    })
    
  } catch (err) {
    showErrorSnackbar('Greška pri učitavanju podataka. Proverite da li su svi API endpointi dostupni.');
    console.error('Fetch data error:', err);
    books.value = [];
  } finally {
    loading.value = false;
  }
}

function getImageUrl(book) {
  if (!book.images || book.images.length === 0) return undefined;
  const image = book.images.find(img => img.type === 'front_cover');
  return image ? `${axios.defaults.baseURL}/storage/${image.path}` : undefined;
}

// Izmijenjena metoda handleDelete
async function handleDelete(item) {
  if (!item || !item.id) {
    showErrorSnackbar('Greška: Podaci o knjizi nisu dostupni.');
    return;
  }

  loading.value = true;

  try {
    await axios.delete(`/books/${item.id}/destroy`);
    
    const bookIndex = books.value.findIndex(book => book.id === item.id);
    if (bookIndex !== -1) {
      books.value.splice(bookIndex, 1);
      totalItems.value = Math.max(0, totalItems.value - 1);
    }
    
    showSuccessSnackbar(`Knjiga "${item.naziv_knjige}" je uspješno obrisana!`);
    
    const totalPages = Math.ceil(totalItems.value / itemsPerPage.value);
    if (currentPage.value > totalPages && totalPages > 0) {
      currentPage.value = totalPages;
    }
    if (books.value.length === 0 && totalItems.value > 0) {
      await fetchBooks(currentPage.value, itemsPerPage.value);
    }
  } catch (err) {
    console.error('Greška pri brisanju knjige:', err);
    if (err.response) {
      showErrorSnackbar(err.response.data?.message || 'Došlo je do greške na serveru.');
    } else {
      showErrorSnackbar('Greška mreže. Proverite internetsku konekciju.');
    }
  } finally {
    loading.value = false;
  }
}

function handleEdit(item) { if (item && item.id) navigateTo(`/book/${item.id}/edit`); }
function handleView(item) { if (item && item.id) navigateTo(`/book/${item.id}`); }
function handleOtpisi(item) { if (item && item.id) navigateTo(`/book/${item.id}/discard`); }
function handleIzdaj(item) { if (item && item.id) navigateTo(`/book/${item.id}/issue`); }
function handleVrati(item) { if (item && item.id) navigateTo(`/book/${item.id}/return`); }
function handleRezervisi(item) { if (item && item.id) navigateTo(`/book/${item.id}/reserve`); }


watch([itemsPerPage, currentPage, () => props.search], () => {
  fetchBooks(currentPage.value, itemsPerPage.value)
})

onMounted(() => {
  if (process.client) {
    const storedUser = localStorage.getItem('user');
    user.value = storedUser ? JSON.parse(storedUser) : null;
  }
  fetchBooks(currentPage.value, itemsPerPage.value);
})
</script>

<style scoped>
.no-border-table { border: none; box-shadow: none; }
.table-row { height: 56px; }
.cell-naziv { width: 100%; overflow: hidden; }
.book-cover-wrapper { width: 32px; height: 52px; overflow: hidden; flex-shrink: 0; }
.book-cover-wrapper img { width: 32px; height: 52px; object-fit: cover; display: block; }
.naziv-text, .opis-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-actions { display: flex; justify-content: flex-end; }
.text-error { color: rgb(var(--v-theme-error)); font-weight: bold; }

.cell-naziv:hover .naziv-text {
  color: #3481e6; 
}

.cell-naziv:hover {
  cursor: pointer;
}
</style>