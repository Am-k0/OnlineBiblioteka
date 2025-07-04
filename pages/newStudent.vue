<template>
  <div class="form-container">
    <div class="header">
      <h1>Novi Učenik</h1>
      <div class="breadcrumbs">
        <a href="/students">Svi Učenici</a>
        <span>/ Novi Učenik</span>
      </div>
    </div>

    <PersonForm :kolekcija="'ucenici'" />
  </div>
</template>

<script>
import PersonForm from '@/components/PersonForm.vue'

export default {
  components: {
    PersonForm
  }
}
</script>

<style scoped>
.header {
  margin-bottom: 24px;
}
.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
  font-size: 14px;
}
.breadcrumbs a {
  color: #1976d2;
  text-decoration: none;
}
.breadcrumbs a:hover {
  text-decoration: underline;
}
</style>