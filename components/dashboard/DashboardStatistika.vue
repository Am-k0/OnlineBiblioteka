<template>
  <v-card class="stats-card" elevation="0">
    <v-card-title class="stats-title">STATISTIKA</v-card-title>
    <v-card-text class="stats-content">
      <div v-if="loading">
        <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
      </div>

      <v-alert v-else-if="error" type="error" dense>
        {{ error }}
      </v-alert>

      <div v-else class="stats-container">
        <div v-for="(stat, index) in stats" :key="index" class="stat-item">
          <router-link :to="stat.link" class="stat-link">
            {{ stat.label }}
          </router-link>

          <div class="progress-section">
            <v-progress-linear
              v-model="stat.value"
              :color="stat.color"
              height="25"
              class="progress-bar"
            >
            </v-progress-linear>
            <span class="stat-value" :style="{ left: stat.value + '%' }">
              <strong>{{ stat.value }}</strong>
            </span>
          </div>
        </div>

        <v-divider class="between-divider"></v-divider>

        <div class="scale-container">
          <div class="scale-numbers">
            <span class="scale-number">0</span>
            <span class="scale-number">20</span>
            <span class="scale-number">40</span>
            <span class="scale-number">60</span>
            <span class="scale-number">80</span>
            <span class="scale-number">100</span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { VProgressLinear } from 'vuetify/components';

const stats = ref([]);
const loading = ref(false);
const error = ref(null);
const router = useRouter();

const apiBaseUrl = 'http://localhost';
const activeRentalsUrl = `${apiBaseUrl}/api/rentals/active`;
const overdueRentalsUrl = `${apiBaseUrl}/api/rentals/overdue`;
const activeReservationsUrl = `${apiBaseUrl}/api/reservations/active`;


const fetchActiveRentalsCount = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(activeRentalsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.total;
  } catch (err) {
    console.error('Greška pri dohvatanju aktivnih iznajmljivanja:', err);
    return 0;
  }
};

const fetchOverdueRentalsCount = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(overdueRentalsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.total;
  } catch (err) {
    console.error('Greška pri dohvatanju knjiga u prekoračenju:', err);
    return 0;
  }
};

const fetchReservationsCount = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(activeReservationsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.reservations.total;
  } catch (err) {
    console.error('Greška pri dohvatanju broja rezervacija:', err);
    return 0;
  }
};

const maxStatValue = computed(() => {
  
    const allValues = stats.value.map(s => s.value);
    const max = Math.max(...allValues);
    return max > 0 ? max : 100;
});

const fetchStats = async () => {
  loading.value = true;
  error.value = null;

  try {
    const [activeRentals, overdueRentals, reservations] = await Promise.all([
      fetchActiveRentalsCount(),
      fetchOverdueRentalsCount(),
      fetchReservationsCount(),
    ]);

   
    const maxVal = Math.max(activeRentals, overdueRentals, reservations);
    
    stats.value = [
      { 
        label: 'Izdate knjige', 
        value: activeRentals, 
        percentage: maxVal > 0 ? (activeRentals / maxVal) * 100 : 0, 
        color: '#4CAF50', 
        link: '/loan-management' 
      },
      { 
        label: 'Rezervisane knjige', 
        value: reservations, 
        percentage: maxVal > 0 ? (reservations / maxVal) * 100 : 0, 
        color: '#FF9800', 
        link: '/loan-management' 
      },
      { 
        label: 'Knjige u prekoračenju', 
        value: overdueRentals, 
        percentage: maxVal > 0 ? (overdueRentals / maxVal) * 100 : 0, 
        color: '#F44336', 
        link: '/loan-management' 
      }
    ];

  } catch (err) {
    error.value = 'Greška pri učitavanju statistike: ' + (err.response?.data?.message || err.message);
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.stats-card {
  width: 100%;
  max-width: 875px;
  min-height: 258px;
  background-color: #ffffff !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.stats-title {
  color: #000000;
  font-family: 'Roboto', sans-serif;
  font-size: 19px;
  font-weight: 500;
  padding: 24px 24px 16px 24px;
}

.stats-content {
  padding: 0 24px 24px 24px !important;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-link {
  color: #3392EA;
  font-size: 14px;
  width: 160px;
  flex-shrink: 0;
  text-align: right;
  text-decoration: none; 
  transition: color 0.2s;
}

.stat-link:hover {
  color: #1a6ab3;
}

.progress-section {
  display: flex;
  align-items: center;
  flex-grow: 1;
  position: relative; 
}

.progress-bar {
  flex-grow: 1;
}

.stat-value {
  position: absolute;
  top: 50%;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transform: translateY(-50%);
  margin-left: 8px;
}


.scale-container {
  padding-left: 176px;
  margin-top: 0;
  position: relative;
}

.scale-numbers {
  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
  top: -15px; 
}

.scale-number {
  font-size: 12px;
  color: #000;
  text-align: center;
  position: relative;
  transform: translateX(-50%);
}

.scale-number:last-child {
  transform: translateX(50%);
}

.between-divider {
  width: 723.017px;
  height: 1px;
  background-color: #000000;
  opacity: 0.2;
  margin: 0 auto;
}
</style>