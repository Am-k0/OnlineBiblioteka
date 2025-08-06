<template>
  <v-card>
    <div v-if="book" class="book-detail-container">

      <header class="app-header">
        <div>
          <h1 class="page-title">{{ book.naziv_knjige }}</h1>
          <p class="page-subtitle">
            <span class="link" @click="router.push('/books')">Evidencija knjiga</span> / ID: {{ book.id }}
          </p>
        </div>
        <ActionMenu
          v-if="book"
          :item="book"
          entityName="knjigu"
          title-property="naziv_knjige"
          :hideViewOption="true"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </header>

      <div class="header-divider"></div>

      <v-tabs
        v-model="tab"
        background-color="white"
        grow
        class="custom-tabs"
        slider-color="#3392EA"
        style="width: 500px; height: 48px;"
      >
        <v-tab value="details" :class="tab === 'details' ? 'active-tab' : 'inactive-tab'">Detalji</v-tab>
        <v-tab value="spec" :class="tab === 'spec' ? 'active-tab' : 'inactive-tab'">Specifikacija</v-tab>
        <v-tab value="records" :class="tab === 'records' ? 'active-tab' : 'inactive-tab'">Iznajmljivanje</v-tab>
        <v-tab value="media" :class="tab === 'media' ? 'active-tab' : 'inactive-tab'">Multimedija</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="details">
            <BookDetail :book="book" />
          </v-window-item>
          <v-window-item value="spec">
            <BookSpecifications :book="book" />
          </v-window-item>
          <v-window-item value="records">
            <div class="student-books-wrapper">
              <studentBooks />
            </div>
          </v-window-item>
          <v-window-item value="media">
            <div class="media-tab-content">
              <div class="current-image">
                <p v-if="!book.slika_knjige && !error" class="no-image-text">Knjiga nema naslovnu sliku.</p>
                <img
                  v-if="book.slika_knjige"
                  :src="book.slika_knjige"
                  alt="Naslovna slika knjige"
                  class="book-image"
                  @error="handleImageError"
                />
              </div>
              <div class="upload-section">
                <v-btn
                  color="primary"
                  @click="triggerFileInput"
                >
                  Promijeni sliku
                </v-btn>
                <input
                  type="file"
                  ref="fileInput"
                  style="display: none"
                  accept="image/jpeg, image/png, image/jpg"
                  @change="handleImageChange"
                />
                <p v-if="uploadError" class="error-text">{{ uploadError }}</p>
              </div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </div>
    <div v-else class="loading">
      <p v-if="error">{{ error }}</p>
      <p v-else>Učitavanje podataka o knjizi...</p>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import BookDetail from '@/components/BookDetails.vue'
import BookSpecifications from '~/components/BookSpecifications.vue'
import ActionMenu from '@/components/ActionMenu.vue'
import studentBooks from '~/components/studentBooks.vue'

const route = useRoute()
const router = useRouter()

const tab = ref('details')
const book = ref(null)
const error = ref(null)
const uploadError = ref(null)
const fileInput = ref(null)

const defaultBookCover = '/images/default-book-1.jpg';

const fetchBook = async () => {
  try {
    console.log('=== POČETAK UČITAVANJA PODATAKA ===');
    
    // 1. Učitavanje osnovnih podataka o knjizi
    const bookResponse = await axios.get(`http://localhost/api/books/${route.params.id}`);
    const bookData = bookResponse.data.book;
    console.log('Osnovni podaci o knjizi:', bookData);

    // 2. Priprema zahtjeva za dodatne podatke
    const requests = [];
    
    // Zahtev za autore
    if (bookData.authors && bookData.authors.length) {
      requests.push(
        axios.get('http://localhost/api/authors')
          .then(res => {
            // Normalizacija podataka - osiguravamo da imamo niz
            let authorsData = [];
            if (res.data.data) authorsData = res.data.data;
            else if (res.data.authors) authorsData = res.data.authors;
            else if (Array.isArray(res.data)) authorsData = res.data;
            else if (res.data) authorsData = [res.data];
            
            console.log('Dobijeni autori:', authorsData);
            return { 
              type: 'authors', 
              data: authorsData
            };
          })
          .catch(err => {
            console.error('Greška pri učitavanju autora:', err);
            return { type: 'authors', data: [] };
          })
      );
    }

    // Zahtev za kategorije
    if (bookData.categories && bookData.categories.length) {
      requests.push(
        axios.get('http://localhost/api/categories')
          .then(res => {
            let categoriesData = [];
            if (res.data.data) categoriesData = res.data.data;
            else if (res.data.categories) categoriesData = res.data.categories;
            else if (Array.isArray(res.data)) categoriesData = res.data;
            else if (res.data) categoriesData = [res.data];
            
            return { 
              type: 'categories', 
              data: categoriesData
            };
          })
          .catch(err => {
            console.error('Greška pri učitavanju kategorija:', err);
            return { type: 'categories', data: [] };
          })
      );
    }

    // Zahtev za žanrove
    if (bookData.genres && bookData.genres.length) {
      requests.push(
        axios.get('http://localhost/api/genres')
          .then(res => {
            let genresData = [];
            if (res.data.data) genresData = res.data.data;
            else if (res.data.genres) genresData = res.data.genres;
            else if (Array.isArray(res.data)) genresData = res.data;
            else if (res.data) genresData = [res.data];
            
            return { 
              type: 'genres', 
              data: genresData
            };
          })
          .catch(err => {
            console.error('Greška pri učitavanju žanrova:', err);
            return { type: 'genres', data: [] };
          })
      );
    }

    // Zahtev za izdavača
    if (bookData.publisher_id) {
      requests.push(
        axios.get(`http://localhost/api/publishers/${bookData.publisher_id}`)
          .then(res => ({ type: 'publisher', data: res.data.publisher || res.data }))
          .catch(err => {
            console.error('Greška pri učitavanju izdavača:', err);
            return { type: 'publisher', data: null };
          })
      );
    }

    // Zahtev za sliku
    requests.push(
      axios.get(`http://localhost/api/books/${route.params.id}/picture`)
        .then(res => ({ type: 'picture', data: res.data }))
        .catch(err => {
          console.log('Nema slike za ovu knjigu');
          return { type: 'picture', data: { picture_url: null } };
        })
    );

    // 3. Izvršavanje svih zahteva paralelno
    const responses = await Promise.all(requests);
    console.log('Odgovori sa API-ja:', responses);

    // 4. Obrada odgovora
    let allAuthors = [];
    let allCategories = [];
    let allGenres = [];
    let publisher = null;
    let pictureUrl = null;

    responses.forEach(response => {
      if (!response.data) return;

      switch (response.type) {
        case 'authors':
          allAuthors = response.data || [];
          console.log('Učitani autori:', allAuthors);
          break;
          
        case 'categories':
          allCategories = response.data || [];
          console.log('Učitane kategorije:', allCategories);
          break;
          
        case 'genres':
          allGenres = response.data || [];
          console.log('Učitani žanrovi:', allGenres);
          break;
          
        case 'publisher':
          publisher = response.data;
          console.log('Učitani izdavač:', publisher);
          break;
          
        case 'picture':
          pictureUrl = response.data.picture_url;
          console.log('URL slike:', pictureUrl);
          break;
      }
    });

    // 5. Mapiranje ID-jeva na imena
    const getAuthorNames = (authorIds) => {
      if (!authorIds || !authorIds.length || !Array.isArray(allAuthors)) return 'Nema podataka';
      
      return authorIds.map(id => {
        const author = allAuthors.find(a => a && a.id == id); // == namjerno zbog mogućih string vs number
        return author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : `Nepoznat autor (ID: ${id})`;
      }).filter(name => name && !name.includes('Nepoznat autor (ID: undefined)')).join(', ') || 'Nema podataka';
    };

    const getCategoryNames = (categoryIds) => {
      if (!categoryIds || !categoryIds.length || !Array.isArray(allCategories)) return 'Nema podataka';
      
      return categoryIds.map(id => {
        const category = allCategories.find(c => c && c.id == id);
        return category ? category.name : `Nepoznata kategorija (ID: ${id})`;
      }).filter(name => name && !name.includes('Nepoznata kategorija (ID: undefined)')).join(', ') || 'Nema podataka';
    };

    const getGenreNames = (genreIds) => {
      if (!genreIds || !genreIds.length || !Array.isArray(allGenres)) return 'Nema podataka';
      
      return genreIds.map(id => {
        const genre = allGenres.find(g => g && g.id == id);
        return genre ? genre.name : `Nepoznat žanr (ID: ${id})`;
      }).filter(name => name && !name.includes('Nepoznat žanr (ID: undefined)')).join(', ') || 'Nema podataka';
    };

    // 6. Kreiranje finalnog objekta knjige
    book.value = {
      id: bookData.id,
      naziv_knjige: bookData.name || 'Nepoznat naziv',
      autori: getAuthorNames(bookData.authors),
      kategorije: getCategoryNames(bookData.categories),
      zanrovi: getGenreNames(bookData.genres),
      izdavac: publisher ? (publisher.name || `ID: ${publisher.id}`) : (bookData.publisher_id ? `ID: ${bookData.publisher_id}` : 'Nema podataka'),
      godina_izdavanja: bookData.published_at || 'N/A',
      opis: bookData.description || 'Nema opisa',
      broj_stranica: bookData.number_of_pages || 'N/A',
      isbn: bookData.isbn || 'N/A',
      jezik: bookData.language || 'N/A',
      pismo: bookData.script || 'N/A',
      povez: bookData.binding || 'N/A',
      format: bookData.dimensions || 'N/A',
      dostupno_primjeraka: bookData.number_of_copies_available || 0,
      ukupno_primjeraka: bookData.number_of_copies || bookData.number_of_copies_available || 0,
      slika_knjige: pictureUrl ? `http://localhost/storage/${pictureUrl}` : defaultBookCover,
      // Dodatni podaci za debug
      rawData: bookData,
      allAuthors,
      allCategories,
      allGenres,
      publisherData: publisher
    };

    console.log('FINALNI OBJEKAT KNJIGE:', book.value);
    console.log('=== USPEŠNO ZAVRŠENO UČITAVANJE ===');

  } catch (err) {
    console.error('=== GREŠKA PRI UČITAVANJU ===', err);
    error.value = `Greška pri učitavanju podataka: ${err.message}`;
  }
};

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadError.value = null;
  const formData = new FormData();
  formData.append('front_cover', file);

  try {
    const response = await axios.post(`http://localhost/api/books/${book.value.id}/update-cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.picture_url) {
      book.value.slika_knjige = `http://localhost/storage/${response.data.picture_url}`;
    }
    console.log('Slika uspešno promenjena:', response.data);

  } catch (err) {
    console.error('Greška pri otpremanju slike:', err);
    uploadError.value = 'Greška pri otpremanju slike. Proverite da li je fajl ispravan (do 5MB).';
  }
}

const handleImageError = () => {
  if (book.value) {
    book.value.slika_knjige = defaultBookCover;
  }
}

const handleEdit = () => {
  router.push(`/books/${book.value.id}?edit=true`)
}

const handleDelete = () => {
  console.log('Brisanje knjige:', book.value.id);
}

onMounted(fetchBook)
</script>

<style scoped>
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
  text-decoration: underline;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 10px;
  margin-bottom: 24px;
}

.book-detail-container {
  padding: 24px;
  margin-right: auto;
  max-width: 100%;
  position: relative;
}

.stats-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
}

.action-menu-container {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
}

.book-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.book-title {
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin: 0;
}

.breadcrumb {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.breadcrumb .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.loading {
  text-align: center;
  margin-top: 40px;
  font-size: 18px;
  color: #555;
}

.under-construction {
  padding: 32px;
  text-align: center;
  font-size: 18px;
  color: #888;
}

.custom-tabs {
  background-color: white !important;
}

.active-tab {
  text-transform: none !important;
  font-weight: 600;
  color: #3392EA !important;
}

.inactive-tab {
  text-transform: none !important;
  font-weight: 600;
  color: #444444;
}

.v-tabs-slider {
  background-color: #3392EA !important;
}

.media-tab-content {
  padding: 20px;
  text-align: center;
}

.book-image {
  max-width: 300px;
  max-height: 450px;
  object-fit: contain;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.upload-section {
  margin-top: 20px;
}

.student-books-wrapper >>> table {
  width: 672px;
}

.error-text {
  color: red;
  margin-top: 10px;
}

.no-image-text {
  color: #777;
  font-style: italic;
}
</style>