<template>
  <div class="text-center">
    <v-select
      v-model="location"
      :items="locations"
      label="Location"
    ></v-select>
    <v-menu :location="location">
      <template v-slot:activator="{ props }">
        <v-btn
          color="primary"
          v-bind="props"
        >
            Menu
        </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          :value="index"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>
<script setup>
  import { ref } from 'vue'

  const location = ref('end')

  const items = [
    { title: 'Pogledaj detalje' },
    { title: 'Izmijeni autora' },
    { title: 'Izbrisi autora' },
    
  ]
  const locations = [
    'top',
    'bottom',
    'start',
    'end',
    'center',
  ]
</script>