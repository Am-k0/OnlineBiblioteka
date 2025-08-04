<template>
  <div class="pa-4">
    <v-btn
      color="primary"
      class="mb-4"
      @click="handleNewIzdavac"
    >
      <v-icon left>mdi-plus</v-icon>
      Novi Izdavač
    </v-btn>

    <v-data-table
      :headers="headers"
      :items="izdavaci"
      :loading="loading"
      loading-text="Učitavam izdavače..."
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
          <span class="naziv-text">{{ item.name }}</span>
        </div>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="cell-actions flex justify-end">
          <ActionMenu
            :item="item"
            entity-name="izdavača"
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
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import ActionMenu from '../components/ActionMenu.vue';
import PaginationFooter from '../components/PaginationFooter.vue';

const router = useRouter();
const izdavaci = ref([]);
const loading = ref(false);
const error = ref(null);
const apiBaseUrl = 'http://localhost';

const itemsPerPage = ref(20);
const currentPage = ref(1);
const totalItems = ref(0);

const headers = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Izdavača', key: 'name', value: 'name', align: 'start', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false, width: 'auto' },
]);

const itemClass = 'table-row';

const setError = (err) => {
  error.value = err;
  setTimeout(() => error.value = null, 5000);
};

const fetchIzdavaci = async () => {
  loading.value = true;
  error.value = null;
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');
    
    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
    };
    
    const response = await axios.get(`${apiBaseUrl}/api/publishers`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      params,
    });
    
    const apiData = response.data.publishers;
    izdavaci.value = apiData.data;
    totalItems.value = apiData.total;
  } catch (err) {
    setError('Greška pri učitavanju izdavača: ' + (err.response?.data?.message || err.message || 'Nepoznata greška'));
    if (err.response?.status === 401) { router.push('/login'); }
  } finally {
    loading.value = false;
  }
};

const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue;
  fetchIzdavaci();
};

const handlePageChange = (newValue) => {
  currentPage.value = newValue;
  fetchIzdavaci();
};

const handleNewIzdavac = () => {
  // Preusmjerava na stranicu za kreiranje novog izdavača
  router.push('/publisher');
};

const handleEdit = (item) => { console.log('Uređivanje izdavača:', item); };
const handleDelete = async (item) => {
  try {
    if (!confirm(`Da li ste sigurni da želite da obrišete izdavača "${item.name}"?`)) return;
    loading.value = true;
    const token = localStorage.getItem('auth_token');
    await axios.delete(`${apiBaseUrl}/api/publishers/${item.id}/destroy`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchIzdavaci();
  } catch (err) {
    setError('Greška pri brisanju izdavača: ' + (err.response?.data?.message || err.message || 'Nepoznata greška'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => { fetchIzdavaci(); });
watch(itemsPerPage, () => { fetchIzdavaci(); });
watch(currentPage, () => { fetchIzdavaci(); });
</script>

<style scoped>
.no-border-table .v-data-table__wrapper table, .no-border-table .v-data-table__wrapper table thead, .no-border-table .v-data-table__wrapper table tbody, .no-border-table .v-data-table__wrapper table tr, .no-border-table .v-data-table__wrapper table th, .no-border-table .v-data-table__wrapper table td { border: none !important; border-bottom: none !important; box-shadow: none !important; }
.table-row { height: 56px !important; }
.naziv-text { font-family: Roboto, sans-serif; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0.25px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-name { height: 56px; }
</style>