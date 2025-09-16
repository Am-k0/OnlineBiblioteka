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
      <!-- Debug info - ukloniti u produkciji -->
      <div v-if="$route.query.debug" class="debug-info mb-3 pa-2" style="background: #f5f5f5; border: 1px solid #ccc;">
        <small>Debug: activeTab = {{ activeTab }}, currentComponent = {{ currentTableComponent?.name || 'null' }}</small>
      </div>
      
      <component 
        :is="currentTableComponent" 
        v-if="currentTableComponent"
        class="record-table-component" 
        :key="activeTab"
      />
      
      <!-- Fallback content ako komponenta nije definisana -->
      <div v-else class="no-component-message pa-4">
        <v-alert type="info" variant="tonal">
          <v-icon icon="mdi-information" class="mr-2"></v-icon>
          Komponenta za "{{ getActiveTabTitle() }}" je u pripremi.
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';


import IssuedBooksTable from './student-record-management/IssuedBooksTable.vue';
import ReturnedBooksTable from './student-record-management/ReturnedBooksTable.vue';
import OverdueBooksTable from './student-record-management/OverdueBooksTable.vue';
import ActiveReservationsTable from './student-record-management/ActiveReservationsTable.vue';
import ArchivedReservationsTable from './student-record-management/ArchivedReservationsTable.vue';

const route = useRoute();
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
  const components = {
    'issued': IssuedBooksTable,
    'returned': ReturnedBooksTable,
    'overdue': OverdueBooksTable,
    'active_reservations': ActiveReservationsTable,
    'archived_reservations': ArchivedReservationsTable,
  };
  
  return components[activeTab.value] || null;
});

const getActiveTabTitle = () => {
  const activeItem = navigationItems.find(item => item.value === activeTab.value);
  return activeItem ? activeItem.title : 'Nepoznato';
};

// Debug funkcija - dodati u console za testiranje
if (process.client && route.query.debug) {
  console.log('StudentRecordManagement loaded with activeTab:', activeTab.value);
  console.log('Available components:', Object.keys({
    IssuedBooksTable,
    ReturnedBooksTable,
    OverdueBooksTable,
    ActiveReservationsTable,
    ArchivedReservationsTable,
  }));
}
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
  padding: 0;
  padding-left: 24px;
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
  transition: background-color 0.2s ease;
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

.no-component-message {
  text-align: center;
}

.debug-info {
  font-family: 'Courier New', monospace;
  border-radius: 4px;
}
</style>