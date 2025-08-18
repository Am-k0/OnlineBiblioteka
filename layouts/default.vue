<template>
  <div class="app-layout">
    <header class="app-header">
      <h1>Sistem za upravljanje bibliotekom</h1>
    </header>

    <main class="content-container">
      <LoansNavigation />
      
      <div class="page-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import LoansNavigation from '../components/LoansNavigation.vue'; 
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  background-color: #f0f0f0;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #ccc;
}

.content-container {
  display: flex;
  flex: 1;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>