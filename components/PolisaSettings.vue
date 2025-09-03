<template>
  <div class="pa-4">
    <div v-for="policy in policies" :key="policy.id" class="mb-4 polisa-row">
      <div class="polisa-description">
        <h3 class="polisa-title">{{ policy.name }}</h3>
        <p class="polisa-text">
          {{ policy.description }}
        </p>
      </div>
      <div class="polisa-input-group">
        <v-text-field
          v-model.number="policy.period"
          hide-details
          variant="outlined"
          density="compact"
          type="number"
          min="1"
          class="polisa-text-field"
          @blur="updatePolicy(policy)"
        ></v-text-field>
        <span class="polisa-label">dana</span>
      </div>
    </div>

    <div v-if="loading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-2">Učitavaju se podešavanja...</p>
    </div>

    <div v-else-if="policies.length === 0 && !loading" class="text-center pa-4">
      <p>Nema dostupnih polisa za podešavanje.</p>
      <v-btn @click="fetchPolicies" color="primary" variant="outlined" class="mt-2">
        Pokušaj ponovo
      </v-btn>
    </div>
    
    <v-snackbar v-model="snackbar.show" :timeout="3000" color="success">
      {{ snackbar.text }}
    </v-snackbar>
    <v-snackbar v-model="errorSnackbar.show" :timeout="5000" color="error">
      {{ errorSnackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PolisaSettings',
  data() {
    return {
      policies: [],
      loading: false,
      snackbar: {
        show: false,
        text: ''
      },
      errorSnackbar: {
        show: false,
        text: ''
      }
    };
  },
  methods: {
    transformPolicies(backendPolicies) {
      // Ispravno mapiranje polisa sa željenim tekstom opisa
      const policyMapping = {
        'rental_period': {
          name: 'Rok vraćanja', // Ispravno ime
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fringilla mauris dolor sed duis quam mi faucibus sit eleifend. Sed lobortis ornare porttitor lectus dictum. Turpis diam non pellentesque nisl rhoncus, vitae amet at placerat.'
        },
        'reservation_period': {
          name: 'Rok za rezervaciju', // Ispravno ime
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fringilla mauris dolor sed duis quam mi faucibus sit eleifend. Sed lobortis ornare porttitor lectus dictum. Turpis diam non pellentesque nisl rhoncus, vitae amet at placerat.'
        }
      };

      const transformedPolicies = [];
      
      backendPolicies.forEach(policy => {
        if (policyMapping[policy.name]) {
          transformedPolicies.push({
            id: policy.id,
            name: policyMapping[policy.name].name,
            description: policyMapping[policy.name].description,
            period: policy.period,
            backendName: policy.name
          });
        }
      });

      return transformedPolicies;
    },

    getToken() {
      const possibleKeys = [
        'auth_token',
        'auth.token',
        'authToken', 
        'token',
        'access_token',
        'bearerToken'
      ];
      
      for (const key of possibleKeys) {
        const token = localStorage.getItem(key);
        if (token) {
          console.log(`Token found with key: ${key}`);
          return token;
        }
      }
      
      for (const key of possibleKeys) {
        const token = sessionStorage.getItem(key);
        if (token) {
          console.log(`Token found in sessionStorage with key: ${key}`);
          return token;
        }
      }
      
      console.log('No token found in localStorage or sessionStorage');
      return null;
    },

    async fetchPolicies() {
      this.loading = true;
      try {
        const token = this.getToken();
        
        if (!token) {
          this.showErrorSnackbar('Niste prijavljeni. Token za autorizaciju nije pronađen. Molimo prijavite se ponovo.');
          console.error('Token not found. Checked keys:', [
            'auth.token', 'authToken', 'token', 'access_token', 'bearerToken'
          ]);
          return;
        }

        console.log('Attempting to fetch policies with token:', token ? token.substring(0, 20) + '...' : 'No token');
        console.log('Making request to:', 'http://localhost/api/policies');

        const response = await axios.get('http://localhost/api/policies', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const backendPolicies = response.data;
        this.policies = this.transformPolicies(backendPolicies);
        console.log('Policies loaded and transformed successfully:', this.policies);
        
      } catch (error) {
        console.error('Greška pri učitavanju polisa:', error);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          if (error.response.status === 401) {
            this.showErrorSnackbar('Vaša sesija je istekla. Molimo vas da se ponovo prijavite.');
            this.clearAuthData();
          } else if (error.response.status === 403) {
            this.showErrorSnackbar('Nemate dozvolu za pristup ovim podešavanjima.');
          } else {
            this.showErrorSnackbar(`Greška servera: ${error.response.status}. ${error.response.data?.message || 'Neočekivana greška.'}`);
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          this.showErrorSnackbar('Nije moguće povezati se sa serverom. Proverite da li je server pokrenut.');
        } else {
          console.error('Request setup error:', error.message);
          this.showErrorSnackbar('Greška u konfiguraciji zahteva.');
        }
      } finally {
        this.loading = false;
      }
    },
    
    async updatePolicy(policy) {
      if (!policy.period || policy.period < 1) {
        this.showErrorSnackbar('Vrednost mora biti pozitivan broj.');
        this.fetchPolicies();
        return;
      }

      if (policy.isDummy) {
        this.showErrorSnackbar('Ova polisa još nije implementirana u sistemu.');
        this.fetchPolicies();
        return;
      }

      try {
        const token = this.getToken();
        
        if (!token) {
          this.showErrorSnackbar('Niste prijavljeni. Token za autorizaciju nije pronađen.');
          return;
        }

        console.log(`Updating policy ${policy.id} (${policy.backendName}) with period ${policy.period}`);

        const response = await axios.put(
          `http://localhost/api/policies/${policy.id}`, 
          { period: policy.period },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Policy updated successfully:', response.data);
        this.showSnackbar(`Polisa "${policy.name}" je uspešno ažurirana.`);
        
      } catch (error) {
        console.error(`Greška pri ažuriranju polise ${policy.id}:`, error);
        
        if (error.response) {
          if (error.response.status === 401) {
            this.showErrorSnackbar('Vaša sesija je istekla. Molimo vas da se ponovo prijavite.');
            this.clearAuthData();
          } else if (error.response.status === 422) {
            const validationErrors = error.response.data?.errors || {};
            const errorMessages = Object.values(validationErrors).flat().join(' ');
            this.showErrorSnackbar(`Greška validacije: ${errorMessages}`);
          } else {
            this.showErrorSnackbar(`Greška pri čuvanju: ${error.response.status}. ${error.response.data?.message || 'Neočekivana greška.'}`);
          }
        } else {
          this.showErrorSnackbar('Nije moguće povezati se sa serverom.');
        }
        
        this.fetchPolicies();
      }
    },

    clearAuthData() {
      const possibleKeys = [
        'auth_token',
        'auth.token',
        'authToken', 
        'token',
        'access_token',
        'bearerToken'
      ];
      
      possibleKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    },

    showSnackbar(message) {
      this.snackbar.text = message;
      this.snackbar.show = true;
    },

    showErrorSnackbar(message) {
      this.errorSnackbar.text = message;
      this.errorSnackbar.show = true;
    }
  },
  
  created() {
    this.fetchPolicies();
  }
}
</script>

<style scoped>
.polisa-row {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.polisa-description {
  width: 320px;
  min-height: 80px;
  margin-right: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.polisa-title {
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  letter-spacing: 0.15px;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.87);
}

.polisa-text {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0.25px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

.polisa-input-group {
  display: flex;
  align-items: center;
  height: 48px;
  width: 250px;
  gap: 16px;
}

.polisa-text-field {
  width: 100px;
}

.polisa-label {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0.15px;
  color: rgba(0, 0, 0, 0.87);
}
</style>