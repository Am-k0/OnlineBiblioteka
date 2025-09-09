<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <h1 class="page-title">Dashboard</h1>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="7">
            <DashboardAktivnosti 
              :activities="activities"
              :loading="loading"
              :error="error"
              mode="home"
              :max-items="10"
            />
          </v-col>

          <v-col cols="12" md="5">
            <v-row>
              <v-col cols="12">
                <DashboardRezervacije />
              </v-col>
              <v-col cols="12">
                <DashboardStatistika />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import useActivities from '~/composables/useActivities';
import DashboardAktivnosti from '~/components/dashboard/DashboardAktivnosti.vue';
import DashboardRezervacije from '~/components/dashboard/DashboardRezervacije.vue';
import DashboardStatistika from '~/components/dashboard/DashboardStatistika.vue';

definePageMeta({
  middleware: ['auth']
})

const { activities, loading, error, fetchActivities } = useActivities();

onMounted(() => {
  fetchActivities();
});
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; 
}

.app-header {
  padding: 24px 24px 0 24px;
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

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 20px;
  margin-bottom: 0px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}
</style>