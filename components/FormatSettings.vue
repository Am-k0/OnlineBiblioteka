<template>
  <div class="pa-4">
    <v-btn
      color="primary"
      class="mb-4"
      @click="handleNewFormat"
    >
      <v-icon left>mdi-plus</v-icon>
      Novi Format
    </v-btn>

    <v-data-table
      :headers="headers"
      :items="formati"
      item-value="id"
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
        <span class="naziv-text">{{ item.name }}</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="cell-actions flex justify-end">
          <ActionMenu
            :item="item"
            entity-name="formata"
            :title-property="item.name"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // Uvoz useRouter
import ActionMenu from '../components/ActionMenu.vue';

const router = useRouter(); // Inicijalizacija routera

// Staticki podaci umjesto API poziva
const formati = ref([
    { id: 1, name: 'A4' },
    { id: 2, name: 'A5' },
    { id: 3, name: 'B5' },
]);

const headers = ref([
  { title: '', key: 'data-table-select', sortable: false, width: '56px' },
  { title: 'Naziv Formata', key: 'name', value: 'name', align: 'start', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false, width: 'auto' },
]);

const itemClass = 'table-row';

const handleNewFormat = () => {
  // Preusmjerava na novu formu za format
  router.push('/format');
};

const handleEdit = (item) => { console.log('Uređivanje formata:', item.name); };
const handleDelete = (item) => { console.log('Brisanje formata:', item.name); };
</script>

<style scoped>
.no-border-table .v-data-table__wrapper table, .no-border-table .v-data-table__wrapper table thead, .no-border-table .v-data-table__wrapper table tbody, .no-border-table .v-data-table__wrapper table tr, .no-border-table .v-data-table__wrapper table th, .no-border-table .v-data-table__wrapper table td { border: none !important; border-bottom: none !important; box-shadow: none !important; }
.table-row { height: 56px !important; }
.naziv-text { font-family: Roboto, sans-serif; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0.25px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>