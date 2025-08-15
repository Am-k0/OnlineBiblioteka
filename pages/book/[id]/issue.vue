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
      
      <div class="header-actions" v-if="book">
        <v-btn variant="text" @click="handleOtpisi(book)" class="action-btn">
          <template v-slot:prepend>
            <v-icon icon="mdi-cancel" size="18"></v-icon>
          </template>
          Otpiši knjigu
        </v-btn>
        
        <v-btn variant="text" @click="handleIzdaj(book)" class="action-btn">
          <template v-slot:prepend>
            <v-icon icon="mdi-book-arrow-right" size="18"></v-icon>
          </template>
          Izdaj knjigu
        </v-btn>

        <v-btn variant="text" @click="handleVrati(book)" class="action-btn">
          <template v-slot:prepend>
            <v-icon icon="mdi-book-arrow-left" size="18"></v-icon>
          </template>
          Vrati knjigu
        </v-btn>

        <v-btn variant="text" @click="handleRezervisi(book)" class="action-btn">
          <template v-slot:prepend>
            <v-icon icon="mdi-bookmark-outline" size="18"></v-icon>
          </template>
          Rezerviši knjigu
        </v-btn>

        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="handleEdit(book)" prepend-icon="mdi-pencil-outline">
              <v-list-item-title>Izmjeni Podatke</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleDelete(book)" prepend-icon="mdi-delete-outline">
              <v-list-item-title>Izbriši Knjigu</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content d-flex">
      <div class="issue-form-wrapper">
        <h2 class="form-title">Izdaj knjigu</h2>

        <v-form @submit.prevent="submitIssue" ref="issueForm">
          <div class="field-wrapper">
            <v-select
              v-model="selectedStudent"
              :items="students"
              item-title="name"
              item-value="id"
              label="Izaberite učenika..."
              variant="outlined"
              hide-details="auto"
              class="form-field-full"
              :rules="[v => !!v || 'Obavezno polje']"
            ></v-select>
          </div>
          
          <div class="form-help-text mt-2">
            Rok za vraćanje je 30 dana.
          </div>

          <div class="form-actions mt-12">
            <ActionButtons @save="submitIssue" @cancel="cancel" :loading="loading" />
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
import axios from '@/axios';
import ActionButtons from '@/components/ActionButtons.vue';
import BookQuantities from '@/components/BookQuantities.vue';

const route = useRoute();
const router = useRouter();

const book = ref(null);
const students = ref([]);
const selectedStudent = ref(null);
const loading = ref(false);
const error = ref(null);

const bookId = route.params.id;

const issueForm = ref(null);

const getLibrarianId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.id && typeof user.id === 'number') {
          return user.id;
        } else {
          console.error('Greška: ID bibliotekara nije validan ili ne postoji u localStorage-u.');
          setError('ID bibliotekara nije pronađen. Molimo prijavite se ponovo.');
          return null;
        }
    } catch (e) {
        console.error('Greška pri parsiranju user objekta iz localStorage-a:', e);
        setError('Greška pri učitavanju korisničkih podataka. Molimo se prijavite ponovo.');
        return null;
    }
};

const setError = (err) => {
  error.value = err;
};

const handleEdit = (item) => {
  router.push(`/book/${item.id}?edit=true`);
};

const handleDelete = (item) => {
  // Implementiraj logiku za brisanje knjige
};

const handleOtpisi = (item) => {
  // Implementiraj logiku za otpisivanje knjige
};

const handleIzdaj = (item) => {
  window.location.reload();
};

const handleVrati = (item) => {
  router.push(`/book/${item.id}/return`);
};

const handleRezervisi = (item) => {
  router.push(`/book/${item.id}/reserve`);
};

onMounted(() => {
  fetchBookDetails();
  fetchStudents();
});

async function fetchBookDetails() {
  loading.value = true;
  error.value = null;
  try {
    const res = await axios.get(`/books/${bookId}`);
    
    const rawData = res.data.book;
    
    const rezervisano = rawData.reserved_count || 0;
    const izdato = rawData.issued_count || 0;
    const u_prekoracenju = rawData.overdue_count || 0;
    
    let ukupna_kolicina = rawData.total_count || 0;
    let na_raspolaganju = rawData.number_of_copies_available || 0;
    
    if (ukupna_kolicina === 0 || ukupna_kolicina < na_raspolaganju) {
      ukupna_kolicina = na_raspolaganju + rezervisano + izdato + u_prekoracenju;
    } else {
      na_raspolaganju = ukupna_kolicina - rezervisano - izdato - u_prekoracenju;
      na_raspolaganju = Math.max(0, na_raspolaganju);
    }

    const bookData = {
      id: rawData.id,
      naziv_knjige: rawData.name,
      na_raspolaganju: na_raspolaganju,
      rezervisano: rezervisano,
      izdato: izdato,
      u_prekoracenju: u_prekoracenju,
      ukupna_kolicina: ukupna_kolicina,
    };
    
    book.value = bookData;
    
  } catch (err) {
    console.error('Greška pri učitavanju detalja o knjizi:', err);
    error.value = 'Greška pri učitavanju detalja o knjizi.';
    book.value = { naziv_knjige: 'Knjiga nije pronađena' };
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  try {
    const res = await axios.get('/users', { params: { role_id: 1, per_page: 100 } });
    students.value = res.data.data.data.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
    }));
  } catch (err) {
    console.error('Greška pri učitavanju učenika:', err);
    error.value = 'Greška pri učitavanju učenika.';
  }
}

async function submitIssue() {
  const { valid } = await issueForm.value.validate();
  
  if (!valid) {
    error.value = 'Molimo popunite sva obavezna polja.';
    return;
  }
  
  const librarianId = getLibrarianId();
  if (!librarianId) {
      return;
  }

  loading.value = true;
  error.value = null;
  try {
    const response = await axios.post('/rentals', {
      book_id: bookId,
      student_id: selectedStudent.value,
      librarian_id: librarianId,
    });

    if (response.data.message === 'Rental created successfully') {
      await fetchBookDetails();
      
      alert('Knjiga uspešno izdata!');
      router.push(`/book/${bookId}`);
    } else {
      throw new Error('Došlo je do greške prilikom izdavanja knjige.');
    }
  } catch (err) {
    console.error('Greška pri izdavanju knjige:', err);
    error.value = err.response?.data?.error || 'Došlo je do greške prilikom izdavanja knjige.';
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
  /* position: absolute;
  bottom: -15px;
  left: 12px; */
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