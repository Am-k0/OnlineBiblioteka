<template>
  <div>
    <v-data-table
      :headers="visibleHeaders"
      :items="items"      :loading="loading"
      loading-text="Učitavam korisnike..." item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      show-select
      class="no-border-table"
      :item-class="itemClass"
    >
      <template v-slot:item.ime_i_prezime="{ item }">
        <div class="cell-naziv d-flex align-center">
          <v-avatar size="36" class="mr-2">
            <img :src="getProfilePictureUrl(item.profile_picture)" alt="Avatar" />
          </v-avatar>
          <span class="naziv-text">{{ item.first_name }} {{ item.last_name }}</span>
        </div>
      </template>

      <template v-slot:item.email="{ item }">
        <span class="opis-text">{{ item.email }}</span>
      </template>

      <template v-slot:item.tip="{ item }">
        <span class="opis-text">Student</span>
      </template>

      <template v-slot:item.zadnji_pristup_sistemu="{ item }">
        <span class="opis-text">{{ formatDate(item.updated_at) }}</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu
            :item="item"
            entity-name="korisnika" title-property="first_name"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
            @error="emit('error', $event)" />
        </div>
      </template>
    </v-data-table>

    <PaginationFooter
      v-model:itemsPerPage="itemsPerPage"
      v-model:currentPage="currentPage"
      :total-items="totalItems"
      class="pagination-footer mt-4"
      @update:itemsPerPage="updateItemsPerPage" @update:currentPage="updateCurrentPage"   />

    <v-alert v-if="localError" type="error" class="mt-4"> {{ localError }}
      <div class="mt-2">
        <v-btn @click="emit('retry-fetch')" color="white" small>Pokušaj ponovo</v-btn> </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

// Definišemo interfejs za props
interface UserItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role_id: number;
  profile_picture?: string | null;
  created_at: string;
  updated_at: string;
  // Dodajte ostale propertije ako su potrebni
}

const props = defineProps({
  items: { // Promenjeno: sada prihvatate listu korisnika kao prop
    type: Array as () => UserItem[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  initialItemsPerPage: { // Dodat prop za inicijalni broj stavki po stranici
    type: Number,
    default: 20,
  },
  initialCurrentPage: { // Dodat prop za inicijalnu trenutnu stranicu
    type: Number,
    default: 1,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  error: { // Primanje errora kao prop, ali koristimo i localError
    type: String,
    default: null,
  },
  // search prop više nije potreban ovde, jer roditeljska komponenta obrađuje pretragu i prosljeđuje filtrirane 'items'
})

// Definišemo događaje koje će ova komponenta emitovati
const emit = defineEmits<{
  (e: 'update:itemsPerPage', value: number): void;
  (e: 'update:currentPage', value: number): void;
  (e: 'view', item: UserItem): void;
  (e: 'edit', item: UserItem): void;
  (e: 'delete', item: UserItem): void;
  (e: 'error', message: string): void;
  (e: 'retry-fetch'): void; // Događaj za ponovno dohvatanje podataka
}>()

const router = useRouter()

// Lokalno stanje za paginaciju, inicijalizovano iz prop-ova
const itemsPerPage = ref(props.initialItemsPerPage)
const currentPage = ref(props.initialCurrentPage)

// Lokalna greška ako je potrebno nešto interno prikazati, ali preferira se prop
const localError = ref(props.error)
watch(() => props.error, (newVal) => {
  localError.value = newVal
})


const defaultAvatar = '/images/default-user-1.jpg' // Putanja do defaultnog avatara

const visibleHeaders = ref([
  { title: 'Ime i prezime', key: 'ime_i_prezime', align: 'start' as const, sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Tip', key: 'tip', sortable: true }, // Fiksno "Student" ako je ovo samo za studente
  { title: 'Zadnji pristup sistemu', key: 'zadnji_pristup_sistemu', sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
])

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS') + ' ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
}

const getProfilePictureUrl = (picturePath: string | null | undefined) => {
  // Ovde je važno da li backend vraća punu URL ili samo putanju storage/profile_pictures/...
  // Ako vraća samo putanju (npr. 'profile_pictures/neka_slika.jpg'), onda morate dodati domen i storage prefix.
  // U ovom primeru pretpostavljam da Laravel vraća 'profile_pictures/neka_slika.jpg' i da je storage dostupan na http://localhost/storage/
  if (picturePath) return `http://localhost/storage/${picturePath}`
  return defaultAvatar
}

const itemClass = () => 'table-row'

// Emituje događaje umesto da direktno vrši navigaciju ili API pozive
const handleView = (item: UserItem) => {
  if (item.id) emit('view', item)
  else localError.value = 'ID korisnika nije dostupan za prikaz detalja.'
}
const handleEdit = (item: UserItem) => {
  if (item.id) emit('edit', item)
  else localError.value = 'ID korisnika nije dostupan za uređivanje.'
}
const handleDelete = (item: UserItem) => {
  // Ovo samo potvrđuje i emituje, stvarna logika brisanja je u roditelju
  const confirmed = confirm(`Da li ste sigurni da želite da obrišete korisnika ${item.first_name} ${item.last_name}?`)
  if (confirmed) emit('delete', item)
}

// Funkcije za paginaciju koje emituju događaje
const updateItemsPerPage = (value: number) => {
  itemsPerPage.value = value
  emit('update:itemsPerPage', value)
}

const updateCurrentPage = (value: number) => {
  currentPage.value = value
  emit('update:currentPage', value)
}

// Watcheri za prop-ove
watch(() => props.initialItemsPerPage, (newVal) => {
  itemsPerPage.value = newVal
})

watch(() => props.initialCurrentPage, (newVal) => {
  currentPage.value = newVal
})

// 'search' prop više ne mora da se watchuje ovde, jer roditelj treba da prosleđuje filtrirane 'items'
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