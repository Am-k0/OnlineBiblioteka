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
  datum_vracanja: string | null
  trenutno_zadrzavanje: string | null
  prekoracenje?: number
}

const router = useRouter()
const supabase = useSupabaseClient()
const knjige = ref<Knjiga[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/150?text=Knjiga'
const itemsPerPage = ref(20)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start' as const, sortable: true, width: '250px' },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', align: 'center' as const, sortable: true, width: '130px' },
  { title: 'Prekoračenje (dana)', key: 'prekoracenje', align: 'center' as const, sortable: false, width: '140px' },
  { title: 'Trenutno zadržavanje', key: 'trenutno_zadrzavanje', align: 'center' as const, sortable: false, width: '160px' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '80px' }
])

// Helper funkcija za računanje prekoračenja u danima
function calculatePrekoracenje(datumVracanja: string | null): number {
  if (!datumVracanja) return 0
  const today = new Date()
  const dueDate = new Date(datumVracanja)
  const diffMs = today.getTime() - dueDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const fetchKnjige = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('id, naziv_knjige, slika_knjige, datum_izdavanja, datum_vracanja, trenutno_zadrzavanje') as { data: Knjiga[] | null, error: any }

    if (supabaseError) throw supabaseError

    knjige.value = (data || []).map(k => ({
      ...k,
      slika_knjige: k.slika_knjige || defaultBookCover,
      prekoracenje: calculatePrekoracenje(k.datum_vracanja)
    }))
  } catch (err: any) {
    setError(`Greška: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const setError = (msg: string) => { error.value = msg }
const filteredKnjige = computed(() => knjige.value)
const itemClass = () => 'table-row'
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('sr-RS') : ''

const handleEdit = ({ item, mode }: { item: any; mode: 'view' | 'edit' }) => {
  router.push(`/overdue-book/${item.id}${mode === 'edit' ? '?edit=true' : ''}`)
}

const handleDelete = async (item: any) => {
  try {
    const { error } = await supabase.from('knjige').delete().eq('id', item.id)
    if (error) throw error
    await fetchKnjige()
  } catch (err: any) {
    setError(`Greška pri brisanju: ${err.message}`)
  }
}

onMounted(fetchKnjige)
</script>

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
      class="no-border-table"
      :item-class="itemClass"
      fixed-header
      height="680"
    >
      <template v-slot:item.naziv_knjige="{ item }">
        <div class="cell-naziv d-flex align-center">
          <v-avatar class="mr-2" size="32">
            <img :src="item.slika_knjige || ''" alt="Slika knjige" />
          </v-avatar>
          <span class="naziv-text">{{ item.naziv_knjige }}</span>
        </div>
      </template>
      <template v-slot:item.datum_izdavanja="{ item }">
        <span class="datum-text">{{ formatDate(item.datum_izdavanja) }}</span>
      </template>
      <template v-slot:item.prekoracenje="{ item }">
        <span class="datum-text">{{ item.prekoracenje }} dana</span>
      </template>
      <template v-slot:item.trenutno_zadrzavanje="{ item }">
        <span class="zadrzavanje-text">{{ item.trenutno_zadrzavanje }}</span>
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

    <PaginationFooter
      v-model:itemsPerPage="itemsPerPage"
      v-model:currentPage="currentPage"
      :total-items="filteredKnjige.length"
      class="pagination-footer mt-4"
    />

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
      <div class="mt-2">
        <v-btn @click="fetchKnjige" color="white" small>Pokušaj ponovo</v-btn>
      </div>
    </v-alert>
  </div>
</template>

<style scoped>
.prekoracene-knjige-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.no-border-table {
  border: none;
  box-shadow: none;
  flex: 1 1 auto;
}
.table-row {
  height: 68px !important;
}
.cell-naziv {
  display: flex;
  align-items: center;
  width: 250px;
}
.naziv-text {
  font-size: 14px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zadrzavanje-text,
.datum-text {
  font-size: 14px;
}
.cell-actions {
  display: flex;
  justify-content: flex-end;
}
.pagination-footer {
  margin-top: 16px;
}
</style>
