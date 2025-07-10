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
      <template v-slot:item.naziv="{ item }">
        <div class="cell-naziv d-flex align-center">
          <v-avatar size="36" class="mr-2">
            <img :src="item.avatar || defaultAvatar" alt="Avatar" />
          </v-avatar>
          <span class="naziv-text">{{ item.naziv }}</span>
        </div>
      </template>
      <template v-slot:item.opis="{ item }">
        <span class="opis-text">{{ item.opis }}</span>
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu 
            :item="item"
            entity-name="autora"
            title-property="naziv"
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
      :total-items="filteredAutori.length"
      class="pagination-footer mt-4"
    />
    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

const router = useRouter()

const autori = ref([]) // Popuniš iz svog backend-a
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

const setError = (err) => {
  error.value = err
}

const filteredAutori = computed(() => {
  if (!props.search) return autori.value
  return autori.value.filter(a =>
    a.naziv?.toLowerCase().includes(props.search.toLowerCase()) ||
    a.opis?.toLowerCase().includes(props.search.toLowerCase())
  )
})

const itemClass = () => 'table-row'

const handleEdit = ({ item, mode }) => {
  if (mode === 'view') {
    router.push(`/author/${item.id}`)
  } else if (mode === 'edit') {
    router.push(`/author/${item.id}?edit=true`)
  }
}

const handleDelete = async (item) => {
  // Dodaj svoju logiku za brisanje ovde
}
</script>

<style scoped>
.table-row { height: 56px; }
.cell-naziv {
  width: 130px;
  height: 40px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.naziv-text, .opis-text {
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
