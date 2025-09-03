<template>
  <div class="records-view-container">
    <div class="records-sidebar">
      <v-list class="loans-navigation-list" nav>
        <v-list-item
          v-for="(item, i) in navigationItems.slice(0, 3)"
          :key="i"
          :value="item.value"
          @click="activeTab = item.value"
          :class="{ 'active-item': activeTab === item.value }"
          class="loans-navigation-item"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon" size="24" class="loans-icon"></v-icon>
          </template>
          <v-list-item-title class="loans-navigation-title">{{ item.title }}</v-list-item-title>
        </v-list-item>
        
        <v-divider class="my-divider" />
        
        <v-list-item
          v-for="(item, i) in navigationItems.slice(3)"
          :key="i + 3"
          :value="item.value"
          @click="activeTab = item.value"
          :class="{ 'active-item': activeTab === item.value }"
          class="loans-navigation-item"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon" size="24" class="loans-icon"></v-icon>
          </template>
          <v-list-item-title class="loans-navigation-title">{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
    
    <div class="records-content-wrapper">
      <component :is="currentTableComponent" class="record-table-component" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import IssuedBooksTable from './loan-management/IssuedBooksTable.vue';
import ReturnedBooksTable from './loan-management/ReturnedBooksTable.vue';
import OverdueBooksTable from './loan-management/OverdueBooksTable.vue';
import ActiveReservationsTable from './loan-management/ActiveReservationsTable.vue';
import ArchivedReservationsTable from './loan-management/ArchivedReservationsTable.vue';

const activeTab = ref('issued');

const navigationItems = [
  {
    title: 'Izdate knjige',
    icon: 'mdi-file-document-outline',
    value: 'issued',
  },
  {
    title: 'Vraćene knjige',
    icon: 'mdi-file-document-outline',
    value: 'returned',
  },
  {
    title: 'Knjige u prekoračenju',
    icon: 'mdi-alert-outline',
    value: 'overdue',
  },
  {
    title: 'Aktivne rezervacije',
    icon: 'mdi-calendar-check-outline',
    value: 'active_reservations',
  },
  {
    title: 'Arhivirane rezervacije',
    icon: 'mdi-calendar-blank-outline',
    value: 'archived_reservations',
  },
];

const currentTableComponent = computed(() => {
  switch (activeTab.value) {
    case 'issued': return IssuedBooksTable;
    case 'returned': return ReturnedBooksTable;
    case 'overdue': return OverdueBooksTable;
    case 'active_reservations': return ActiveReservationsTable;
    case 'archived_reservations': return ArchivedReservationsTable;
    default: return IssuedBooksTable;
  }
});
</script>

<style scoped>
/* KONTEJNERI */
.records-view-container {
  display: flex;
  width: 100%;
}

.records-sidebar {
  flex-shrink: 0;
  width: 247px;
  padding: 0;
  margin-right: 24px;
}

.records-content-wrapper {
  flex-grow: 1;
  min-width: 0;
}

/* MENI STILIZACIJA */
.loans-navigation-list {
  background-color: white !important;
  padding: 32px 0 0 0px; /* OVDJE JE DODAT GORNJI PADDING */
}

.loans-navigation-item {
  height: 48px;
  padding: 0 16px;
  border-radius: 4px;
  color: #000000;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: 0.5px;
  line-height: 100%;
  cursor: pointer;
}

.loans-navigation-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loans-icon {
  width: 24px;
  height: 24px;
}

.loans-navigation-item:hover {
  background-color: #f5f5f5;
}

.active-item {
  background-color: #e0f0ff;
}

.active-item .v-list-item-title,
.active-item .v-icon {
  color: #3392ea;
  font-weight: 500;
}

.my-divider {
  margin: 0;
}

.record-table-component {
  width: 100%;
}
</style>