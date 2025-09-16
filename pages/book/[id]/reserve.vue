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
            <v-autocomplete
              v-model="selectedStudentId"
              :items="students"
              item-title="name"
              item-value="id"
              label="Izaberite učenika..."
              variant="outlined"
              hide-details="auto"
              class="form-field-full"
              :rules="[v => !!v || 'Učenik je obavezan']"
              no-data-text="Nema pronađenih učenika."
              clearable
            ></v-autocomplete>
          </div>
          
          <div class="form-actions mt-12">
           <ActionButtons 
             @save="submitReservation" 
             @cancel="cancel" 
             :loading="loading"
             saveLabel="REZERVIŠI KNJIGU"
             cancelLabel="PONIŠTI"
             saveIcon="mdi-bookmark-outline"
             saveWidth="180px"
           />
          </div>
        </v-form>
      </div>

      <BookQuantities ref="bookQuantitiesRef" v-if="book" :bookId="bookId" />
    </div>

    <v-snackbar
      v-model="successSnackbar.show"
      color="#3392EA"
      :timeout="3000"
      top
    >
      {{ successSnackbar.text }}
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="successSnackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
    
    <v-snackbar
      v-model="errorSnackbar.show"
      color="error"
      :timeout="5000"
      top
    >
      {{ errorSnackbar.text }}
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="errorSnackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/axios';
import ActionButtons from '~/components/action-buttons.vue';
import BookQuantities from '~/components/book-quantities.vue';
import BookMenu from '~/components/book-menu.vue';

const route = useRoute();
const router = useRouter();
const form = ref(null);
const bookQuantitiesRef = ref(null);

const book = ref(null);
const students = ref([]);
const selectedStudentId = ref(null);
const loading = ref(false);
const isLibrarian = ref(false);

const bookId = ref(route.params.id);

// Snackbar state za uspjeh
const successSnackbar = ref({
  show: false,
  text: '',
});

// Snackbar state za greške
const errorSnackbar = ref({
  show: false,
  text: '',
});

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
      fetchStudents();
  } else if (user && user.role === 'student') {
    selectedStudentId.value = user.id;
  }

  if (!bookId.value) {
    showErrorSnackbar('ID knjige nije pronađen. Provjerite URL rutu.');
    return;
  }
  fetchBookDetails();
});

async function fetchBookDetails() {
  loading.value = true;
  try {
    const res = await api.get(`/books/${bookId.value}`);
    const rawData = res.data?.book;
    
    if (!rawData) {
        throw new Error('Detalji o knjizi nijesu pronađeni. Provjerite je li knjiga obrisana.');
    }

    book.value = {
      id: rawData.id,
      naziv_knjige: rawData.name,
    };
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    showErrorSnackbar('Greška pri učitavanju detalja o knjizi. Provjerite postoji li knjiga sa ovim ID-om.');
    book.value = { naziv_knjige: 'Knjiga nije pronađena' };
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  try {
    const res = await api.get('/users', { params: { role_id: 1, per_page: 100 } });
    
    if (res.data?.data?.data) {
        students.value = res.data.data.data.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        }));
    } else {
        throw new Error('Nijesu pronađeni podaci o učenicima u odgovoru sa servera.');
    }
  } catch (err) {
    console.error('Greška pri učitavanju učenika:', err);
    showErrorSnackbar('Greška pri učitavanju učenika.');
  }
}

async function submitReservation() {
  if (isLibrarian.value) {
      const { valid } = await form.value.validate();
      if (!valid) {
        showErrorSnackbar('Učenik je obavezan!');
        return;
      }
  }
  
  loading.value = true;
  successSnackbar.value.show = false;
  errorSnackbar.value.show = false;

  try {
    const payload = {
      book_id: bookId.value,
    };

    if (isLibrarian.value) {
      payload.student_id = selectedStudentId.value;
    }

    const res = await api.post('/reservations', payload);
    
    showSuccessSnackbar(`Knjiga je uspješno rezervisana!`); 
    
    selectedStudentId.value = null;
    if (form.value) {
      form.value.reset();
    }
    
    setTimeout(() => {
      if (bookQuantitiesRef.value && bookQuantitiesRef.value.refreshQuantities) {
        bookQuantitiesRef.value.refreshQuantities();
      }
    }, 500);

  } catch (err) {
    console.error('Greška pri rezervaciji knjige:', err);
    let errorMessage = 'Došlo je do greške prilikom rezervacije knjige.';
    if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
    } else if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
    }
    showErrorSnackbar(errorMessage);
  } finally {
    loading.value = false;
  }
}

const showSuccessSnackbar = (message) => {
  successSnackbar.value.text = message;
  successSnackbar.value.show = true;
};

const showErrorSnackbar = (message) => {
  errorSnackbar.value.text = message;
  errorSnackbar.value.show = true;
};

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