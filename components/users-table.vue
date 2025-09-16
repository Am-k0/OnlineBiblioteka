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
      class="no-border-table"
      :item-class="itemClass"
    >
      <template v-slot:item.ime_i_prezime="{ item }">
        <div class="cell-naziv d-flex align-center cursor-pointer" @click="handleView(item)">
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
            :show-edit="showEdit"
            :show-delete="showDelete"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
            @error="showErrorSnackbar"
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

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import ActionMenu from './action-menu.vue'
import PaginationFooter from './pagination-footer.vue'

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
  showEdit: {
    type: Boolean,
    default: true,
  },
  showDelete: {
    type: Boolean,
    default: true,
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

const snackbar = ref({
  show: false,
  text: '',
  color: 'error',
  timeout: 5000,
});

watch(() => props.error, (newVal) => {
  if (newVal) {
    showErrorSnackbar(newVal);
  }
})

const defaultAvatar = '/images/default-user-1.jpg'

const visibleHeaders = ref([
  { title: 'Ime i prezime', key: 'ime_i_prezime', align: 'start' as const, sortable: true, width: '200px' },
  { title: 'Email', key: 'email', sortable: true, width: '250px' },
  { title: 'Tip', key: 'tip', sortable: false, width: '100px' },
  { title: 'Zadnji pristup sistemu', key: 'zadnji_pristup_sistemu', sortable: true, width: '230px' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: 'auto' },
])

const getRoleName = (roleId: number) => {
  return props.roleMap[roleId] || 'Nepoznato'
}

const itemClass = () => 'table-row'

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

const showErrorSnackbar = (message: string) => {
  snackbar.value.text = message;
  snackbar.value.color = 'error';
  snackbar.value.timeout = 5000;
  snackbar.value.show = true;
};

const handleView = (item: UserItem) => {
  if (item.username) {
    router.push(`/users/${item.username}`)
      .catch((error) => {
        console.error('Navigation to view failed:', error)
        showErrorSnackbar('Greška pri navigaciji na stranicu za prikaz.');
      })
  } else {
    showErrorSnackbar('Korisničko ime nije dostupno za prikaz detalja.');
  }
}

const handleEdit = (item: UserItem) => {
  if (item.username) {
    const targetPath = `/users/${item.username}/edit`
    router.push(targetPath)
      .catch((error) => {
        console.error('Navigation to edit failed:', error)
        showErrorSnackbar('Greška pri navigaciji na stranicu za uređivanje.');
      })
  } else {
    showErrorSnackbar('Korisničko ime nije dostupno za uređivanje.');
  }
}

const handleDelete = (item: UserItem) => {
  emit('delete', item);
};

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
  width: 200px !important;
  padding-left: 16px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(2),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(2) {
  width: 250px !important;
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(3),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(3) {
  width: 100px !important;
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-child(4),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-child(4) {
  width: 230px !important;
  padding-left: 0px !important;
  padding-right: 0px !important;
  white-space: nowrap;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:nth-last-child(1),
.v-data-table > .v-data-table__wrapper > table > thead > tr > th:nth-last-child(1) {
  padding-right: 16px !important;
}

.naziv-text,
.opis-text {
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-naziv {
  width: 100%;
  overflow: hidden;
  height: 56px;
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

.delete-dialog-card {
  border-radius: 8px !important;
}

.dialog-title {
  font-size: 18px !important;
  font-weight: 500 !important;
  color: #333 !important;
  padding-bottom: 0 !important;
}

.dialog-text {
  color: #666 !important;
  font-size: 14px !important;
}

.dialog-actions {
  padding: 8px 16px 16px 16px !important;
}

.dialog-btn {
  font-weight: 500 !important;
}

.cursor-pointer {
  cursor: pointer;
}

.cell-naziv:hover .naziv-text {
  color: #3489f8;
}
</style>