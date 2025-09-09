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
import ActionMenu from '../components/ActionMenu.vue';
import PaginationFooter from '../components/PaginationFooter.vue';

const router = useRouter();
const izdavaci = ref([]);
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
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Izdavača', key: 'name', value: 'name', align: 'start', sortable: true },
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

const fetchIzdavaci = async () => {
  loading.value = true;
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
    izdavaci.value = apiData.data.map(publisher => ({
      id: publisher.publisher_id,
      name: publisher.publisher_name,
    }));
    
    totalItems.value = apiData.total;
  } catch (err) {
    showErrorSnackbar('Greška pri učitavanju izdavača: ' + (err.response?.data?.message || err.message || 'Nepoznata greška'));
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
  router.push('/publisher/publisher');
};

const handleEdit = (item) => {
  router.push(`/publisher/${item.id}/edit`);
};

const handleDelete = async (item) => {
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');

    await axios.delete(`${apiBaseUrl}/api/publishers/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const index = izdavaci.value.findIndex(i => i.id === item.id);
    if (index !== -1) {
      izdavaci.value.splice(index, 1);
      totalItems.value = Math.max(0, totalItems.value - 1);
    }
    
    showSuccessSnackbar(`Izdavač "${item.name}" je uspješno obrisan!`);
    
  } catch (err) {
    showErrorSnackbar('Greška pri brisanju izdavača: ' + (err.response?.data?.message || err.message || 'Nepoznata greška'));
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