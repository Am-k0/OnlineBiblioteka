<template>
  <div class="book-detail-content">
    <div class="book-info-section">
      <div class="book-cover-container">
        <img 
          :src="bookCoverUrl" 
          alt="Book cover" 
          class="book-cover" 
          @error="handleImageError"
        />
      </div>

      <div class="book-info-columns">
        <div class="book-info-left">
          <div class="info-group">
            <div class="info-label">Naziv Knjige</div>
            <div class="info-value">{{ book.naziv_knjige }}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Kategorija</div>
            <div class="info-value">{{ book.kategorije }}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Žanr</div>
            <div class="info-value">{{ book.zanrovi || 'Nepoznato' }}</div>
          </div>
        </div>

        <div class="book-info-right">
          <div class="info-group">
            <div class="info-label">Autori</div>
            <div class="info-value">{{ book.autori }}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Izdavači</div>
            <div class="info-value">{{ book.izdavac || 'Nepoznato' }}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Godina izdavanja</div>
            <div class="info-value">{{ formattedDate }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="storyline-section">
      <h3 class="section-title">Opis</h3>
      <div class="storyline-content">
        <p>
          <span v-if="isExpanded">{{ book.opis }}</span>
          <span v-else>{{ truncatedDescription }}</span>
          <span 
            v-if="shouldTruncate" 
            class="toggle-link"
            @click="toggleDescription"
          >
            {{ isExpanded ? 'Prikaži manje' : 'Prikaži više' }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  book: Object
})

const isExpanded = ref(false);
const CHARACTER_LIMIT = 300;

const truncatedDescription = computed(() => {
  const opis = props.book?.opis || '';
  if (opis.length > CHARACTER_LIMIT) {
    return opis.substring(0, CHARACTER_LIMIT) + '...';
  }
  return opis;
});

const shouldTruncate = computed(() => {
  const opis = props.book?.opis || '';
  return opis.length > CHARACTER_LIMIT;
});

const toggleDescription = () => {
  isExpanded.value = !isExpanded.value;
};

const formattedDate = computed(() => {
  if (!props.book?.godina_izdavanja) return 'Nepoznato'
  const dateValue = String(props.book.godina_izdavanja);
  if (dateValue.length === 4 && /^\d{4}$/.test(dateValue)) {
    return dateValue;
  }
  const date = new Date(props.book.godina_izdavanja);
  return date.getFullYear();
});

const bookCoverUrl = computed(() => {
  return props.book?.slika_knjige || 'https://via.placeholder.com/123x202';
});

const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/123x202';
};
</script>

<style scoped>
/* Vaši postojeći stilovi ostaju nepromijenjeni, ali su dodani novi stilovi za `toggle-link` */

.book-detail-content {
  background: white;
  padding: 16px;
  width: fit-content;
}

.book-info-section {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.book-cover-container {
  flex-shrink: 0;
}

.book-cover {
  width: 123px;
  height: 202px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.book-info-columns {
  display: flex;
  flex: 1;
  gap: 40px;
}

.book-info-left, .book-info-right {
  flex: 1;
}

.info-group {
  margin-bottom: 16px;
}

.info-label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
  margin-bottom: 4px;
}

.info-value {
  color: #333;
  font-size: 16px;
}

.storyline-section {
  border-top: 1px solid #eee;
  padding-top: 16px;
  width: 716px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.storyline-content {
  line-height: 1.6;
  color: #444;
}

.toggle-link {
  color: #1976d2;
  cursor: pointer;
  margin-left: 5px;
  font-weight: 500;
}
</style>