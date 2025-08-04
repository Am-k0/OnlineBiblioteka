<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Novi Bibliotekar</h1>
        <p class="page-subtitle">
          <span class="link" @click="goToLibrarians">Svi Bibliotekari</span> / Novi Bibliotekar
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <newUsers :kolekcija="'bibliotekari'" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import newUsers from '@/components/newUsers.vue';

const router = useRouter();

const goToLibrarians = () => {
  router.push('/theLibrarian');
};
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}

.app-header {
  padding: 6px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
  margin-top: 2px;
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 15px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}
</style>