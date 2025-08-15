<template>
  <div class="header-actions">
    <v-btn
      v-for="action in mainActions"
      :key="action.name"
      variant="text"
      @click="action.handler(book)"
      :class="['action-btn', { 'active-btn': action.name === 'Vrati knjigu' && isActive }]"
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
          @click="action.handler(book)"
          :prepend-icon="action.icon"
        >
          <v-list-item-title>{{ action.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Define props to receive the book object and active state
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

// Handlers for the actions
const handleOtpisi = (book) => router.push(`/book/${book.id}/discard`);
const handleIzdaj = (book) => router.push(`/book/${book.id}/issue`);
const handleVrati = (book) => router.push(`/book/${book.id}/return`);
const handleRezervisi = (book) => router.push(`/book/${book.id}/reserve`);
const handleEdit = (book) => router.push(`/book/${book.id}/edit`);
const handleDelete = (book) => {
  // Add your delete logic here, or emit an event
  console.log('Brisanje knjige:', book.id);
  // emit('delete', book.id);
};

// Configuration for main action buttons
const mainActions = [
  { name: 'Otpiši knjigu', icon: 'mdi-cancel', handler: handleOtpisi },
  { name: 'Izdaj knjigu', icon: 'mdi-book-arrow-right', handler: handleIzdaj },
  { name: 'Vrati knjigu', icon: 'mdi-book-arrow-left', handler: handleVrati },
  { name: 'Rezerviši knjigu', icon: 'mdi-bookmark-outline', handler: handleRezervisi },
];

// Configuration for dropdown menu items
const dropdownActions = [
  { name: 'Izmjeni Podatke', icon: 'mdi-pencil-outline', handler: handleEdit },
  { name: 'Izbriši Knjigu', icon: 'mdi-delete-outline', handler: handleDelete },
];

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
}
</style>