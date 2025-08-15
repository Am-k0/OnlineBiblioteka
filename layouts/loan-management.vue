<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <h1 class="page-title">{{ activeTitle }}</h1>
    </header>

    <div class="header-divider"></div>

    <div class="page-content-wrapper">
      <LoanNavigation /> 
      
      <div class="page-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LoanNavigation from '~/components/LoanNavigation.vue';

const navigationItems = [
  { title: 'Izdate knjige', route: '/loan-management/issued' },
  { title: 'Vracene knjige', route: '/loan-management/returned' },
  { title: 'Knjige u prekoračenju', route: '/loan-management/overdue' },
  { title: 'Aktivne rezervacije', route: '/loan-management/active-reservations' },
  { title: 'Arhivirane rezervacije', route: '/loan-management/archived-reservations' },
];

const route = useRoute();

const activeTitle = computed(() => {
  const currentItem = navigationItems.find(item => item.route === route.path);
  return currentItem ? currentItem.title : 'Upravljanje pozajmicama';
});
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; 
}

.app-header {
  padding: 24px 24px 0 24px;
}

.page-title {
  font-family: 'Roboto', sans-serif !important;
  font-size: 20px;
  font-weight: 500;
  color: #222;
  line-height: 100%;
  letter-spacing: 0.15px;
  vertical-align: middle;
  margin: 0;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 20px;
  margin-bottom: 24px;
}

.page-content-wrapper {
  display: flex;
  flex: 1;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}
</style>