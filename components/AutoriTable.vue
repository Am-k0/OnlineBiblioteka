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
      class="elevation-1"
      show-select
    >
      <template v-slot:item.avatar="{ item }">
        <v-avatar size="36">
          <img :src="item.avatar || defaultAvatar" alt="Avatar" />
        </v-avatar>
      </template>

      <template v-slot:item.actions="{ item }">
        <ActionMenu 
          :author="item"
          :on-view="onView"
          :on-edit="onEdit"
          @deleted="fetchAutori"
          @error="setError"
        />
      </template>

      <template v-slot:bottom>
        <PaginationFooter
          v-model:itemsPerPage="itemsPerPage"
          v-model:currentPage="currentPage"
          :total-items="filteredAutori.length"
        />
      </template>
    </v-data-table>

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
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
})

const supabase = useSupabaseClient()
const autori = ref([])
const loading = ref(false)
const error = ref(null)
const defaultAvatar = 'https://randomuser.me/api/portraits/men/1.jpg'
const itemsPerPage = ref(10)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: '', key: 'avatar', align: 'center', sortable: false },
  { title: 'Naziv Autora', key: 'naziv', align: 'start' },
  { title: 'Opis', key: 'opis' },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

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

const onView = (author) => {
  alert(`Pregledaj autora: ${author.naziv}`)
}

const onEdit = (author) => {
  alert(`Izmijeni autora: ${author.naziv}`)
}

const filteredAutori = computed(() => {
  if (!props.search) return autori.value
  return autori.value.filter(a =>
    a.naziv.toLowerCase().includes(props.search.toLowerCase()) ||
    a.opis.toLowerCase().includes(props.search.toLowerCase())
  )
})

onMounted(fetchAutori)
</script>