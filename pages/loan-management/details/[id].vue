<template>
  <div class="page-container">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/books')">Evidencija knjiga</span> /
          <span class="link" @click="router.push(`/book/${bookId}`)">KNJIGA-{{ bookId }}</span> /
          IZDAVANJE-{{ issueId }}
        </p>
      </div>

      <BookMenu :book="book" :isActive="false" v-if="book" />
    </header>

    <div class="header-divider"></div>

    <main class="main-content">
      <div v-if="pending" class="book-info-container">
         <div class="book-cover-wrapper skeleton"></div>
         <div class="book-details-form skeleton-details">
            <div v-for="i in 6" :key="i" class="info-block">
              <p class="label skeleton-text" style="width: 70%;"></p>
              <p class="value skeleton-text" style="width: 50%;"></p>
            </div>
         </div>
      </div>

      <div v-else-if="issue && book" class="book-info-container">
        <div class="book-cover-wrapper">
          <img :src="book.slika || 'https://via.placeholder.com/123x202?text=Nema+slike'" alt="Naslovna strana" class="book-cover" />
        </div>
        
        <div class="book-details-form">
          <div class="info-block">
            <p class="label">Tip Transakcije</p>
            <p class="value primary-text">Izdavanje knjige</p>
          </div>

          <div class="info-block">
            <p class="label">Datum Akcije</p>
            <p class="value">{{ formattedDate }}</p>
          </div>

          <div class="info-block">
            <p class="label">Trenutno zadržavanje knjige</p>
            <p class="value">{{ daysRentedText }}</p>
          </div>

          <div class="info-block">
            <p class="label">Prekoračenje</p>
            <p class="value" :class="{ 'overdue-text': isOverdue }">{{ overdueText }}</p>
          </div>

          <div class="info-block">
            <p class="label">Bibliotekar</p>
            <p class="value link-text">{{ issue.rented_out_by?.name || '-' }} {{ issue.rented_out_by?.last_name || '' }}</p>
          </div>

          <div class="info-block">
            <p class="label">Učenik</p>
            <p class="value link-text">{{ issue.rented_by?.name || '-' }} {{ issue.rented_by?.last_name || '' }}</p>
          </div>
        </div>

        <div class="action-buttons-group">
          <v-btn class="btn-primary" @click="handleDiscard" :loading="discardLoading">
            <template v-slot:prepend>
              <v-icon icon="mdi-cancel" size="18"></v-icon>
            </template>
            Otpiši knjigu
          </v-btn>
          <v-btn class="btn-outline-primary" @click="handleReturn" :loading="returnLoading">
            <template v-slot:prepend>
              <v-icon icon="mdi-book-arrow-left" size="18"></v-icon>
            </template>
            Vrati knjigu
          </v-btn>
          <v-btn class="btn-outline-primary" @click="handleDelete" :loading="deleteLoading">
            <template v-slot:prepend>
              <v-icon icon="mdi-delete-outline" size="18"></v-icon>
            </template>
            Izbriši zapis
          </v-btn>
        </div>
      </div>
      <div v-else-if="error" class="error-message">
        Greška: Izdavanje nije moglo biti učitano. Proverite da li ID postoji.
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import dayjs from 'dayjs';
import 'dayjs/locale/sr-cyrl';
import BookMenu from '~/components/BookMenu.vue';

dayjs.locale('sr-cyrl');

const { $axios } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const bookId = ref(route.params.bookId);
const issueId = ref(parseInt(route.params.issueId, 10));

const book = ref(null);
const issue = ref(null);

// Loading states for buttons
const discardLoading = ref(false);
const returnLoading = ref(false);
const deleteLoading = ref(false);

const { data, pending, error, refresh } = useAsyncData(
  'rentalDetails',
  async () => {
    try {
      // Get rental details
      const rentalResponse = await $axios.get(`/rentals/${issueId.value}`);
      const rentalData = rentalResponse.data;
      
      // Get book details
      const bookResponse = await $axios.get(`/books/${bookId.value}`);
      const bookData = bookResponse.data;
      
      // Get book picture if exists
      let pictureUrl = null;
      try {
        const pictureResponse = await $axios.get(`/books/${bookId.value}/picture`);
        pictureUrl = pictureResponse.data.picture_url;
      } catch (pictureError) {
        console.warn("Book picture not found");
      }

      return {
        rental: rentalData,
        book: {
          ...bookData,
          slika: pictureUrl
        }
      };
    } catch (err) {
      console.error('Error fetching data:', err);
      throw err;
    }
  },
  { watch: [bookId, issueId] }
);

// Populate refs when data is loaded
watch(data, (newData) => {
  if (newData) {
    issue.value = {
      ...newData.rental,
      rented_out_by: newData.rental.librarian,
      rented_by: newData.rental.student,
      rental_date: newData.rental.rented_at
    };
    
    book.value = {
      ...newData.book,
      naziv_knjige: newData.book.name
    };
  }
}, { immediate: true });

// Computed properties
const pageTitle = computed(() => {
  if (pending.value) return 'Učitavam...';
  if (book.value?.naziv_knjige) return book.value.naziv_knjige;
  if (error.value) return 'Greška';
  return 'Detalji izdavanja';
});

const formattedDate = computed(() => {
  if (!issue.value?.rental_date) return '-';
  return dayjs(issue.value.rental_date).format('DD.MM.YYYY');
});

const daysRented = computed(() => {
  if (!issue.value?.rental_date) return null;
  return dayjs().diff(dayjs(issue.value.rental_date), 'day');
});

const daysRentedText = computed(() => {
  if (daysRented.value === null) return '-';
  const days = daysRented.value;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  const formatDays = d => `${d} ${d === 1 ? 'dan' : (d > 4 ? 'dana' : 'dana')}`;
  const formatWeeks = w => `${w} ${w === 1 ? 'nedelja' : 'nedelja'}`;

  if (weeks === 0) return formatDays(remainingDays);
  if (remainingDays === 0) return formatWeeks(weeks);
  return `${formatWeeks(weeks)} i ${formatDays(remainingDays)}`;
});

const isOverdue = computed(() => {
  if (daysRented.value === null) return false;
  return daysRented.value > 30;
});

const overdueText = computed(() => {
  if (!isOverdue.value) return 'Nema prekoračenja';
  const daysOverdue = daysRented.value - 30;
  return `Prekoračenje od ${daysOverdue} ${daysOverdue === 1 ? 'dan' : 'dana'}`;
});

// Handler functions
const handleDiscard = async () => {
  try {
    discardLoading.value = true;
    await $axios.post(`/books/${bookId.value}/discard`);
    
    alert('Knjiga je uspešno otpisana');
    router.back();
  } catch (error) {
    console.error('Greška pri otpisivanju knjige:', error);
    alert('Greška pri otpisivanju knjige: ' + (error.response?.data?.error || 'Neočekivana greška'));
  } finally {
    discardLoading.value = false;
  }
};

const handleReturn = async () => {
  try {
    returnLoading.value = true;
    await $axios.post(`/rentals/${issueId.value}/return`);
    
    alert('Knjiga je uspešno vraćena');
    refresh();
  } catch (error) {
    console.error('Greška pri vraćanju knjige:', error);
    alert('Greška pri vraćanju knjige: ' + (error.response?.data?.error || 'Neočekivana greška'));
  } finally {
    returnLoading.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm('Da li ste sigurni da želite da izbrišete ovaj zapis?')) {
    return;
  }
  
  try {
    deleteLoading.value = true;
    await $axios.delete(`/rentals/${issueId.value}`);
    
    alert('Zapis je uspešno izbrisan');
    router.push(`/book/${bookId.value}`);
  } catch (error) {
    console.error('Greška pri brisanju zapisa:', error);
    alert('Greška pri brisanju zapisa: ' + (error.response?.data?.error || 'Neočekivana greška'));
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f6f8;
}

.app-header {
  padding: 6px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-family: 'Roboto', sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #222;
  margin: 0;
  line-height: 1;
}

.page-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
  margin-top: 2px;
}

.link {
  color: #1976d2;
  cursor: pointer;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 10px;
  margin-bottom: 24px;
}

.main-content {
  padding: 0 24px;
  flex-grow: 1;
  display: flex;
  justify-content: flex-start;
}

.book-info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.book-cover-wrapper {
  width: 123px;
  height: 202px;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.book-details-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 203px;
}

.info-block {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 12px;
  color: #777;
  line-height: 1.5;
}

.value {
  font-size: 16px;
  font-weight: 400;
  color: #222;
  line-height: 1.5;
}

.primary-text {
  color: #3392EA;
  font-weight: 500;
}

.link-text {
  color: #3392EA;
  cursor: pointer;
}

.overdue-text {
  color: #CF2A27;
}

.action-buttons-group {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  width: 500px;
}

.v-btn {
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  font-size: 14px;
  text-transform: none;
  height: 36px !important;
  padding: 0 16px;
  letter-spacing: 1.25px;
  border-radius: 4px;
  box-shadow: none;
}

.btn-primary {
  background-color: #3392EA !important;
  color: white !important;
}

.btn-primary .v-icon {
  color: white !important;
}

.btn-outline-primary {
  border: 1px solid #3392EA;
  color: #3392EA !important;
  background-color: transparent !important;
}

.btn-outline-primary .v-icon {
  color: #3392EA !important;
}

.error-message {
  color: #CF2A27;
  font-size: 16px;
}

/* Skeleton loader styles */
@keyframes skeleton-loading {
  0% { background-color: #e0e0e0; }
  100% { background-color: #f0f0f0; }
}

.skeleton {
  animation: skeleton-loading 1.5s linear infinite alternate;
  border-radius: 4px;
}

.skeleton-details .info-block {
  margin-bottom: 8px;
}

.skeleton-text {
  height: 1em;
  background-color: #e0e0e0;
  animation: skeleton-loading 1.5s linear infinite alternate;
  border-radius: 4px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.skeleton-details .label {
  height: 12px;
  width: 70%;
}

.skeleton-details .value {
  height: 16px;
  width: 50%;
}
</style>