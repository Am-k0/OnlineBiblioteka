<template>
  <div class="pa-4">
    <v-data-table
      :headers="headers"
      :items="povezi"
      item-value="id"
      hide-default-footer
      hover
      class="no-border-table"
      :item-class="itemClass"
    >
      <template v-slot:item.name="{ item }">
        <span class="naziv-text">{{ item.name }}</span>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Staticki podaci
const povezi = ref([
    { id: 1, name: 'Tvrdi povez' },
    { id: 2, name: 'Meki povez' },
    { id: 3, name: 'Spiralni povez' },
]);

const headers = ref([
  { title: 'Naziv Poveza', key: 'name', value: 'name', align: 'start', sortable: true },
]);

const itemClass = 'table-row';

</script>

<style scoped>
.no-border-table .v-data-table__wrapper table, .no-border-table .v-data-table__wrapper table thead, .no-border-table .v-data-table__wrapper table tbody, .no-border-table .v-data-table__wrapper table tr, .no-border-table .v-data-table__wrapper table th, .no-border-table .v-data-table__wrapper table td { border: none !important; border-bottom: none !important; box-shadow: none !important; }
.table-row { height: 56px !important; }
.naziv-text { font-family: Roboto, sans-serif; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0.25px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>