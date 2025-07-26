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
      <template #item.autor="{ item }">
        <span class="opis-text">{{ item.autor }}</span>
      </template>
      <template #item.kategorija="{ item }">
        <span class="opis-text">{{ item.kategorija }}</span>
      </template>
      <template #item.na_raspolaganju="{ item }">
        <span class="opis-text">{{ item.na_raspolaganju }}</span>
      </template>
      <template #item.rezervisano="{ item }">
        <span class="opis-text">{{ item.rezervisano }}</span>
      </template>
      <template #item.izdato="{ item }">
        <span class="opis-text">{{ item.izdato }}</span>
      </template>
      <template #item.u_prekoracenju="{ item }">
        <span class="opis-text">{{ item.u_prekoracenju }}</span>
      </template>
      <template #item.ukupna_kolicina="{ item }">
        <span class="opis-text">{{ item.ukupna_kolicina }}</span>
      </template>
      <template #item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu
            :item="item"
            entity-name="knjigu"
            title-property="naziv_knjige"
            @edit="handleEdit"
            @delete="handleDelete"
            @otpisi="handleOtpisi"
            @izdaj="handleIzdaj"
            @vrati="handleVrati"
            @rezervisi="handleRezervisi"
            @error="setError"
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
import { useRouter } from 'vue-router'
import axios from '@/axios'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

const router = useRouter()
const books = ref([])
const loading = ref(false)
const error = ref(null)
const defaultBookCover = '/images/default-book-1.jpg'
const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)

const visibleHeaders = [
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Autor', key: 'autor', sortable: true },
  { title: 'Kategorija', key: 'kategorija', sortable: true },
  { title: 'Na raspolaganju', key: 'na_raspolaganju', sortable: true },
  { title: 'Rezervisano', key: 'rezervisano', sortable: true },
  { title: 'Izdato', key: 'izdato', sortable: true },
  { title: 'U prekoračenju', key: 'u_prekoracenju', sortable: true },
  { title: 'Ukupna količina', key: 'ukupna_kolicina', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
]
const itemClass = () => 'table-row'

function setError(err) { error.value = err }
async function fetchBooks(page = 1, perPage = 20) {
  loading.value = true
  try {
    const res = await axios.get('/books', { params: { page, per_page: perPage } })
    const booksData = res.data.books.data || []
    books.value = booksData.map(book => ({
      id: book.id,
      naziv_knjige: book.name,
      autor: (book.authors && book.authors.length)
        ? book.authors.map(a => a.name || `${a.first_name} ${a.last_name}`).join(', ')
        : '-',
      kategorija: (book.categories && book.categories.length)
        ? book.categories.map(c => c.name).join(', ')
        : '-',
      na_raspolaganju: book.number_of_copies_available || 0,
      rezervisano: book.reserved_count || 0,
      izdato: book.issued_count || 0,
      u_prekoracenju: book.overdue_count || 0,
      ukupna_kolicina: book.total_count || book.number_of_copies_available || 0,
      slika_knjige: getImageUrl(book),
    }))
    totalItems.value = res.data.books.total || booksData.length
  } catch (err) {
    error.value = 'Greška pri učitavanju knjiga.'
    books.value = []
  } finally {
    loading.value = false
  }
}
function getImageUrl(book) {
  const image = (book.images || []).find(img => img.type === 'front_cover')
  return image ? `/storage/${image.path}` : undefined
}
function handleEdit({ item, mode }) {
  if (mode === 'view') router.push(`/books/${item.id}`)
  else if (mode === 'edit') router.push(`/books/${item.id}?edit=true`)
}
function handleDelete(item) {}
function handleOtpisi(item) {}
function handleIzdaj(item) {}
function handleVrati(item) {}
function handleRezervisi(item) {}

watch([itemsPerPage, currentPage], () => {
  fetchBooks(currentPage.value, itemsPerPage.value)
})
onMounted(() => fetchBooks(currentPage.value, itemsPerPage.value))
</script>

<style scoped>
.no-border-table { border: none; box-shadow: none; }
.table-row { height: 56px; }
.cell-naziv { width: 100%; overflow: hidden; }
.book-cover-wrapper { width: 32px; height: 52px; overflow: hidden; flex-shrink: 0; }
.book-cover-wrapper img { width: 32px; height: 52px; object-fit: cover; display: block; }
.naziv-text, .opis-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-actions { display: flex; justify-content: flex-end; }
</style>