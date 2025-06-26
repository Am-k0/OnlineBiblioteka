<template>
  <div>
    <v-data-table
      :headers="visibleHeaders"
      :items="filteredBibliotekari"
      :loading="loading"
      loading-text="Učitavam bibliotekare..."
      item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      show-select
      class="no-border-table"
      :item-class="itemClass"
    >
      <!-- Avatar + naziv bibliotekara -->
      <template v-slot:item.ime_i_prezime="{ item }">
        <div class="cell-naziv d-flex align-center">
          <v-avatar size="36" class="mr-2">
            <img :src="item.avatar || defaultAvatar" alt="Avatar" />
          </v-avatar>
          <span class="naziv-text">{{ item.ime_i_prezime }}</span>
        </div>
      </template>

      <!-- Email -->
      <template v-slot:item.email="{ item }">
        <span class="opis-text">{{ item.email }}</span>
      </template>

      <!-- Tip korisnika -->
      <template v-slot:item.tip_korisnika="{ item }">
        <span class="opis-text">{{ item.tip_korisnika }}</span>
      </template>

      <!-- Zadnji pristup -->
      <template v-slot:item.zadnji_pristup_sistemu="{ item }">
        <span class="opis-text">{{ formatDate(item.zadnji_pristup_sistemu) }}</span>
      </template>

      <!-- Akcije -->
      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu 
            :item="item"
            entity-name="bibliotekara"
            title-property="ime_i_prezime"
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
      :total-items="filteredBibliotekari.length"
      class="pagination-footer mt-4"
    />

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
      <div class="mt-2">
        <v-btn @click="fetchBibliotekari" color="white" small>Pokušaj ponovo</v-btn>
      </div>
    </v-alert>
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

const bibliotekari = ref([])
const loading = ref(false)
const error = ref(null)
const defaultAvatar = 'https://randomuser.me/api/portraits/men/1.jpg'
const itemsPerPage = ref(10)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Ime i prezime', key: 'ime_i_prezime', align: 'start', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Tip korisnika', key: 'tip_korisnika', sortable: true },
  { title: 'Zadnji pristup sistemu', key: 'zadnji_pristup_sistemu', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const fetchBibliotekari = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('bibliotekari')
      .select('id, ime_i_prezime, email, tip_korisnika, zadnji_pristup_sistemu, avatar')

    if (supabaseError) throw supabaseError

    bibliotekari.value = (data || []).map(b => ({
      ...b,
      avatar: b.avatar || defaultAvatar,
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

const filteredBibliotekari = computed(() => {
  if (!props.search) return bibliotekari.value
  return bibliotekari.value.filter(b => 
    b.ime_i_prezime.toLowerCase().includes(props.search.toLowerCase()) ||
    b.email.toLowerCase().includes(props.search.toLowerCase()) ||
    b.tip_korisnika.toLowerCase().includes(props.search.toLowerCase())
  )
})

const itemClass = () => 'table-row'

const handleEdit = ({ item, mode }) => {
  if (mode === 'view') {
    router.push(`/librarian/${item.id}`)
  } else if (mode === 'edit') {
    router.push(`/librarian/${item.id}?edit=true`)
  }
}

const handleDelete = async (item) => {
  try {
    const { error } = await supabase
      .from('bibliotekari')
      .delete()
      .eq('id', item.id)

    if (error) throw error

    await fetchBibliotekari()
  } catch (err) {
    setError(`Došlo je do greške pri brisanju: ${err.message}`)
  }
}

onMounted(fetchBibliotekari)
</script>

<style scoped>
.no-border-table {
  border: none;
  box-shadow: none;
}

.table-row {
  height: 56px;
}

.cell-naziv {
  width: 100%;
  overflow: hidden;
}

.naziv-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.opis-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}
</style>