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

        <v-form @submit.prevent="submitReservation">
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
              :rules="[v => !!v || 'Učenik je obavezan']"
            ></v-select>
          </div>

          <div class="d-flex mt-4">
            <div class="field-wrapper form-field-full">
              <v-text-field
                v-model="reservationDate"
                label="Datum rezervacije..."
                type="date"
                variant="outlined"
                hide-details="auto"
                :rules="[v => !!v || 'Datum je obavezan']"
              ></v-text-field>
              <div class="form-help-text">Format dd/mm/yyyy</div>
            </div>
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
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/axios';
import ActionButtons from '@/components/ActionButtons.vue';
import BookQuantities from '@/components/BookQuantities.vue';
// Uvozimo novu BookMenu komponentu
import BookMenu from '@/components/BookMenu.vue';

const route = useRoute();
const router = useRouter();

const book = ref(null);
const students = ref([]);
const selectedStudent = ref(null);
const reservationDate = ref(null);
const expirationDate = ref(null);
const loading = ref(false);
const error = ref(null);

const bookId = ref(route.params.id);

const getLibrarianId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.id || null;
    } catch (e) {
        console.error('Greška pri parsiranju user objekta iz localStorage-a:', e);
        return null;
    }
};

const calculateExpirationDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d.toISOString().substr(0, 10);
};

// NAPOMENA: Sve ove funkcije su sada u BookMenu.vue i pozivaju se automatski
// Ne treba ih definisati ovdje. Zato ih uklanjam.
/*
const handleEdit = (item) => {
  router.push(`/book/${item.id}?edit=true`);
};

const handleDelete = (item) => {
  console.log('handleDelete pozvan za item:', item);
};

const handleOtpisi = (item) => {
  router.push(`/book/${item.id}/discard`);
};

const handleIzdaj = (item) => {
  router.push(`/book/${item.id}/issue`);
};

const handleVrati = (item) => {
  router.push(`/book/${item.id}/return`);
};

const handleRezervisi = (item) => {
  window.location.reload();
};
*/

watch(reservationDate, (newDate) => {
  expirationDate.value = calculateExpirationDate(newDate);
});

onMounted(() => {
  if (!bookId.value) {
    error.value = 'ID knjige nije pronađen. Proverite URL rutu.';
    return;
  }
  fetchBookDetails();
  fetchStudents();
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

    const rezervisano = rawData.reserved_count || 0;
    const izdato = rawData.issued_count || 0;
    const u_prekoracenju = rawData.overdue_count || 0;
    
    let ukupna_kolicina = rawData.total_count || 0;
    let na_raspolaganju = rawData.number_of_copies_available || 0;
    
    // Dodatna logika za ispravno računanje količina, slično kao u issue.vue
    if (ukupna_kolicina === 0 || ukupna_kolicina < na_raspolaganju) {
      ukupna_kolicina = na_raspolaganju + rezervisano + izdato + u_prekoracenju;
    } else {
      na_raspolaganju = ukupna_kolicina - rezervisano - izdato - u_prekoracenju;
      na_raspolaganju = Math.max(0, na_raspolaganju);
    }
    
    book.value = {
      id: rawData.id,
      naziv_knjige: rawData.name,
      na_raspolaganju: na_raspolaganju,
      rezervisano: rezervisano,
      izdato: izdato,
      u_prekoracenju: u_prekoracenju,
      ukupna_kolicina: ukupna_kolicina,
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
    const res = await api.get('/users', { params: { role_id: 1, per_page: 100 } });
    
    if (res.data?.data?.data) {
        students.value = res.data.data.data.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        }));
    } else {
        throw new Error('Nisu pronađeni podaci o studentima.');
    }
  } catch (err) {
    console.error('Greška pri učitavanju učenika:', err);
    error.value = 'Greška pri učitavanju učenika.';
  }
}

async function submitReservation() {
  if (!selectedStudent.value || !reservationDate.value) {
    alert('Molimo popunite sva obavezna polja.');
    return;
  }
  
  const librarianId = getLibrarianId();
  if (!librarianId) {
      alert('ID bibliotekara nije pronađen. Molimo prijavite se ponovo.');
      return;
  }

  loading.value = true;
  error.value = null;

  try {
    await api.post('/rentals', {
      book_id: bookId.value,
      student_id: selectedStudent.value,
      librarian_id: librarianId,
      reservation_date: reservationDate.value,
      expiration_date: expirationDate.value,
    });
    
    alert('Knjiga uspešno rezervisana!');
    router.push(`/book/${bookId.value}`);
  } catch (err) {
    console.error('Greška pri rezervaciji knjige:', err);
    error.value = 'Došlo je do greške prilikom rezervacije knjige.';
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

/* Ovi stilovi su sada u BookMenu.vue */
/*
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

.active-btn {
  background-color: rgba(0, 0, 0, 0.04);
}
*/

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