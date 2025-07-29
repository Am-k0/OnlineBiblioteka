<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">Podešavanja</h1>
    
    <v-card>
      <v-tabs v-model="tab" class="custom-tabs">
        <v-tab value="one" class="custom-tab" style="width: 77px">Polisa</v-tab>
        <v-tab value="two" class="custom-tab" style="width: 107px">Kategorija</v-tab>
        <v-tab value="three" class="custom-tab" style="width: 86px">Zanrovi</v-tab>
        <v-tab value="four" class="custom-tab" style="width: 92px">Izvodjaci</v-tab>
        <v-tab value="five" class="custom-tab" style="width: 75px">Povez</v-tab>
        <v-tab value="six" class="custom-tab" style="width: 84px">Format</v-tab>
        <v-tab value="seven" class="custom-tab" style="width: 77px">Pismo</v-tab>
      </v-tabs>

      <v-card-text class="p-4">
        <v-window v-model="tab">
          <v-window-item value="one" class="text-gray-700">Polisa</v-window-item>
          <v-window-item value="two" class="text-gray-700">Kategorija</v-window-item>
          <v-window-item value="three" class="text-gray-700">Zanrovi</v-window-item>
          <v-window-item value="four" class="text-gray-700">Izvodjaci</v-window-item>
          <v-window-item value="five" class="text-gray-700">Povez</v-window-item>
          <v-window-item value="six" class="text-gray-700">Format</v-window-item>
          <v-window-item value="seven" class="text-gray-700">Pismo</v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tab: 'one'
    }
  }
}
</script>

<style>

.custom-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.custom-tab {
  padding-top: 0.75rem;    /* py-3 */
  padding-bottom: 0.75rem;
  padding-left: 1rem;      /* px-4 */
  padding-right: 1rem;
  font-weight: 500;        /* font-medium */
  font-size: 0.875rem;     /* text-sm */
  outline: none;           /* focus:outline-none */
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: 200ms; /* transition-colors duration-200 */
  color: #4b5563;          /* text-gray-600 */
  height: 48px;
  text-transform: lowercase;
}

.custom-tab:hover {
  color: #1f2937; /* text-gray-800 */
}

.custom-tab::first-letter {
  text-transform: uppercase;
}

/* Stil za aktivni tab - override Vuetify stilova */
.v-tab--selected.custom-tab {
  color: rgb(59 130 246) !important; /* Tailwind blue-500 */
  border-bottom: 2px solid rgb(59 130 246) !important;
  font-weight: 600 !important; /* font-semibold */
}


.v-tab {
  text-transform: none !important;
}
</style>