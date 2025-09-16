<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ book?.naziv_knjige || 'Učitavam...' }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/books')">Evidencija knjiga</span> /
          <span class="link" @click="router.push(`/book/${bookId}`)">KNJIGA-{{ bookId }}</span> /
          Izdaj knjigu
        </p>
      </div>
      
      <BookMenu :book="book" :is-active="true" v-if="book" />
    </header>

    <div class="header-divider"></div>

    <div class="page-content d-flex">
      <div class="issue-form-wrapper">
        <h2 class="form-title">Izdaj knjigu</h2>

        <v-form @submit.prevent="submitIssue" ref="issueForm">
          <div class="field-wrapper">
            <v-autocomplete
              v-model="selectedStudent"
              :items="students"
              item-title="name"
              item-value="id"
              label="Izaberite učenika..."
              variant="outlined"
              hide-details="auto"
              class="form-field-full"
              :rules="[v => !!v || 'Obavezno polje']"
              no-data-text="Nema pronađenih učenika."
              clearable
            ></v-autocomplete>
          </div>
          
          <div class="form-help-text mt-2">
            Rok za vraćanje je 30 dana.
          </div>

          <div class="form-actions mt-12">
           <ActionButtons 
            @save="submitIssue" 
            @cancel="cancel" 
            :loading="loading"
            saveLabel="IZDAJ KNJIGU"
            cancelLabel="PONIŠTI"
            saveIcon="mdi-book-arrow-right" />
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
  middleware: ['auth-librarian']
})
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import ActionButtons from '~/components/action-buttons.vue';
import BookQuantities from '~/components/book-quantities.vue';
import BookMenu from '~/components/book-menu.vue';

const route = useRoute();
const router = useRouter();

const book = ref(null);
const students = ref([]);
const selectedStudent = ref(null);
const loading = ref(false);
const issueForm = ref(null);
const bookQuantitiesRef = ref(null); 
const bookId = route.params.id;

// Snackbar za uspješne poruke
const successSnackbar = ref({
  show: false,
  text: '',
});

// Snackbar za greške
const errorSnackbar = ref({
  show: false,
  text: '',
});

const getLibrarianId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.id && typeof user.id === 'number') {
          return user.id;
        } else {
          console.error('Greška: ID bibliotekara nije validan ili ne postoji u localStorage-u.');
          showErrorSnackbar('ID bibliotekara nije pronađen. Molimo prijavite se ponovo.');
          return null;
        }
    } catch (e) {
        console.error('Greška pri parsiranju user objekta iz localStorage-a:', e);
        showErrorSnackbar('Greška pri učitavanju korisničkih podataka. Molimo se prijavite ponovo.');
        return null;
    }
};

const showSuccessSnackbar = (text) => {
  successSnackbar.value.text = text;
  successSnackbar.value.show = true;
};

const showErrorSnackbar = (text) => {
  errorSnackbar.value.text = text;
  errorSnackbar.value.show = true;
};

onMounted(() => {
  fetchBookDetails();
  fetchStudents();
});

async function fetchBookDetails() {
  loading.value = true;
  try {
    const res = await axios.get(`/books/${bookId}`);
    
    const rawData = res.data.book;
    
    
    const bookData = {
      id: rawData.id,
      naziv_knjige: rawData.name,
    
    };
    
    book.value = bookData;
    
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    showErrorSnackbar('Greška pri učitavanju detalja o knjizi. Provjerite da li postoji knjiga sa ovim ID-om.');
    book.value = { naziv_knjige: 'Knjiga nije pronađena' };
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  try {
    const res = await axios.get('/users', { params: { role_id: 1, per_page: 100 } });
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

async function submitIssue() {
  const { valid } = await issueForm.value.validate();
  
  if (!valid) {
    showErrorSnackbar('Molimo popunite sva obavezna polja.');
    return;
  }
  
  const librarianId = getLibrarianId();
  if (!librarianId) {
      return;
  }

  loading.value = true;
  successSnackbar.value.show = false;
  errorSnackbar.value.show = false;

  try {
    const response = await axios.post('/rentals', {
      book_id: bookId,
      student_id: selectedStudent.value,
      librarian_id: librarianId,
    });

    if (response.data.message) {
      showSuccessSnackbar('Knjiga je uspješno izdata!');
    } else {
      throw new Error('Došlo je do greške prilikom izdavanja knjige.');
    }
    
    selectedStudent.value = null;
    issueForm.value.resetValidation();
    
    setTimeout(() => {
      if (bookQuantitiesRef.value && bookQuantitiesRef.value.refreshQuantities) {
        bookQuantitiesRef.value.refreshQuantities();
      }
    }, 500); 

  } catch (err) {
    console.error('Greška pri izdavanju knjige:', err);
    const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Došlo je do greške prilikom izdavanja knjige.';
    showErrorSnackbar(errorMessage);
  } finally {
    loading.value = false;
  }
}

function cancel() {
  router.back();
}
</script>

<style scoped>
body {
    overflow: hidden;
}

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

.header-actions {
  display: flex;
  align-items: center;
  width: 653px;
  height: 36px;
  gap: 16px;
}

.action-btn {
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 1.25px;
  text-transform: none;
  height: auto !important;
  padding: 8px 12px !important;
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
  margin-top: 15px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.issue-form-wrapper {
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
  margin-bottom: 18px;
}

.form-field-full {
  width: 100%;
}

.form-field-half {
  flex: 1 1 50%;
}

.form-help-text {
  font-size: 12px;
  color: #777;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px !important;
}

.readonly-field {
  background-color: transparent;
  color: #777;
}

.readonly-field :deep(input) {
  cursor: default;
}

.readonly-field :deep(.v-field__overlay) {
    background-color: transparent;
}

.readonly-field :deep(.v-label--active) {
    transform: translateY(-50%) scale(0.75);
}
</style>