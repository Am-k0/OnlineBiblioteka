<template>
  <div class="form-container">
    <div class="header">
      <h1> <b> Novi Bibliotekar</b></h1>
      <div class="breadcrumbs">
        <a href="/theLibrarian">Svi Bibliotekari</a>
        <span>/ Novi Bibliotekar</span>
      </div>
    </div>

    <PersonForm />
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
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
}
.breadcrumbs a {
  color: #3392EA;
  text-decoration: none;
}
.breadcrumbs a:hover {
  text-decoration: underline;
}
</style>