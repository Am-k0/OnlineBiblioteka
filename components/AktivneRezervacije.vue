<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

interface KnjigaRezervacija {
  id: number
  naziv_knjige: string
  slika_knjige: string | null
  datum_rezervacije: string | null
  rezervacija_istice: string | null
  status: 'rezervisano' | 'odbijeno' | string
}

const router = useRouter()
const supabase = useSupabaseClient()
const rezervacije = ref<KnjigaRezervacija[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/32x52?text=Knjiga'
const itemsPerPage = ref(20)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start' as const, sortable: true, width: '231px' },
  { title: 'Datum rezervacije', key: 'datum_rezervacije', align: 'start' as const, sortable: true, width: '146px' },
  { title: 'Rezervacija ističe', key: 'rezervacija_istice', align: 'start' as const, sortable: true, width: '143px' },
  { title: 'Status', key: 'status', align: 'start' as const, sortable: true, width: '181px' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false }
])

const fetchRezervacije = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('id, naziv_knjige, slika_knjige, datum_rezervacije, rezervacija_istice, status')
      .in('status', ['rezervisano', 'odbijeno']) as { data: KnjigaRezervacija[] | null, error: any }

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

const handleEdit = ({ item, mode }: { item: KnjigaRezervacija; mode: 'view' | 'edit' }) => {
  router.push(`/reservation/${item.id}${mode === 'edit' ? '?edit=true' : ''}`)
}

const handleDelete = async (item: KnjigaRezervacija) => {
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

<template>
  <div class="aktivne-rezervacije-layout">
    <v-data-table
      :headers="visibleHeaders"
      :items="filteredRezervacije"
      :loading="loading"
      loading-text="Učitavam rezervacije..."
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
        <div class="cell-naziv">
          <div class="book-avatar">
            <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige" />
          </div>
          <span class="text-truncate">{{ item.naziv_knjige }}</span>
        </div>
      </template>
      <template v-slot:item.datum_rezervacije="{ item }">
        <span class="cell-text">{{ formatDate(item.datum_rezervacije) }}</span>
      </template>
      <template v-slot:item.rezervacija_istice="{ item }">
        <span class="cell-text">{{ formatDate(item.rezervacija_istice) }}</span>
      </template>
      <template v-slot:item.status="{ item }">
        <span class="cell-text">{{ item.status }}</span>
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

<style scoped>
.aktivne-rezervacije-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.custom-table {
  border: none;
  box-shadow: none;
  font-size: 14px;
  font-weight: 400;
}

/* Ukloni razmak između kolona */
::v-deep(.v-data-table__wrapper table) {
  border-spacing: 0 !important;
}

/* Redovi */
.table-row {
  height: 68px !important;
}

/* Naziv knjige + avatar */
.cell-naziv {
  display: flex;
  align-items: center;
  width: 231px;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
}

.book-avatar {
  width: 32px;
  height: 52px;
  margin-right: 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.book-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Tekst */
.text-truncate {
  max-width: 180px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
}

.cell-text {
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination-footer {
  margin-top: 16px;
}
</style>
