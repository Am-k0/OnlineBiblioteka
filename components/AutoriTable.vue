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
      <template v-slot:item.name="{ item }">
        <div class="cell-naziv d-flex align-center">
          <v-avatar size="36" class="mr-2">
            <img :src="getAuthorImage(item)" alt="Avatar" />
          </v-avatar>
          <span class="naziv-text">{{ item.name }}</span>
        </div>
      </template>
      <template v-slot:item.description="{ item }">
        <span class="opis-text">{{ item.description }}</span>
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu 
            :item="item"
            entity-name="autora"
            :title-property="item.name"
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
      :total-items="totalItems"
      class="pagination-footer mt-4"
      @update:itemsPerPage="handleItemsPerPageChange"
      @update:currentPage="handlePageChange"
    />

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

const router = useRouter()

const autori = ref([])
const loading = ref(false)
const error = ref(null)
const defaultAvatar = '/images/default-author.png'
const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)

const visibleHeaders = ref([
  { title: 'Naziv Autora', key: 'name', value: 'name', align: 'start', sortable: true },
  { title: 'Opis', key: 'description', value: 'description', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
})

const getAuthorImage = (author) => {
  return author.image_url || defaultAvatar
}

const setError = (err) => {
  error.value = err
  setTimeout(() => error.value = null, 5000)
}

const fetchAuthors = async () => {
  loading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Niste prijavljeni')
    }

    // Dodaj search_value parametar ako postoji pretraga
    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
    }
    if (props.search) {
      params.search_value = props.search
    }

    const response = await axios.get('http://localhost/api/authors', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    })

    // Laravel paginator: response.data.data je paginator objekt, response.data.data.data je niz autora
    autori.value = response.data.data?.data || []
    totalItems.value = response.data.data?.total || 0

    // Ako želiš vidjeti strukturu odgovora:
    // console.log('API response', response.data)
  } catch (err) {
    console.error('Greška pri učitavanju autora:', err)
    error.value = 'Greška pri učitavanju autora: ' + 
      (err.response?.data?.message || err.message || 'Nepoznata greška')
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  fetchAuthors()
}

const handlePageChange = (newValue) => {
  currentPage.value = newValue
  fetchAuthors()
}

onMounted(() => {
  fetchAuthors()
})

// Ako želiš da se pretraga automatski ažurira
watch(() => props.search, () => {
  currentPage.value = 1
  fetchAuthors()
})

const filteredAutori = computed(() => {
  return autori.value.map(a => ({
    ...a,
    name: a.name || `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
    description: a.description || a.biography || '',
    image_url: a.picture ? `/storage/${a.picture}` : null,
  }))
})

const itemClass = 'table-row'

const handleEdit = ({ item, mode }) => {
  if (mode === 'view') {
    router.push(`/author/${item.id}`)
  } else if (mode === 'edit') {
    router.push(`/author/${item.id}/edit`)
  }
}

const handleDelete = async (item) => {
  try {
    if (!confirm(`Da li ste sigurni da želite da obrišete autora "${item.name}"?`)) return

    loading.value = true
    const token = localStorage.getItem('auth_token')

    await axios.delete(`http://localhost/api/authors/${item.id}/destroy`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    await fetchAuthors()
  } catch (err) {
    setError(
      'Greška pri brisanju autora: ' +
        (err.response?.data?.message || err.message || 'Nepoznata greška')
    )
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.table-row { 
  height: 56px; 
}

.cell-naziv {
  min-width: 200px;
  height: 40px;
  display: flex;
  align-items: center;
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

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}
</style>
