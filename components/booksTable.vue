<template>
  <div>
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
    >
      <!-- Naziv knjige -->
      <template v-slot:item.naziv_knjige="{ item }">
        <div class="cell-naziv d-flex align-center">
          <div class="book-cover-wrapper mr-2">
            <img :src="item.slika_knjige || defaultBookCover" alt="Slika knjige" />
          </div>
          <span class="naziv-text">{{ item.naziv_knjige }}</span>
        </div>
      </template>

      <!-- Autor -->
      <template v-slot:item.autor="{ item }">
        <span class="opis-text">{{ item.autor }}</span>
      </template>

      <!-- Kategorija -->
      <template v-slot:item.kategorija="{ item }">
        <span class="opis-text">{{ item.kategorija }}</span>
      </template>

      <!-- Na raspolaganju -->
      <template v-slot:item.na_raspolaganju="{ item }">
        <span class="opis-text">{{ item.na_raspolaganju }}</span>
      </template>

      <!-- Rezervisano -->
      <template v-slot:item.rezervisano="{ item }">
        <span class="opis-text">{{ item.rezervisano }}</span>
      </template>

      <!-- Izdato -->
      <template v-slot:item.izdato="{ item }">
        <span class="opis-text">{{ item.izdato }}</span>
      </template>

      <!-- U prekoračenju -->
      <template v-slot:item.u_prekoracenju="{ item }">
        <span class="opis-text">{{ item.u_prekoracenju }}</span>
      </template>

      <!-- Ukupna količina -->
      <template v-slot:item.ukupna_kolicina="{ item }">
        <span class="opis-text">{{ item.ukupna_kolicina }}</span>
      </template>

      <!-- Akcije -->
      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu 
            :item="item"
            entity-name="knjigu"
            title-property="naziv_knjige"
            @edit="handleEdit"
            @delete="handleDelete"
            @otpisi="handleOtpisi"
            @izdaj="handleIzdaj"
            @vrati="handleVrati"
            @rezervisi="handleRezervisi"
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

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

const router = useRouter()
const supabase = useSupabaseClient()

const knjige = ref([])
const loading = ref(false)
const error = ref(null)
const defaultBookCover = 'https://via.placeholder.com/150?text=Knjiga'
const itemsPerPage = ref(10)
const currentPage = ref(1)

const visibleHeaders = ref([
  { title: 'Naziv knjige', key: 'naziv_knjige', align: 'start', sortable: true },
  { title: 'Autor', key: 'autor', sortable: true },
  { title: 'Kategorija', key: 'kategorija', sortable: true },
  { title: 'Na raspolaganju', key: 'na_raspolaganju', sortable: true },
  { title: 'Rezervisano', key: 'rezervisano', sortable: true },
  { title: 'Izdato', key: 'izdato', sortable: true },
  { title: 'U prekoračenju', key: 'u_prekoracenju', sortable: true },
  { title: 'Ukupna količina', key: 'ukupna_kolicina', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
})

const fetchKnjige = async () => {
  try {
    loading.value = true
    error.value = null
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('id, naziv_knjige, autor, kategorija, na_raspolaganju, rezervisano, izdato, u_prekoracenju, ukupna_kolicina, slika_knjige')

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

const filteredKnjige = computed(() => {
  if (!props.search) return knjige.value
  return knjige.value.filter(k => 
    k.naziv_knjige.toLowerCase().includes(props.search.toLowerCase()) ||
    k.autor.toLowerCase().includes(props.search.toLowerCase()) ||
    k.kategorija.toLowerCase().includes(props.search.toLowerCase())
  )
})

const itemClass = () => 'table-row'

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

const handleOtpisi = async (item) => {
  try {
    const { error } = await supabase
      .from('knjige')
      .update({ ukupna_kolicina: item.ukupna_kolicina - 1 })
      .eq('id', item.id)

    if (error) throw error

    await fetchKnjige()
  } catch (err) {
    setError(`Došlo je do greške pri otpisivanju: ${err.message}`)
  }
}

const handleIzdaj = async (item) => {
  try {
    const { error } = await supabase
      .from('knjige')
      .update({ izdato: item.izdato + 1, na_raspolaganju: item.na_raspolaganju - 1 })
      .eq('id', item.id)

    if (error) throw error

    await fetchKnjige()
  } catch (err) {
    setError(`Došlo je do greške pri izdavanju: ${err.message}`)
  }
}

const handleVrati = async (item) => {
  try {
    const { error } = await supabase
      .from('knjige')
      .update({ izdato: item.izdato - 1, na_raspolaganju: item.na_raspolaganju + 1 })
      .eq('id', item.id)

    if (error) throw error

    await fetchKnjige()
  } catch (err) {
    setError(`Došlo je do greške pri vraćanju: ${err.message}`)
  }
}

const handleRezervisi = async (item) => {
  try {
    const { error } = await supabase
      .from('knjige')
      .update({ rezervisano: item.rezervisano + 1, na_raspolaganju: item.na_raspolaganju - 1 })
      .eq('id', item.id)

    if (error) throw error

    await fetchKnjige()
  } catch (err) {
    setError(`Došlo je do greške pri rezervaciji: ${err.message}`)
  }
}

onMounted(fetchKnjige)
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
