<script setup lang="ts">
</script>

<template>
  <div>
    <h1><b>Knjige</b></h1> 
   <header>
    <button @click="$router.push('/newBook')">+ NOVA KNJIGA</button>
    <input type="text" placeholder="Search..." />
   </header> 
   
  </div>
</template>