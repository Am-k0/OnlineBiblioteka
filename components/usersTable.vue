<template>
  <div>
    <v-data-table
      :headers="visibleHeaders"
      :items="items"
      :loading="loading"
      loading-text="Učitavam korisnike..."
      item-value="id"
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
        <span class="opis-text">{{ getRoleName(item.role_id) }}</span>
      </template>

      <template v-slot:item.zadnji_pristup_sistemu="{ item }">
        <span class="opis-text">{{ formatDate(item.updated_at) }}</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="cell-actions">
          <ActionMenu
            :item="item"
            :entity-name="entityDisplayName"
            title-property="first_name" @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
            @error="emit('error', $event)"
          />
        </div>
      </template>
    </v-data-table>

    <PaginationFooter
      v-model:itemsPerPage="itemsPerPage"
      v-model:currentPage="currentPage"
      :total-items="totalItems"
      class="pagination-footer mt-4"
      @update:itemsPerPage="updateItemsPerPage"
      @update:currentPage="updateCurrentPage"
    />

    <v-alert v-if="localError" type="error" class="mt-4">
      {{ localError }}
      <div class="mt-2">
        <v-btn @click="emit('retry-fetch')" color="white" small>Pokušaj ponovo</v-btn>
      </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import ActionMenu from './ActionMenu.vue' // ✅ PROVERI PUTANJU
import PaginationFooter from './PaginationFooter.vue' // ✅ PROVERI PUTANJU

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
}

interface RoleMap {
  [key: number]: string;
}

const props = defineProps({
  items: {
    type: Array as () => UserItem[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  initialItemsPerPage: {
    type: Number,
    default: 20,
  },
  initialCurrentPage: {
    type: Number,
    default: 1,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
    default: null,
  },
  roleMap: {
    type: Object as () => RoleMap,
    required: true,
  },
  entityDisplayName: { // Prop za dinamički naziv entiteta (npr. 'korisnika', 'studenta')
    type: String,
    default: 'korisnika',
  },
})

const emit = defineEmits<{
  (e: 'update:itemsPerPage', value: number): void;
  (e: 'update:currentPage', value: number): void;
  (e: 'view', item: UserItem): void;
  (e: 'edit', item: UserItem): void;
  (e: 'delete', item: UserItem): void;
  (e: 'error', message: string): void;
  (e: 'retry-fetch'): void;
}>()

const router = useRouter()

const itemsPerPage = ref(props.initialItemsPerPage)
const currentPage = ref(props.initialCurrentPage)

const localError = ref(props.error)
watch(() => props.error, (newVal) => {
  localError.value = newVal
})

const defaultAvatar = '/images/default-user-1.jpg' // ✅ PROVERI PUTANJU

const visibleHeaders = ref([
  { title: 'Ime i prezime', key: 'ime_i_prezime', align: 'start' as const, sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Tip', key: 'tip', sortable: false },
  { title: 'Zadnji pristup sistemu', key: 'zadnji_pristup_sistemu', sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
])

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS') + ' ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
}

const getProfilePictureUrl = (picturePath: string | null | undefined) => {
  if (picturePath) {
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    // Pretpostavka da su slike u storage folderu Laravel backend-a
    return `http://localhost:8000/storage/${picturePath}`; // ✅ PRILAGODI URL AKO JE DRUGAČIJI
  }
  return defaultAvatar
}

const getRoleName = (roleId: number) => {
  return props.roleMap[roleId] || 'Nepoznato';
};

const itemClass = () => 'table-row'

const handleView = (item: UserItem) => {
  console.log('[UsersTable] Handle View:', item);
  if (item.username) emit('view', item)
  else localError.value = 'Korisničko ime nije dostupno za prikaz detalja.'
}
const handleEdit = (item: UserItem) => {
  console.log('[UsersTable] Handle Edit:', item);
  if (item.id) emit('edit', item)
  else localError.value = 'ID korisnika nije dostupan za uređivanje.'
}
const handleDelete = (item: UserItem) => {
  console.log('[UsersTable] Handle Delete prompt for:', item);
  // Koristi entityDisplayName za potvrdu brisanja
  const confirmed = confirm(`Da li ste sigurni da želite da obrišete ${props.entityDisplayName} ${item.first_name} ${item.last_name}?`)
  if (confirmed) emit('delete', item)
}

const updateItemsPerPage = (value: number) => {
  console.log('[UsersTable] updateItemsPerPage:', value);
  itemsPerPage.value = value
  emit('update:itemsPerPage', value)
}

const updateCurrentPage = (value: number) => {
  console.log('[UsersTable] updateCurrentPage:', value);
  currentPage.value = value
  emit('update:currentPage', value)
}

watch(() => props.initialItemsPerPage, (newVal) => {
  console.log('[UsersTable] initialItemsPerPage prop changed:', newVal);
  itemsPerPage.value = newVal
})

watch(() => props.initialCurrentPage, (newVal) => {
  console.log('[UsersTable] initialCurrentPage prop changed:', newVal);
  currentPage.value = newVal
})
</script>

<style scoped>
/* Održavaš postojeće stilove */
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