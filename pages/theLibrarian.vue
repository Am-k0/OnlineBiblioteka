<script setup lang="ts">
</script>

<template>
  <div>
    <h1><b>BIBLIOTEKARI</b></h1> 
   <header>
    <button @click="$router.push('/newLibrarian')">+ NOVI BIBLIOTEKAR</button>
    <input type="text" placeholder="Pretrazi autora..." />
   </header> 
   
  </div>
</template>