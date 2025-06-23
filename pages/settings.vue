<template>
    <div>
    <h1><b>Podesavanja</b></h1> 
    </div>

  <v-card>
    <v-tabs v-model="tab">
      <v-tab value="one">Polisa</v-tab>
      <v-tab value="two">Kategorija</v-tab>
      <v-tab value="three">Zanrovi</v-tab>
      <v-tab value="four">Izvodjaci</v-tab>
      <v-tab value="five">Povez</v-tab>
      <v-tab value="six">Format</v-tab>
      <v-tab value="seven">Pismo</v-tab>
    </v-tabs>

    <v-card-text>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="one"> Polisa </v-tabs-window-item>

        <v-tabs-window-item value="two"> Kategorija </v-tabs-window-item>

        <v-tabs-window-item value="three"> Zanrovi </v-tabs-window-item>
        <v-tabs-window-item value="four"> Izvodjaci </v-tabs-window-item>
        <v-tabs-window-item value="five"> Povez </v-tabs-window-item>
        <v-tabs-window-item value="six"> Format </v-tabs-window-item>
        <v-tabs-window-item value="seven"> Pismo </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<script>
  export default {
    data: () => ({
      tab: null,
    }),
  }
</script>