<template>
  <div class="iznajmljivanje-layout">
    <!-- Lijevi meni -->
    <nav class="side-menu">
      <v-list nav dense class="pa-0">
        <v-list-item
          v-for="(item, i) in stavke"
          :key="i"
          :active="tab === i"
          @click="tab = i"
          class="side-menu-item"
        >
          <div class="side-menu-row">
            <v-list-item-icon>
              <v-icon :color="tab === i ? 'primary' : 'grey'" size="24">{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title :class="['side-menu-text', tab === i ? 'font-weight-bold blue--text' : '']">
              {{ item.label }}
            </v-list-item-title>
          </div>
        </v-list-item>
        <div class="menu-divider-wrap">
          <v-divider class="custom-divider" />
        </div>
      </v-list>
    </nav>

    <div class="main-content">
      <div v-if="tab === 0" class="fixed-table-container">
        <div class="table-and-pagination">
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
            class="no-border-table"
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
        </div>
        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
          <div class="mt-2">
            <v-btn @click="fetchKnjige" color="white" small>Pokušaj ponovo</v-btn>
          </div>
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'


const router = useRouter()
const supabase = useSupabaseClient()

const tab = ref(0)
const stavke = [
  { label: 'Izdate knjige', icon: 'mdi-file-document-outline' },
  { label: 'Vracenje knjige', icon: 'mdi-file-restore-outline' },
  { label: 'Knjige u prekoračenju', icon: 'mdi-alert-outline' },
  { label: 'Aktivne rezervacije', icon: 'mdi-calendar-clock' },
  { label: 'Arhivirane rezervacije', icon: 'mdi-archive-outline' }
]

const knjige = ref([])
const loading = ref(false)
const error = ref(null)
const defaultBookCover = 'https://via.placeholder.com/150?text=Knjiga'
const itemsPerPage = ref(20)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start', sortable: true, width: '265px' },
  { title: 'Datum izdavanja', key: 'datum_izdavanja', sortable: true, width: '135px' },
  { title: 'Trenutno zadrzavanje knjige', key: 'trenutno_zadrzavanje', sortable: false, width: '206px' },
  { title: 'Knjigu izdao', key: 'knjigu_izdao', sortable: true, width: '124px' },
  { title: '', key: 'actions', align: 'end', sortable: false }
])

const fetchKnjige = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('id, naziv_knjige, slika_knjige, datum_izdavanja, trenutno_zadrzavanje, knjigu_izdao')
      .order('datum_izdavanja', { ascending: false })

    if (supabaseError) throw supabaseError

    knjige.value = (data || []).map(k => ({
      ...k,
      slika_knjige: k.slika_knjige || defaultBookCover,
    }))
  } catch (err) {
    setError(`Došlo je do greške: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const setError = (err) => {
  error.value = err
}

const filteredKnjige = computed(() => knjige.value)

const itemClass = () => 'table-row'

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS')
}

const handleEdit = ({ item, mode }) => {
  if (mode === 'view') {
    router.push(`/book/${item.id}`)
  } else if (mode === 'edit') {
    router.push(`/book/${item.id}?edit=true`)
  }
}

const handleDelete = async (item) => {
  try {
    const { error } = await supabase
      .from('knjige')
      .delete()
      .eq('id', item.id)

    if (error) throw error

    await fetchKnjige()
  } catch (err) {
    setError(`Došlo je do greške pri brisanju: ${err.message}`)
  }
}

onMounted(fetchKnjige)
</script>

<style scoped>
.iznajmljivanje-layout {
  display: flex;
  background: #fff;
  width: 1829px;
  height: 804px;
  overflow: hidden;
}
.side-menu {
  width: 247px;
  min-width: 247px;
  max-width: 247px;
  height: 281px;
  min-height: 281px;
  max-height: 281px;
  background: #fafbfc;
  padding-top: 12px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
}
.side-menu-item {
  display: flex;
  align-items: center;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  padding: 0 8px 0 8px;
  cursor: pointer;
  border-radius: 0;
  background: transparent;
  margin-bottom: 0;
}
.side-menu-row {
  display: flex;
  align-items: center;
  width: 231px;
  height: 40px;
  min-width: 231px;
  max-width: 231px;
}
.v-list-item-icon {
  min-width: 24px !important;
  width: 24px !important;
  height: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.side-menu-text {
  font-weight: 400;
  font-size: 16px;
  line-height: 100%;
  letter-spacing: 0.5px;
  color: #222;
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.side-menu-item.v-list-item--active,
.side-menu-item.v-list-item--active .v-icon {
  background: #e3f2fd !important;
  color: #1976d2 !important;
}
.menu-divider-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0 16px 0;
}
.custom-divider {
  width: 200px;
  height: 1px;
  background: #e0e0e0;
  margin: 0;
}
.main-content {
  flex: 1;
  padding: 0 0 0 24px;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 804px;
  width: 1580px;
  min-width: 1580px;
  max-width: 1580px;
}
.fixed-table-container {
  width: 1580px;
  height: 748px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-and-pagination {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.no-border-table {
  border: none;
  box-shadow: none;
  flex: 1 1 auto;
  min-height: 0;
}
.pagination-footer-wrap {
  flex-shrink: 0;
  background: #fff;
}
.v-data-table {
  font-size: 14px;
  width: 1580px !important;
}
.v-data-table-header th {
  font-weight: 500 !important;
  font-size: 14px !important;
  color: #222 !important;
  background: #fff !important;
  height: 56px !important;
  min-width: 0 !important;
  padding: 0 8px !important;
}
.v-data-table__checkbox {
  margin-left: 6px !important;
}
.table-row {
  height: 68px !important;
  min-height: 68px !important;
  max-height: 68px !important;
}
.cell-naziv {
  width: 265px;
  min-width: 265px;
  max-width: 265px;
  height: 52px;
  min-height: 52px;
  max-height: 52px;
  overflow: hidden;
  display: flex;
  align-items: center;
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
.naziv-text {
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 210px;
}
.datum-text {
  width: 135px;
  min-width: 135px;
  max-width: 135px;
  height: 40px;
  line-height: 40px;
  font-weight: 400;
  font-size: 14px;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}
.zadrzavanje-text {
  width: 206px;
  min-width: 206px;
  max-width: 206px;
  height: 52px;
  line-height: 52px;
  font-weight: 400;
  font-size: 14px;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}
.izdao-text {
  width: 124px;
  min-width: 124px;
  max-width: 124px;
  height: 52px;
  line-height: 52px;
  font-weight: 400;
  font-size: 14px;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}
.cell-actions {
  display: flex;
  justify-content: flex-end;
} 
</style>