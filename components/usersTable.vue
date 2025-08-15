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
            <img :src="getProfilePictureUrl(item.profile_picture)" alt="Avatar" class="avatar-img" />
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
            title-property="first_name" 
            :show-view="true"
            :show-edit="true"
            :show-delete="true"
            @view="handleView"
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
import ActionMenu from './ActionMenu.vue'
import PaginationFooter from './PaginationFooter.vue'

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
  entityDisplayName: {
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

const defaultAvatar = '/images/default-user-1.jpg'

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
    if (picturePath.startsWith('http')) {
      return picturePath
    }
    return `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/storage/${picturePath}`
  }
  return defaultAvatar
}

const getRoleName = (roleId: number) => {
  return props.roleMap[roleId] || 'Nepoznato'
}

const itemClass = () => 'table-row'

const handleView = (item: UserItem) => {
  console.log('Viewing user:', item.username)
  if (item.username) {
    router.push(`/users/${item.username}`)
      .then(() => {
        console.log('Successfully navigated to view page')
      })
      .catch((error) => {
        console.error('Navigation to view failed:', error)
        localError.value = 'Greška pri navigaciji na stranicu za prikaz.'
      })
  } else {
    localError.value = 'Korisničko ime nije dostupno za prikaz detalja.'
  }
}

const handleEdit = (item: UserItem) => {
  console.log('Editing user:', item.username)
  if (item.username) {
    const targetPath = `/users/${item.username}/edit`
    console.log('Navigating to edit page:', targetPath)
    
    router.push(targetPath)
      .then(() => {
        console.log('Successfully navigated to edit page')
      })
      .catch((error) => {
        console.error('Navigation to edit failed:', error)
        localError.value = 'Greška pri navigaciji na stranicu za uređivanje.'
      })
  } else {
    localError.value = 'Korisničko ime nije dostupno za uređivanje.'
  }
}

const handleDelete = (item: UserItem) => {
  const confirmed = confirm(`Da li ste sigurni da želite da obrišete ${props.entityDisplayName} ${item.first_name} ${item.last_name}?`)
  if (confirmed) emit('delete', item)
}

const updateItemsPerPage = (value: number) => {
  itemsPerPage.value = value
  emit('update:itemsPerPage', value)
}

const updateCurrentPage = (value: number) => {
  currentPage.value = value
  emit('update:currentPage', value)
}

watch(() => props.initialItemsPerPage, (newVal) => {
  itemsPerPage.value = newVal
})

watch(() => props.initialCurrentPage, (newVal) => {
  currentPage.value = newVal
})
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
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-data-table :deep(.v-data-table__td),
.v-data-table :deep(.v-data-table__th) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>