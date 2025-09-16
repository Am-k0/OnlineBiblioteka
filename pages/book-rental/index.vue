<template>
  <div class="page-container">
    <header class="app-header">
      <h1 class="page-title">Izdavanje knjige</h1>
    </header>
    
    <div class="header-divider"></div>
    
    <div class="page-content">
      <LoansNavigation />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})
import LoansNavigation from '~/components/loans-navigation.vue';
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 24px 24px 0 24px;
}

.page-title {
  font-family: Roboto, sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 100%;
  letter-spacing: 0.15px;
  vertical-align: middle;
  color: #000000;
  margin: 0;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 20px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}
</style>