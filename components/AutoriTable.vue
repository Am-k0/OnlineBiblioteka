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
      <template v-slot:item.data-table-select="{ item }">
        <div class="h-[56px] flex items-center justify-center">
          <v-checkbox-btn :value="item.id" class="no-checkbox-border"></v-checkbox-btn>
        </div>
      </template>

      <template v-slot:item.name="{ item }">
        <div class="cell-name flex items-center">
          <v-avatar size="36" class="mr-2">
            <img :src="item.image_url" alt="Avatar" class="w-full h-full object-contain rounded-full" />
          </v-avatar>
          <span class="naziv-text">{{ item.name }}</span>
        </div>
      </template>

      <template v-slot:item.description="{ item }">
        <span class="opis-text">{{ item.description }}</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="cell-actions flex justify-end">
          <ActionMenu
            :item="item"
            entity-name="autora"
            title-property="name"
            :show-view="true"
            :show-edit="true"
            :show-delete="true"
            @view="handleView"
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
      class="pagination-footer mt-4 flex justify-between items-center px-4"
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

const defaultAvatar = '/images/default-author-1.jpg'

const itemsPerPage = ref(20)
const currentPage = ref(1)
const totalItems = ref(0)
const apiBaseUrl = 'http://localhost'

const visibleHeaders = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Autora', key: 'name', value: 'name', align: 'start', sortable: true, width: '130px' },
  { title: 'Opis', key: 'description', value: 'description', sortable: true, width: '1510px' },
  { title: '', key: 'actions', align: 'end', sortable: false, width: 'auto' },
])

const props = defineProps({
  search: { type: String, default: '' },
})

const getRandomAuthorImage = () => {
  return defaultAvatar
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
    if (!token) throw new Error('Niste prijavljeni')

    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
    }
    if (props.search) params.search_value = props.search

    const response = await axios.get(`${apiBaseUrl}/api/authors`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params,
    })
    autori.value = response.data.data?.data || []
    totalItems.value = response.data.data?.total || 0
  } catch (err) {
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

onMounted(() => { fetchAuthors() })
watch(() => props.search, () => { currentPage.value = 1; fetchAuthors() })

const filteredAutori = computed(() => {
  return autori.value.map(a => {
    const fullDescription = a.description || a.biography || ''
    const shortDescription = fullDescription.length > 150
      ? fullDescription.substring(0, 150) + '...'
      : fullDescription
    return {
      ...a,
      name: a.name || `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
      description: shortDescription,
      image_url: getRandomAuthorImage(),
    }
  })
})

const itemClass = 'table-row'


const handleEdit = (item) => {
  router.push({
    path: `/author/${item.id}`,
    query: { edit: true }
  })
}


const handleView = (item) => {
  router.push(`/author/${item.id}`)
}

const handleDelete = async (item) => {
  try {
    if (!confirm(`Da li ste sigurni da želite da obrišete autora "${item.name}"?`)) return
    loading.value = true
    const token = localStorage.getItem('auth_token')

    await axios.delete(`${apiBaseUrl}/api/authors/${item.id}/destroy`, {
      headers: { Authorization: `Bearer ${token}` }
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

.no-border-table .v-data-table__wrapper table,
.no-border-table .v-data-table__wrapper table thead,
.no-border-table .v-data-table__wrapper table tbody,
.no-border-table .v-data-table__wrapper table tr,
.no-border-table .v-data-table__wrapper table th,
.no-border-table .v-data-table__wrapper table td {
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

.table-row {
  height: 56px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(1),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(1) {
  width: 56px !important;
  padding-left: 16px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(2),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(2) {
  width: 130px !important;
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(3),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(3) {
  width: 1510px !important;
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-last-child(1),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-last-child(1) {
  padding-right: 16px !important;
}

.naziv-text, .opis-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-name {
  height: 56px;
}
</style>