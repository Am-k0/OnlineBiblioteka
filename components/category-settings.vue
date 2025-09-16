<template>
  <div class="pa-4">
    <v-btn color="primary" class="mb-4" @click="handleNewCategory">
      <v-icon left>mdi-plus</v-icon>
      Nova Kategorija
    </v-btn>

    <v-data-table
      :headers="headers"
      :items="kategorije"
      :loading="loading"
      loading-text="Učitavam kategorije..."
      item-value="id"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      hide-default-footer
      hover
      class="no-border-table"
      :item-class="itemClass"
    >
      <template v-slot:item.name="{ item }">
        <span class="naziv-text">{{ item.name }}</span>
      </template>

      <template v-slot:item.description="{ item }">
        <span class="opis-text">{{ item.description }}</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="cell-actions flex justify-end">
          <ActionMenu
            :item="item"
            entity-name="kategoriju"
            title-property="name"
            :show-edit="true"
            :show-delete="true"
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
      class="pagination-footer mt-4 flex justify-between items-center px-4"
      @update:itemsPerPage="handleItemsPerPageChange"
      @update:currentPage="handlePageChange"
    />

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
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

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import ActionMenu from './action-menu.vue';
import PaginationFooter from './pagination-footer.vue';

const router = useRouter();
const kategorije = ref([]);
const loading = ref(false);
const apiBaseUrl = 'http://localhost';

const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

const headers = ref([
  {
    title: 'Naziv Kategorije',
    key: 'name',
    value: 'name',
    align: 'start',
    sortable: true,
    width: '30%',
  },
  {
    title: 'Opis',
    key: 'description',
    value: 'description',
    sortable: true,
    width: '70%',
  },
  { title: '', key: 'actions', align: 'end', sortable: false, width: 'auto' },
]);

const itemClass = 'table-row';

const showErrorSnackbar = (message) => {
  snackbar.value.text = message;
  snackbar.value.color = 'error';
  snackbar.value.show = true;
};

const showSuccessSnackbar = (message) => {
  snackbar.value.text = message;
  snackbar.value.color = 'success';
  snackbar.value.show = true;
};

const fetchKategorije = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');

    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
    };

    const response = await axios.get(`${apiBaseUrl}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params,
    });

    const apiData = response.data.categories;
    kategorije.value = apiData.data;
    totalItems.value = apiData.total;
  } catch (err) {
    showErrorSnackbar('Greška pri učitavanju kategorija: ' + (err.response?.data?.message || err.message || 'Nepoznata greška'));
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  fetchKategorije();
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  fetchKategorije();
};

const handleNewCategory = () => {
  router.push('/category/new-category'); 
};

const handleEdit = (item) => {
  router.push(`/category/${item.id}/edit`);
};

const handleDelete = async (item) => {
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    await axios.delete(`${apiBaseUrl}/api/categories/${item.id}/destroy`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const index = kategorije.value.findIndex(k => k.id === item.id);
    if (index !== -1) {
      kategorije.value.splice(index, 1);
      totalItems.value = Math.max(0, totalItems.value - 1);
    }
    
    showSuccessSnackbar(`Kategorija "${item.name}" je uspješno obrisana!`);
  } catch (err) {
    showErrorSnackbar('Greška pri brisanju kategorije: ' + (err.response?.data?.message || err.message || 'Nepoznata greška'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchKategorije();
});

watch(itemsPerPage, () => {
  fetchKategorije();
});
watch(currentPage, () => {
  fetchKategorije();
});
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
</style>