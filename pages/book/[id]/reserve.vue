<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ book?.naziv_knjige || 'Učitavam...' }}</h1>
        <p class="page-subtitle" v-if="book">
          <span class="link" @click="router.push('/books')">Evidencija knjiga</span> /
          <span class="link" @click="router.push(`/book/${bookId}`)">KNJIGA-{{ bookId }}</span> /
          Rezerviši knjigu
        </p>
        <p v-else class="page-subtitle">Učitavam...</p>
      </div>

      <BookMenu :book="book" :isActive="true" v-if="book" />
    </header>

    <div class="header-divider"></div>

    <div class="page-content d-flex">
      <div class="reserve-form-wrapper">
        <h2 class="form-title">Rezerviši knjigu</h2>

        <v-form @submit.prevent="submitReservation" ref="form">
          <div class="field-wrapper" v-if="isLibrarian">
            <v-select
              v-model="selectedStudentId"
              :items="students"
              item-title="name"
              item-value="id"
              label="Izaberite učenika..."
              variant="outlined"
              hide-details="auto"
              class="form-field-full"
              :rules="[v => !!v || 'Učenik je obavezan']"
            ></v-select>
          </div>
          
          <div class="form-actions mt-12">
            <ActionButtons @save="submitReservation" @cancel="cancel" :loading="loading" :saveText="'Rezerviši knjigu'" />
          </div>
        </v-form>
      </div>

      <BookQuantities v-if="book" :quantities="book" />
    </div>

    <v-alert v-if="error" type="error" class="ma-4">{{ error }}</v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/axios';
import ActionButtons from '@/components/ActionButtons.vue';
import BookQuantities from '@/components/BookQuantities.vue';
import BookMenu from '@/components/BookMenu.vue';

const route = useRoute();
const router = useRouter();
const form = ref(null);

const book = ref(null);
const students = ref([]);
const selectedStudentId = ref(null);
const loading = ref(false);
const error = ref(null);
const isLibrarian = ref(false);

const bookId = ref(route.params.id);

const getLoggedInUser = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user || null;
    } catch (e) {
        console.error('Greška pri parsiranju user objekta iz localStorage-a:', e);
        return null;
    }
};

onMounted(() => {
  const user = getLoggedInUser();
  if (user && user.role === 'librarian') {
      isLibrarian.value = true;
      fetchStudents(); // Pozivamo listu učenika samo ako je bibliotekar
  } else if (user && user.role === 'student') {
    // Ako je ulogovan učenik, njegov ID se automatski postavlja za rezervaciju
    selectedStudentId.value = user.id;
  }

  if (!bookId.value) {
    error.value = 'ID knjige nije pronađen. Proverite URL rutu.';
    return;
  }
  fetchBookDetails();
});

async function fetchBookDetails() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get(`/books/${bookId.value}`);
    const rawData = res.data?.book;
    
    if (!rawData) {
        throw new Error('Detalji o knjizi nisu pronađeni. Proverite da li je knjiga obrisana.');
    }

    book.value = {
      id: rawData.id,
      naziv_knjige: rawData.name,
      na_raspolaganju: rawData.number_of_copies_available || 0,
      rezervisano: rawData.reserved_count || 0,
      izdato: rawData.issued_count || 0,
      u_prekoracenju: rawData.overdue_count || 0,
      ukupna_kolicina: rawData.total_count || 0,
    };
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    error.value = 'Greška pri učitavanju detalja o knjizi. Proverite da li postoji knjiga sa ovim ID-em.';
    book.value = { naziv_knjige: 'Knjiga nije pronađena' };
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  try {
    // === KLJUČNA IZMENA OVDE ===
    // Promenjen parametar sa `role: 'student'` na `role_id: 1`
    const res = await api.get('/users', { params: { role_id: 1, per_page: 100 } });
    
    if (res.data?.data?.data) {
        students.value = res.data.data.data.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        }));
    } else {
        throw new Error('Nisu pronađeni podaci o učenicima u odgovoru sa servera.');
    }
  } catch (err) {
    console.error('Greška pri učitavanju učenika:', err);
    error.value = 'Greška pri učitavanju učenika.';
  }
}

async function submitReservation() {
  // Ako je bibliotekar, forma mora biti validna (mora izabrati učenika)
  if (isLibrarian.value) {
      const { valid } = await form.value.validate();
      if (!valid) {
        return;
      }
  }
  
  loading.value = true;
  error.value = null;

  try {
    const payload = {
      book_id: bookId.value,
    };

    // Ako je bibliotekar, šaljemo ID izabranog učenika
    // Ako je ulogovan učenik, njegov ID je već postavljen u `selectedStudentId` i biće poslat
    // Backend će verovatno sam prepoznati ID ulogovanog korisnika ako `student_id` nije eksplicitno poslat
    if (isLibrarian.value) {
      payload.student_id = selectedStudentId.value;
    }

    const res = await api.post('/reservations', payload);
    
    // Koristite alert ili neki lepši notification/toast komponentu
    alert(res.data.message || 'Knjiga je uspešno rezervisana!'); 
    router.push(`/book/${bookId.value}`);
  } catch (err) {
    console.error('Greška pri rezervaciji knjige:', err);
    if (err.response && err.response.data && err.response.data.error) {
        error.value = err.response.data.error;
    } else {
        error.value = 'Došlo je do greške prilikom rezervacije knjige.';
    }
  } finally {
    loading.value = false;
  }
}

function cancel() {
  router.back();
}
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
  padding: 6px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
  margin-top: 2px;
}

.page-subtitle .link {
  color: #1976d2;
  cursor: pointer;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 10px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.reserve-form-wrapper {
  width: 724px;
  padding-left: 24px;
  padding-right: 24px;
}

.form-title {
  font-size: 20px;
  font-weight: 500;
  color: #222;
  margin-bottom: 24px;
}

.field-wrapper {
  position: relative;
  margin-bottom: 24px;
}

.form-field-full {
  width: 100%;
}

.form-help-text {
  font-size: 12px;
  color: #777;
  position: absolute;
  bottom: -15px;
  left: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px !important;
}
</style>