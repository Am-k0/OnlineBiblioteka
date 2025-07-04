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
            <div class="info-value">{{ book.kategorija }}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Žanr</div>
            <div class="info-value">{{ book.zanr || 'Nepoznato' }}</div>
          </div>
        </div>

        <div class="book-info-right">
          <div class="info-group">
            <div class="info-label">Autori</div>
            <div class="info-value">{{ book.autor }}</div>
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
      <h3 class="section-title">Storyline (Kratak Sadžaj)</h3>
      <div class="storyline-content">
        <p>
          {{ truncatedDescription }}
          <span 
            v-if="shouldTruncate && !showFullDescription" 
            class="show-more"
            @click="showFullDescription = true"
          >
            ... Prikaži više!
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

const showFullDescription = ref(false)
const wordLimit = 150

const wordCount = computed(() => {
  return (props.book?.kratak_sadrzaj || '').split(' ').length
})

const shouldTruncate = computed(() => {
  return wordCount.value > wordLimit
})

const truncatedDescription = computed(() => {
  if (!shouldTruncate.value || showFullDescription.value) {
    return props.book?.kratak_sadrzaj || 'Nema opisa'
  }
  const words = (props.book?.kratak_sadrzaj || '').split(' ')
  return words.slice(0, wordLimit).join(' ') + '...'
})

const formattedDate = computed(() => {
  if (!props.book?.godina_izdavanja) return 'Nepoznato'
  const date = new Date(props.book.godina_izdavanja)
  return date.getFullYear()
})

const bookCoverUrl = computed(() => {
  return props.book?.slika_knjige || 'https://via.placeholder.com/123x202'
})

const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/123x202'
}
</script>

<style scoped>
.book-detail-content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
  height: 141px;
  overflow: hidden;
}

.show-more {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}
</style>