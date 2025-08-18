<template>
  <div>
    <h3 class="table-title">Spisak aktivnih rezervacija</h3>
    <v-data-table
      :headers="headers"
      :items="activeReservations"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:no-data>
        <v-alert :value="true" type="info">Nema aktivnih rezervacija za ovu knjigu.</v-alert>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/axios';

const route = useRoute();
const activeReservations = ref([]);
const loading = ref(true);

const headers = [
  { title: 'Student', key: 'student_name' },
  { title: 'Datum rezervacije', key: 'reservation_date' },
];

const fetchActiveReservations = async () => {
  loading.value = true;
  try {
    const bookId = route.params.id;
    // PRIMER: Zameni sa svojim stvarnim API endpointom
    const response = await axios.get(`http://localhost/api/books/${bookId}/active-reservations`);
    activeReservations.value = response.data.data || [];
  } catch (error) {
    console.error('Greška pri dohvatanju aktivnih rezervacija:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchActiveReservations);
</script>

<style scoped>
.table-title {
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
}
</style>