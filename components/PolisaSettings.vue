<template>
  <div class="pa-4">
    <div v-for="policy in policies" :key="policy.id" class="mb-4 polisa-row">
      <div class="polisa-description">
        <h3 class="polisa-title">{{ policy.name }}</h3>
        <p class="polisa-text">
          Podesite period važenja za datu polisu. Vrednost se izražava u danima.
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
    async fetchPolicies() {
      try {
        // ISPRAVLJENO: Koristimo 'auth.token' umesto 'authToken'
        const token = localStorage.getItem('auth.token');
        if (!token) {
          this.showErrorSnackbar('Niste prijavljeni. Token za autorizaciju nije pronađen.');
          return;
        }

        const response = await axios.get('http://localhost/api/policies', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.policies = response.data;
      } catch (error) {
        console.error('Greška pri učitavanju polisa:', error);
        if (error.response && error.response.status === 401) {
          this.showErrorSnackbar('Vaša sesija je istekla. Molimo vas da se ponovo prijavite.');
          // Opcionalno: preusmeriti na login stranu
          // this.$router.push('/login'); 
        } else {
          this.showErrorSnackbar('Nije moguće učitati podešavanja.');
        }
      }
    },
    
    async updatePolicy(policy) {
      if (!policy.period || policy.period < 1) {
        this.showErrorSnackbar('Vrednost mora biti pozitivan broj.');
        this.fetchPolicies();
        return;
      }

      try {
        // ISPRAVLJENO: Koristimo 'auth.token' umesto 'authToken'
        const token = localStorage.getItem('auth.token');
        if (!token) {
          this.showErrorSnackbar('Niste prijavljeni. Token za autorizaciju nije pronađen.');
          return;
        }

        await axios.put(`http://localhost/api/policies/${policy.id}`, 
          { period: policy.period },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        this.showSnackbar(`Polisa "${policy.name}" je uspešno ažurirana.`);
      } catch (error) {
        console.error(`Greška pri ažuriranju polise ${policy.id}:`, error);
        if (error.response && error.response.status === 401) {
          this.showErrorSnackbar('Vaša sesija je istekla. Molimo vas da se ponovo prijavite.');
        } else {
          this.showErrorSnackbar('Došlo je do greške prilikom čuvanja.');
        }
        this.fetchPolicies();
      }
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
/* Stilovi ostaju nepromenjeni */
.polisa-row {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-radius: 4px;
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
}
.polisa-text {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0.25px;
  color: rgba(0, 0, 0, 0.6);
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