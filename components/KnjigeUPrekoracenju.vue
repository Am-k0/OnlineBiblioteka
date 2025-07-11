<template>
  <div class="prekoracene-knjige-layout">
    <v-data-table
      :headers="visibleHeaders"
      :items="filteredKnjige"
      :loading="loading"
      loading-text="Učitavam podatke..."
      item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      show-select
      class="custom-table"
      :item-class="itemClass"
      fixed-header
      height="680"
    >
      <template v-slot:item.naziv_knjige="{ item }">
        <div class="cell-naziv d-flex align-center">
          <div class="book-cover-wrapper mr-2">
            <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige" />
          </div>
          <span class="naziv-text text-truncate">{{ item.naziv_knjige }}</span>
        </div>
      </template>
      <template v-slot:item.datum_izdavanja="{ item }">
        <span class="datum-text text-truncate">{{ formatDate(item.datum_izdavanja) }}</span>
      </template>
      <template v-slot:item.prekoracenje_u_danima="{ item }">
        <span class="prekoracenje-text text-truncate">{{ item.prekoracenje_u_danima }} dana</span>
      </template>
      <template v-slot:item.trenutno_zadrzavanje="{ item }">
        <span class="zadrzavanje-text text-truncate">{{ item.trenutno_zadrzavanje || 'N/A' }}</span>
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu
            :item="item"
            entity-name="knjige"
            title-property="naziv_knjige"
            @edit="handleEdit"
            @delete="handleDelete"
            @error="setError"
          />
        </div>
      </template>
    </v-data-table>
    <div class="pagination-footer-wrap">
      <PaginationFooter
        v-model:itemsPerPage="itemsPerPage"
        v-model:currentPage="currentPage"
        :total-items="filteredKnjige.length"
        class="pagination-footer mt-4"
      />
    </div>
    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

interface Knjiga {
  id: number
  naziv_knjige: string
  slika_knjige: string | null
  datum_izdavanja: string | null
  trenutno_zadrzavanje: string | null
  prekoracenje_u_danima: number
}

const router = useRouter()

const knjige = ref<Knjiga[]>([]) // Popuniš iz svog backend-a
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/150?text=Knjiga'
const itemsPerPage = ref(10)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start' as const, sortable: true, width: '254px' },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', align: 'start' as const, sortable: true, width: '133px' },
  { title: 'Prekoračenje u danima', key: 'prekoracenje_u_danima', align: 'start' as const, sortable: false, width: '129px' },
  { title: 'Zadržavanje knjige', key: 'trenutno_zadrzavanje', align: 'start' as const, sortable: false, width: '147px' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false }
])

const setError = (msg: string) => { error.value = msg }
const filteredKnjige = computed(() => knjige.value)
const itemClass = () => 'table-row'
const formatDate = (d: string | null) => {
  if (!d) return 'N/A'
  const date = new Date(d)
  return date.toLocaleDateString('sr-RS')
}

const handleEdit = ({ item, mode }: { item: Knjiga; mode: 'view' | 'edit' }) => {
  if (mode === 'view') router.push(`/overdue-book/${item.id}`)
  else router.push(`/overdue-book/${item.id}?edit=true`)
}

const handleDelete = async (item: Knjiga) => {
  // Dodaj svoju logiku za brisanje ovde
}
</script>

<style scoped>
.prekoracene-knjige-layout {
  width: 100%;
}

.custom-table {
  border: none;
  box-shadow: none;
  flex: 1 1 auto;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  font-weight: 400;
}

/* Redovi */
.table-row {
  height: 68px !important;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  text-align: left !important;
  font-weight: 400;
}

/* Zaglavlja */
::v-deep(.v-data-table thead th) {
  height: 56px !important;
  font-size: 14px !important;
  line-height: 100% !important;
  letter-spacing: 0.25px !important;
  text-align: left !important;
  font-weight: 400 !important;
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Naziv knjige */
.cell-naziv {
  display: flex;
  align-items: center;
  width: 254px;
}

.book-cover-wrapper {
  width: 32px;
  height: 52px;
  overflow: hidden;
  flex-shrink: 0;
}

.book-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Opšti stil za tekst sa tri tačkice */
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.naziv-text {
  max-width: 210px;
  line-height: 100%;
  letter-spacing: 0.25px;
  font-weight: 400;
}

/* Ostale kolone */
.datum-text {
  width: 133px;
  line-height: 100%;
  letter-spacing: 0.25px;
  font-weight: 400;
}

.prekoracenje-text {
  width: 129px;
  line-height: 100%;
  letter-spacing: 0.25px;
  font-weight: 400;
}

.zadrzavanje-text {
  width: 147px;
  line-height: 100%;
  letter-spacing: 0.25px;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination-footer-wrap {
  margin-top: 16px;
}
</style>
