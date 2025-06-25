<template>
  <div>
    <v-data-table
      :headers="visibleHeaders"
      :items="filteredAutori"
      :loading="loading"
      loading-text="Učitavam autore..."
      item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      show-select
      class="no-border-table"
      :item-class="itemClass"
    >
      <!-- Avatar + naziv autora -->
      <template v-slot:item.naziv="{ item }">
        <div class="cell-naziv d-flex align-center">
          <v-avatar size="36" class="mr-2">
            <img :src="item.avatar || defaultAvatar" alt="Avatar" />
          </v-avatar>
          <span class="naziv-text">{{ item.naziv }}</span>
        </div>
      </template>

      <!-- Opis autora -->
      <template v-slot:item.opis="{ item }">
        <span class="opis-text">{{ item.opis }}</span>
      </template>

      <!-- Akcije -->
      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu 
            :author="item"
            @edit="handleEdit"
            @delete="handleDelete"
            @error="setError"
          />
        </div>
      </template>
    </v-data-table>

    <!-- Pagination ispod tabele -->
    <PaginationFooter
      v-model:itemsPerPage="itemsPerPage"
      v-model:currentPage="currentPage"
      :total-items="filteredAutori.length"
      class="pagination-footer mt-4"
    />

    <!-- Greška -->
    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
      <div class="mt-2">
        <v-btn @click="fetchAutori" color="white" small>Pokušaj ponovo</v-btn>
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

const autori = ref([])
const loading = ref(false)
const error = ref(null)
const defaultAvatar = 'https://randomuser.me/api/portraits/men/1.jpg'
const itemsPerPage = ref(10)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv Autora', key: 'naziv', value: 'naziv', align: 'start', sortable: true },
  { title: 'Opis', key: 'opis', value: 'opis', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
})

const fetchAutori = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('autori')
      .select('id, naziv, opis, avatar')

    if (supabaseError) throw supabaseError

    autori.value = (data || []).map(a => ({
      ...a,
      avatar: a.avatar || defaultAvatar,
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

const filteredAutori = computed(() => {
  if (!props.search) return autori.value
  return autori.value.filter(a =>
    a.naziv.toLowerCase().includes(props.search.toLowerCase()) ||
    a.opis.toLowerCase().includes(props.search.toLowerCase())
  )
})

const itemClass = () => 'table-row'

const handleEdit = ({ author, mode }) => {
  if (mode === 'view') {
    router.push(`/author/${author.id}`)
  } else if (mode === 'edit') {
    router.push(`/author/${author.id}?edit=true`)
  }
}

const handleDelete = () => {
  fetchAutori()
}

onMounted(fetchAutori)
</script>

<style scoped>
.table-row {
  height: 56px;
}

.cell-naziv {
  width: 130px;
  height: 40px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.naziv-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.opis-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


</style>
