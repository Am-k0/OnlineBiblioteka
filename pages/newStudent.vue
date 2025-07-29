<template>
  <div class="form-container">
    <div class="header">
      <h1><b>Novi Ucenik</b></h1>
      <div class="breadcrumbs">
        <a href="/students">Svi Ucenici</a>
        <span>/ Novi Ucenik</span>
      </div>
    </div>

    <newUsers :kolekcija="'ucenici'" />
  </div>
</template>

<script setup>

import newUsers from '@/components/newUsers.vue';


</script>

<style scoped>
.form-container {
  padding: 24px; /* Dodajte malo paddinga da se forma ne lepi za ivice */
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Dodajte malo senke ako želite */
}

.header {
  margin-bottom: 24px;
}
.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333; /* Tamnija boja za naslov */
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
  font-size: 14px;
}
.breadcrumbs a {
  color: #1976d2; /* Boja linka */
  text-decoration: none;
}
.breadcrumbs a:hover {
  text-decoration: underline;
}
</style>