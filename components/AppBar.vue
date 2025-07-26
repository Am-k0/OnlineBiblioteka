<template>
  <v-app-bar
    flat
    height="72"
    elevation="2"
    class="pa-0 d-flex flex-row"
    style="width: 100%; position: fixed; top: 0; z-index: 10;"
  >
    <div
      class="d-flex align-center"
      style="
        height: 72px;
        background-color: #2D8CE4;
        padding-left: 16px;
      "
    >
      <v-icon color="white" size="24" class="mr-2">mdi-book-open-page-variant</v-icon>
      <span class="text-white" style="font-weight: 700; font-size: 20px;">
        Online Biblioteka
      </span>
    </div>

    <div
      class="d-flex align-center justify-end"
      style="
        flex: 1;
        height: 72px;
        background-color: #3392EA;
        padding-left: 16px;
        padding-right: 32px;
        gap: 16px;
      "
    >
      <v-btn icon>
        <v-icon color="white" size="24">mdi-bell-outline</v-icon>
      </v-btn>
      <span class="text-white font-weight-bold">|</span>
      <v-btn icon>
        <v-icon color="white" size="24">mdi-plus</v-icon>
      </v-btn>
      <div class="d-flex align-center" style="gap: 8px;">
        <span class="text-white font-weight-bold">bildstudio</span>
        <v-avatar size="40" style="min-width: 40px;">
          <img src="https://randomuser.me/api/portraits/women/2.jpg" alt="avatar" />
        </v-avatar>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
</script>
