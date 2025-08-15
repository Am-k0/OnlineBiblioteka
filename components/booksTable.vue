<template>
  <div>
    <v-data-table
      :headers="visibleHeaders"
      :items="books"
      :loading="loading"
      loading-text="Učitavam knjige..."
      item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      show-select
      class="no-border-table"
      :item-class="itemClass"
    >
      <template #item.naziv_knjige="{ item }">
        <div class="cell-naziv d-flex align-center">
          <div class="book-cover-wrapper mr-2">
            <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige"/>
          </div>
          <span class="naziv-text">{{ item.naziv_knjige }}</span>
        </div>
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
            @error="setError"
            :show-view="true"
            :show-edit="true"
            :show-delete="true"
            :show-otpisi="true"
            :show-izdaj="true"
            :show-vrati="true"
            :show-rezervisi="true"
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
    <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from '@/axios'
import ActionMenu from '@/components/ActionMenu.vue'
import PaginationFooter from '@/components/PaginationFooter.vue'

// Nuxt composables
import { navigateTo } from '#app';

const books = ref([])
const loading = ref(false)
const error = ref(null)
const defaultBookCover = '/images/default-book-1.jpg' // Putanja do vaše podrazumevane slike
const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)

// 1. IZMENA: Ažurirani hederi tabele da odgovaraju podacima iz API-ja
const visibleHeaders = [
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Autor', key: 'autor', sortable: true },
  { title: 'Kategorija', key: 'kategorija', sortable: true },
  { title: 'Ukupna količina', key: 'ukupna_kolicina', sortable: true },
  // Uklonjene kolone za koje nema podataka: Na raspolaganju, Rezervisano, Izdato, U prekoračenju
  { title: '', key: 'actions', align: 'end', sortable: false },
]

const itemClass = () => 'table-row'
function setError(err) { error.value = err }

async function fetchBooks(page = 1, perPage = 20) {
  loading.value = true
  error.value = null // Resetuj grešku pre novog poziva
  try {
    const res = await axios.get('/books', { params: { page, per_page: perPage } })

    // Ispravna putanja do niza knjiga i ukupnog broja
    const booksData = res.data.books.data || []
    totalItems.value = res.data.books.total || 0

    // 2. IZMENA: Mapiranje podataka koji zaista postoje u odgovoru
    books.value = booksData.map(book => ({
      id: book.id,
      naziv_knjige: book.name || 'Nepoznat naziv', // Fallback za slučaj da nema imena
      autor: (book.authors && book.authors.length)
        ? book.authors.map(a => `${a.first_name} ${a.last_name}`).join(', ')
        : 'Nepoznat autor',
      kategorija: (book.categories && book.categories.length)
        ? book.categories.map(c => c.name).join(', ')
        : '-',
      // Jedini podatak o količini koji imamo je 'number_of_copies_available'
      ukupna_kolicina: book.number_of_copies_available || 0,
      slika_knjige: getImageUrl(book),
    }))
    
  } catch (err) {
    error.value = 'Greška pri učitavanju knjiga.'
    console.error(err) // Logovanje greške u konzolu radi lakšeg debagovanja
    books.value = []
  } finally {
    loading.value = false
  }
}

function getImageUrl(book) {
    if (!book.images || book.images.length === 0) {
        return undefined; // Vraća undefined ako nema niza slika
    }
    const image = book.images.find(img => img.type === 'front_cover');
    // Generiše punu URL adresu do slike u Laravel storage-u
    return image ? `${axios.defaults.baseURL}/storage/${image.path}` : undefined;
}


// Handler funkcije ostaju nepromenjene
function handleEdit(item) {
  if (item && item.id) {
    navigateTo(`/book/${item.id}/edit`);
  }
}

function handleView(item) {
  if (item && item.id) {
    navigateTo(`/book/${item.id}`);
  }
}
function handleDelete(item) { /* Logika */ }
function handleOtpisi(item) { if (item && item.id) navigateTo(`/book/${item.id}/discard`); }
function handleIzdaj(item) { if (item && item.id) navigateTo(`/book/${item.id}/issue`); }
function handleVrati(item) { if (item && item.id) navigateTo(`/book/${item.id}/return`); }
function handleRezervisi(item) { if (item && item.id) navigateTo(`/book/${item.id}/reserve`); }

// Watcheri i onMounted ostaju nepromenjeni
watch([itemsPerPage, currentPage], () => {
  fetchBooks(currentPage.value, itemsPerPage.value)
})

onMounted(() => {
  fetchBooks(currentPage.value, itemsPerPage.value)
})
</script>

<style scoped>
/* Stilovi ostaju nepromenjeni */
.no-border-table { border: none; box-shadow: none; }
.table-row { height: 56px; }
.cell-naziv { width: 100%; overflow: hidden; }
.book-cover-wrapper { width: 32px; height: 52px; overflow: hidden; flex-shrink: 0; }
.book-cover-wrapper img { width: 32px; height: 52px; object-fit: cover; display: block; }
.naziv-text, .opis-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-actions { display: flex; justify-content: flex-end; }
</style>