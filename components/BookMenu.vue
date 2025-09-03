<template>
  <div class="header-actions">
    <v-btn
      v-for="action in mainActions"
      :key="action.name"
      variant="text"
      @click="action.handler()"
      :class="['action-btn', { 'active-btn': isActionActive(action.name) }]"
    >
      <template v-slot:prepend>
        <v-icon :icon="action.icon" size="18"></v-icon>
      </template>
      {{ action.name }}
    </v-btn>

    <v-menu offset-y>
      <template v-slot:activator="{ props }">
        <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="action in dropdownActions"
          :key="action.name"
          @click="action.handler()"
          :prepend-icon="action.icon"
        >
          <v-list-item-title>{{ action.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="showMessage"
      :color="messageType"
      :timeout="4000"
      top
    >
      {{ message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showMessage = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Loading Dialog -->
    <v-dialog v-model="loading" persistent width="300">
      <v-card>
        <v-card-text class="text-center">
          <v-progress-circular indeterminate color="primary" class="mb-3"></v-progress-circular>
          <div>Brisanje knjige...</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { defineProps, computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from '@/axios';

const router = useRouter();
const route = useRoute();
const bookId = computed(() => route.params.id);

// Reactive variables for messages and loading
const loading = ref(false);
const showMessage = ref(false);
const message = ref('');
const messageType = ref('success');

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  }
});

const handleOtpisi = () => router.push(`/book/${bookId.value}/discard`);
const handleIzdaj = () => router.push(`/book/${bookId.value}/issue`);
const handleVrati = () => router.push(`/book/${bookId.value}/return`);
const handleRezervisi = () => router.push(`/book/${bookId.value}/reserve`);
const handleEdit = () => router.push(`/book/${bookId.value}/edit`);

const handleDelete = async () => {
  const bookName = props.book?.naziv_knjige || props.book?.name || 'ovu knjigu';
  
  // Prva potvrda
  if (!confirm(`Da li ste sigurni da želite da obrišete knjigu "${bookName}"?`)) {
    return;
  }

  // Druga potvrda za sigurnost
  if (!confirm('Poslednja potvrda: Da li stvarno želite da obrišete ovu knjigu? Ova akcija se ne može poništiti.')) {
    return;
  }

  loading.value = true;

  try {
    // Koristimo ispravan endpoint na osnovu vašeg PHP koda
    const response = await axios.delete(`http://localhost/api/books/${bookId.value}/destroy`);
    
    console.log('Knjiga uspješno obrisana:', response.data.message);
    
    // Prikaži success poruku
    message.value = `Knjiga "${bookName}" je uspešno obrisana!`;
    messageType.value = 'success';
    showMessage.value = true;
    
    // Nakon kratke pauze, preusmjeri na listu knjiga
    setTimeout(() => {
      router.push('/books');
    }, 1500);
    
  } catch (error) {
    console.error('Greška prilikom brisanja knjige:', error);
    
    let errorMessage = 'Došlo je do greške prilikom brisanja knjige.';
    
    if (error.response) {
      // Server je odgovorio sa error statusom
      if (error.response.status === 404) {
        errorMessage = 'Knjiga nije pronađena.';
      } else if (error.response.status === 403) {
        errorMessage = 'Nemate dozvolu za brisanje ove knjige.';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.status >= 500) {
        errorMessage = 'Greška na serveru. Pokušajte ponovo kasnije.';
      }
    } else if (error.request) {
      // Zahtjev je poslat ali nema odgovora
      errorMessage = 'Nema odgovora od servera. Provjerite internetsku vezu.';
    }
    
    // Prikaži error poruku
    message.value = errorMessage;
    messageType.value = 'error';
    showMessage.value = true;
    
  } finally {
    loading.value = false;
  }
};

const mainActions = [
  { name: 'Otpiši knjigu', icon: 'mdi-cancel', handler: handleOtpisi, routeSegment: 'discard' },
  { name: 'Izdaj knjigu', icon: 'mdi-book-arrow-right', handler: handleIzdaj, routeSegment: 'issue' },
  { name: 'Vrati knjigu', icon: 'mdi-book-arrow-left', handler: handleVrati, routeSegment: 'return' },
  { name: 'Rezerviši knjigu', icon: 'mdi-bookmark-outline', handler: handleRezervisi, routeSegment: 'reserve' },
];

const dropdownActions = [
  { name: 'Izmjeni Podatke', icon: 'mdi-pencil-outline', handler: handleEdit, routeSegment: 'edit' },
  { name: 'Izbriši Knjigu', icon: 'mdi-delete-outline', handler: handleDelete, routeSegment: 'delete' },
];

const isActionActive = (actionName) => {
  const currentPath = route.path.split('/').pop();
  if (actionName === 'Otpiši knjigu' && currentPath === 'discard') {
    return true;
  }
  if (actionName === 'Izdaj knjigu' && currentPath === 'issue') {
    return true;
  }
  if (actionName === 'Vrati knjigu' && currentPath === 'return') {
    return true;
  }
  if (actionName === 'Rezerviši knjigu' && currentPath === 'reserve') {
    return true;
  }
  return false;
};
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
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
  color: #3392EA !important;
}

.active-btn .v-icon {
  color: #3392EA !important;
}
</style>