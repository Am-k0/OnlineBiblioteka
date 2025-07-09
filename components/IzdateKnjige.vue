<template>
  <div class="izdate-knjige-layout">
    <v-data-table
      :headers="visibleHeaders"
      :items="filteredKnjige"
      :loading="loading"
      loading-text="Učitavam knjige..."
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
          <span class="naziv-text">{{ item.naziv_knjige }}</span>
        </div>
      </template>
      <template v-slot:item.datum_izdavanja="{ item }">
        <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
      </template>
      <template v-slot:item.trenutno_zadrzavanje="{ item }">
        <span class="zadrzavanje-text">{{ item.trenutno_zadrzavanje }}</span>
      </template>
      <template v-slot:item.knjigu_izdao="{ item }">
        <span class="izdao-text">{{ item.knjigu_izdao }}</span>
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
      <div class="mt-2">
        <v-btn @click="fetchKnjige" color="white" small>Pokušaj ponovo</v-btn>
      </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

interface Knjiga {
  id: number
  naziv_knjige: string
  slika_knjige: string | null
  datum_izdavanja: string | null
  trenutno_zadrzavanje: string | null
  knjigu_izdao: string | null
}

const router = useRouter()
const supabase = useSupabaseClient()

const knjige = ref<Knjiga[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/150?text=Knjiga'
const itemsPerPage = ref(10)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start' as const, sortable: true, width: '256px' },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', align: 'start' as const, sortable: true, width: '135px' },
  { title: 'Trenutno zadrzavanje knjige', key: 'trenutno_zadrzavanje', align: 'start' as const, sortable: false, width: '209px' },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', align: 'start' as const, sortable: true, width: '125px' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false }
])

const fetchKnjige = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('id, naziv_knjige, slika_knjige, datum_izdavanja, trenutno_zadrzavanje, knjigu_izdao')
      .order('datum_izdavanja', { ascending: false }) as { data: Knjiga[] | null, error: any }

    if (supabaseError) throw supabaseError

    knjige.value = (data || []).map(k => ({
      ...k,
      slika_knjige: k.slika_knjige || defaultBookCover
    }))
  } catch (err: any) {
    setError(`Došlo je do greške: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const setError = (msg: string) => { error.value = msg }
const filteredKnjige = computed(() => knjige.value)
const itemClass = () => 'table-row'
const formatDate = (d: string | null) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('sr-RS')
}

const handleEdit = ({ item, mode }: { item: Knjiga; mode: 'view' | 'edit' }) => {
  if (mode === 'view') router.push(`/book/${item.id}`)
  else router.push(`/book/${item.id}?edit=true`)
}

const handleDelete = async (item: Knjiga) => {
  try {
    const { error } = await supabase.from('knjige').delete().eq('id', item.id)
    if (error) throw error
    await fetchKnjige()
  } catch (err: any) {
    setError(`Došlo je do greške pri brisanju: ${err.message}`)
  }
}

onMounted(fetchKnjige)
</script>

<style scoped>
.izdate-knjige-layout {
  
 
  width: 1581px;
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
  width: 256px;
}

.book-cover-wrapper {
  width: 32px;
  height: 52px;
  overflow: hidden;
}

.book-cover-wrapper img {
  width: 32px;
  height: 52px;
  object-fit: cover;
}

.naziv-text {
  font-size: 14px;
  max-width: 210px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 100%;
  letter-spacing: 0.25px;
  font-weight: 400;
}

/* Ostale kolone */
.datum-text {
  width: 135px;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  text-align: left;
  font-weight: 400;
}

.zadrzavanje-text {
  width: 209px;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  text-align: left;
}

.izdao-text {
  width: 125px;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  text-align: left;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination-footer-wrap {
  margin-top: 16px;
}
.izdate-knjige-layout {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
</style>
