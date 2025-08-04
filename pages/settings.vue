<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <h1 class="page-title">Settings</h1>
    </header>

    <div class="header-divider"></div>

    <div class="page-content p-4">
      <v-card flat class="bg-white">
        <v-tabs v-model="tab" class="custom-tabs" grow>
          <v-tab value="polisa" class="custom-tab">Polisa</v-tab>
          <v-tab value="kategorija" class="custom-tab">Kategorija</v-tab>
          <v-tab value="zanrovi" class="custom-tab">Žanrovi</v-tab>
          <v-tab value="izdavaci" class="custom-tab">Izdavači</v-tab>
          <v-tab value="povez" class="custom-tab">Povez</v-tab>
          <v-tab value="format" class="custom-tab">Format</v-tab>
          <v-tab value="pismo" class="custom-tab">Pismo</v-tab>
        </v-tabs>

        <v-card-text class="p-4">
          <v-window v-model="tab">
            <v-window-item value="polisa">
              <Suspense>
                <PolisaSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>

            <v-window-item value="kategorija">
              <Suspense>
                <KategorijaSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>

            <v-window-item value="zanrovi">
              <Suspense>
                <ZanroviSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>

            <v-window-item value="izdavaci">
              <Suspense>
                <IzdavaciSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>

            <v-window-item value="povez">
              <Suspense>
                <PovezSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>

            <v-window-item value="format">
              <Suspense>
                <FormatSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>

            <v-window-item value="pismo">
              <Suspense>
                <PismoSettings />
                <template #fallback>
                  <div class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </template>
              </Suspense>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const tab = ref('polisa');

// Postavlja početnu vrijednost taba na osnovu rute, ako postoji
if (route.query.tab) {
  tab.value = route.query.tab;
}


watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      tab.value = newTab;
    }
  },
  { immediate: true } // Pokreni watcher odmah po kreiranju
);

// Lazy load komponenti za bolje performanse
const PolisaSettings = defineAsyncComponent(() =>
  import('../components/PolisaSettings.vue')
);
const KategorijaSettings = defineAsyncComponent(() =>
  import('../components/KategorijaSettings.vue')
);
const ZanroviSettings = defineAsyncComponent(() =>
  import('../components/ZanroviSettings.vue')
);
const IzdavaciSettings = defineAsyncComponent(() =>
  import('../components/IzdavaciSettings.vue')
);
const PovezSettings = defineAsyncComponent(() =>
  import('../components/PovezSettings.vue')
);
const FormatSettings = defineAsyncComponent(() =>
  import('../components/FormatSettings.vue')
);
const PismoSettings = defineAsyncComponent(() =>
  import('../components/PismoSettings.vue')
);
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
  margin-bottom: 24px;
    margin-bottom: 0;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.custom-tabs {
  display: flex;
  
}
.custom-tab {
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s ease;
  color: #4b5563;
  height: 48px;
  text-transform: lowercase;
  flex: 1 0 auto;
  min-width: 0;
}

.custom-tab:hover {
  color: #1f2937;
}

.custom-tab::first-letter {
  text-transform: uppercase;
}

/* Stil za aktivni tab */
.v-tab--selected.custom-tab {
  color: rgb(59 130 246) !important;
  border-bottom: 2px solid rgb(59 130 246) !important;
  font-weight: 600 !important;
}

.v-tab {
  text-transform: none !important;
}

@media (max-width: 768px) {
  .custom-tabs {
    flex-wrap: wrap;
  }
  
  .custom-tab {
    flex: 1 0 33%;
    font-size: 0.75rem;
    padding: 0.5rem 0.25rem;
  }
}
</style>