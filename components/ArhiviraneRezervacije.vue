<template>
  <div class="arhivirane-rezervacije-layout">
    <v-data-table
      :headers="visibleHeaders"
      :items="filteredRezervacije"
      :loading="loading"
      loading-text="Učitavam arhivu..."
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
            <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige" />
          </v-avatar>
          <span class="naziv-text">{{ item.naziv_knjige }}</span>
        </div>
      </template>
      <template v-slot:item.datum_rezervacije="{ item }">
        <span class="datum-text">{{ formatDate(item.datum_rezervacije) }}</span>
      </template>
      <template v-slot:item.rezervacija_istice="{ item }">
        <span class="datum-text">{{ formatDate(item.rezervacija_istice) }}</span>
      </template>
      <template v-slot:item.status="{ item }">
        <span class="status-text">{{ item.status }}</span>
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
      :total-items="filteredRezervacije.length"
      class="pagination-footer mt-4"
    />

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
      <div class="mt-2">
        <v-btn @click="fetchRezervacije" color="white" small>Pokušaj ponovo</v-btn>
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

interface ArhiviranaRezervacija {
  id: number
  naziv_knjige: string
  slika_knjige: string | null
  datum_rezervacije: string | null
  rezervacija_istice: string | null
  status: 'izdato' | 'istekla'  // prilagodi po potrebi
}

const router = useRouter()
const supabase = useSupabaseClient()
const rezervacije = ref<ArhiviranaRezervacija[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/150?text=Knjiga'
const itemsPerPage = ref(20)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start' as const, sortable: true },
  { title: 'Datum rezervacije', key: 'datum_rezervacije', align: 'center' as const, sortable: true },
  { title: 'Ističe', key: 'rezervacija_istice', align: 'center' as const, sortable: true },
  { title: 'Status', key: 'status', align: 'center' as const, sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false }
])

const fetchRezervacije = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('id, naziv_knjige, slika_knjige, datum_rezervacije, rezervacija_istice, status') as { data: ArhiviranaRezervacija[] | null, error: any }

    if (supabaseError) throw supabaseError

    rezervacije.value = (data || []).map(r => ({
      ...r,
      slika_knjige: r.slika_knjige || defaultBookCover
    }))
  } catch (err: any) {
    setError(`Greška: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const setError = (msg: string) => { error.value = msg }
const filteredRezervacije = computed(() => rezervacije.value)
const itemClass = () => 'table-row'
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('sr-RS') : ''

const handleEdit = ({ item, mode }: { item: ArhiviranaRezervacija; mode: 'view' | 'edit' }) => {
  router.push(`/archived-reservation/${item.id}${mode === 'edit' ? '?edit=true' : ''}`)
}

const handleDelete = async (item: ArhiviranaRezervacija) => {
  try {
    const { error } = await supabase.from('knjige').delete().eq('id', item.id)
    if (error) throw error
    await fetchRezervacije()
  } catch (err: any) {
    setError(`Greška pri brisanju: ${err.message}`)
  }
}

onMounted(fetchRezervacije)
</script>

<style scoped>
.arhivirane-rezervacije-layout { display: flex; flex-direction: column; width: 100%; }
.no-border-table { border: none; box-shadow: none; flex: 1 1 auto; }
.table-row { height: 68px !important; }
.cell-naziv { display: flex; align-items: center; width: 250px; }
.naziv-text { font-size: 14px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-text, .datum-text { font-size: 14px; }
.cell-actions { display: flex; justify-content: flex-end; }
</style>
