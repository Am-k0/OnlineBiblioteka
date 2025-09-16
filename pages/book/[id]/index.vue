<template>
  <div class="book-detail-page-wrapper">
    <div v-if="book" class="book-detail-container">
      <header class="app-header">
        <div>
          <h1 class="page-title">{{ book.naziv_knjige }}</h1>
          <p class="page-subtitle">
            <span class="link" @click="router.push('/books')">Evidencija knjiga</span> / {{ book.naziv_knjige }}
          </p>
        </div>

        <BookMenu v-if="userRole === 'librarian'" :book="book" />

      </header>

      <div
        class="header-divider"
        :class="{
          'header-divider--student': userRole === 'student'
        }"
      ></div>

      <div class="main-content-wrapper">
        <div class="left-side-wrapper">
          <div class="tabs-wrapper">
            <v-tabs
              v-model="tab"
              background-color="transparent"
              class="custom-tabs"
              slider-color="#3392EA"
              grow
            >
              <v-tab value="details" class="custom-tab first-tab">Osnovni Detalji</v-tab>
              <v-tab value="spec" class="custom-tab second-tab">Specifikacija</v-tab>
              <v-tab value="records" class="custom-tab third-tab">Evidencija iznajmljivanja</v-tab>
              <v-tab value="media" class="custom-tab fourth-tab">Multimedija</v-tab>
            </v-tabs>
          </div>

          <div class="tab-content-divider full-width-divider"></div>

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
                  <RecordManagement />
                </div>
              </v-window-item>
              <v-window-item value="media">
                <div class="media-tab-content">
                  <div class="dropzone-wrapper" @click="triggerFileInput">
                    <div class="dropzone-box">
                      <div class="dropzone-content">
                        <v-icon size="48" color="#9E9E9E" class="dropzone-icon">mdi-image-outline</v-icon>
                        <div class="dropzone-text">Prevucite datoteke ovdje ili kliknite.</div>
                      </div>
                      <input
                        type="file"
                        ref="fileInput"
                        accept="image/*"
                        @change="handleImageChange"
                        style="display: none"
                        multiple
                      />
                    </div>
                  </div>

                  <div class="available-images-wrapper">
                    <div class="available-images-box">
                      <div v-if="book.media && book.media.length > 0" class="images-container">
                        <img
                          v-for="(image, index) in book.media"
                          :key="index"
                          :src="image.url"
                          alt="Slika knjige"
                          class="available-image"
                        />
                      </div>
                      <div v-else class="no-images-container">
                        <img :src="defaultBookCover" alt="Default slika knjige" class="available-image" />
                      </div>
                    </div>
                  </div>

                  <ActionButtons
                    @save="handleSave"
                    @cancel="handleCancel"
                    class="media-action-buttons"
                  />
                </div>
              </v-window-item>
            </v-window>
          </v-card-text>
        </div>

        <div class="right-side-wrapper">
            <BookQuantities v-if="book" :book-id="book.id" />
        </div>
      </div>

    </div>
    <div v-else class="loading">
      <p v-if="loading">Učitavanje podataka o knjizi...</p>
      <p v-else>Nema podataka o knjizi.</p>
    </div>

    <v-snackbar
      v-model="errorSnackbar.show"
      color="error"
      :timeout="5000"
      top
    >
      {{ errorSnackbar.text }}
      <template v-slot:actions>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import BookDetail from '~/components/book-details.vue'
import BookSpecifications from '~/components/book-specifications.vue'
import RecordManagement from '~/components/record-management.vue'
import BookQuantities from '~/components/book-quantities.vue'
import ActionButtons from '~/components/action-buttons.vue'
import BookMenu from '~/components/book-menu.vue'

const route = useRoute()
const router = useRouter()

const tab = ref('details')
const book = ref(null)
const loading = ref(true);
const fileInput = ref(null)
const userRole = ref(null)

const defaultBookCover = '/images/default-book-1.jpg';

// Snackbar za greške
const errorSnackbar = ref({
  show: false,
  text: '',
});

const showErrorSnackbar = (text) => {
  errorSnackbar.value.text = text;
  errorSnackbar.value.show = true;
};

const fetchBook = async () => {
  loading.value = true;
  try {
    const bookResponse = await axios.get(`http://localhost/api/books/${route.params.id}`);
    const bookData = bookResponse.data.book;

    console.log('Book data from API:', bookData);

    const [authorsResponse, categoriesResponse, genresResponse, publishersResponse] = await Promise.all([
      axios.get('http://localhost/api/authors?per_page=100'),
      axios.get('http://localhost/api/categories'),
      axios.get('http://localhost/api/genres'),
      axios.get('http://localhost/api/publishers?per_page=100')
    ]);

    const authorsMap = new Map();
    const categoriesMap = new Map();
    const genresMap = new Map();
    const publishersMap = new Map();

    const authorList = authorsResponse?.data?.data?.data || authorsResponse?.data?.authors?.data || [];
    if (Array.isArray(authorList)) {
      authorList.forEach(author => {
        authorsMap.set(author.id, `${author.first_name} ${author.last_name}`);
      });
    }

    const categoryList = categoriesResponse?.data?.categories?.data || categoriesResponse?.data?.data?.data || [];
    if (Array.isArray(categoryList)) {
      categoryList.forEach(category => {
        categoriesMap.set(category.id, category.name);
      });
    }

    const genreList = genresResponse?.data?.genres?.data || genresResponse?.data?.data?.data || [];
    if (Array.isArray(genreList)) {
      genreList.forEach(genre => {
        genresMap.set(genre.id, genre.name);
      });
    }

    const publisherList = publishersResponse?.data?.publishers?.data || publishersResponse?.data?.data?.data || [];
    if (Array.isArray(publisherList)) {
      publisherList.forEach(publisher => {
        publishersMap.set(publisher.publisher_id || publisher.id, publisher.publisher_name || publisher.name);
      });
    }

    let authorNames = 'Nema podataka';
    let categoryNames = 'Nema podataka';
    let genreNames = 'Nema podataka';
    let publisherName = 'Nema podataka';

    if (bookData.authors && Array.isArray(bookData.authors) && bookData.authors.length > 0) {
      const names = bookData.authors
        .map(authorId => authorsMap.get(authorId))
        .filter(Boolean);
      if (names.length > 0) {
        authorNames = names.join(', ');
      }
    }

    if (bookData.categories && Array.isArray(bookData.categories) && bookData.categories.length > 0) {
      const names = bookData.categories
        .map(categoryId => categoriesMap.get(categoryId))
        .filter(Boolean);
      if (names.length > 0) {
        categoryNames = names.join(', ');
      }
    }

    if (bookData.genres && Array.isArray(bookData.genres) && bookData.genres.length > 0) {
      const names = bookData.genres
        .map(genreId => genresMap.get(genreId))
        .filter(Boolean);
      if (names.length > 0) {
        genreNames = names.join(', ');
      }
    }

    if (bookData.publisher_id) {
      const name = publishersMap.get(bookData.publisher_id);
      if (name) {
        publisherName = name;
      }
    }

    let pictureUrl = null;
    let media = [];
    try {
      const pictureResponse = await axios.get(`http://localhost/api/books/${route.params.id}/picture`);
      if (pictureResponse.data.picture_url) {
        pictureUrl = `http://localhost/storage/${pictureResponse.data.picture_url}`;
        media = [{ url: pictureUrl, filename: 'book-cover.jpg' }];

        if (pictureUrl !== defaultBookCover) {
          media.push({ url: defaultBookCover, filename: 'default-cover.jpg' });
        }
      }
    } catch (err) {
      console.log('Nema slike za ovu knjigu ili je došlo do greške pri dohvatanju.');
    }

    const rezervisano = bookData.reserved_count || 0;
    const izdato = bookData.issued_count || 0;
    const u_prekoracenju = bookData.overdue_count || 0;
    let ukupna_kolicina = bookData.total_count || 0;
    let na_raspolaganju = bookData.number_of_copies_available || 0;

    if (ukupna_kolicina === 0 || ukupna_kolicina < na_raspolaganju) {
      ukupna_kolicina = na_raspolaganju + rezervisano + izdato + u_prekoracenju;
    } else {
      na_raspolaganju = ukupna_kolicina - rezervisano - izdato - u_prekoracenju;
      na_raspolaganju = Math.max(0, na_raspolaganju);
    }

    book.value = {
      id: bookData.id,
      naziv_knjige: bookData.name || 'Nepoznat naziv',
      autori: authorNames,
      kategorije: categoryNames,
      zanrovi: genreNames,
      izdavac: publisherName,
      godina_izdavanja: bookData.publication_year || 'N/A',
      opis: bookData.description || 'Nema opisa',
      broj_stranica: bookData.number_of_pages || 'N/A',
      isbn: bookData.isbn || 'N/A',
      jezik: bookData.language || 'N/A',
      pismo: bookData.script || 'N/A',
      povez: bookData.binding || 'N/A',
      format: bookData.dimensions || 'N/A',
      dostupno_primjeraka: na_raspolaganju,
      ukupno_primjeraka: ukupna_kolicina,
      slika_knjige: pictureUrl || defaultBookCover,
      media: media.length > 0 ? media : [{ url: defaultBookCover, filename: 'default-cover.jpg' }],
      rawData: bookData,
      na_raspolaganju: na_raspolaganju,
      rezervisano: rezervisano,
      izdato: izdato,
      u_prekoracenju: u_prekoracenju,
      ukupna_kolicina: ukupna_kolicina,
    };

    console.log('Final book object:', book.value);

  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
    showErrorSnackbar(`Greška pri učitavanju podataka: ${err.message}.`);
  } finally {
    loading.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleImageChange = async (e) => {
  const files = e.target.files;
  if (!files.length) return;

  const formData = new FormData();
  for (const file of files) {
    formData.append('images[]', file);
  }

  try {
    console.log('Slanje slika na server...');
    // Logika za slanje slika na server
    // const response = await axios.post(`/api/books/${book.value.id}/images`, formData);
    // console.log('Slike uspješno otpremljene:', response.data);
    // await fetchBook(); // Osvježi podatke
  } catch (err) {
    showErrorSnackbar('Greška pri otpremanju slike. Molimo pokušajte ponovo.');
  }
};

const handleSave = () => {
  // Logic for saving changes on multimedia.
};

const handleCancel = () => {
  // Logic for canceling changes.
};

onMounted(() => {
  if (process.client) {
    const user = localStorage.getItem('user');
    if (user) {
      userRole.value = JSON.parse(user).role;
    }
  }
  fetchBook();
});
</script>

<style scoped>
.book-detail-page-wrapper {
  background-color: white;
  width: 100%;
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

/* NOVI STIL ZA STUDENTA */
.header-divider--student {
  margin-top: 15px;
}

.book-detail-container {
  padding: 0;
  margin-right: auto;
  max-width: 100%;
  position: relative;
}

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
  color: #444444;
}

.main-content-wrapper {
  display: flex;
  padding: 0 24px;
  align-items: flex-start;
  position: relative;
}

.left-side-wrapper {
  flex-grow: 1;
  min-width: 0;
  /* max-width: calc(100% - 320px); */ /* Ostavljamo ga da raste bez ograničenja */
}

.right-side-wrapper {
  flex: 0 0 280px;
  margin-left: 48px;
  margin-top: -24px;
  /* OVO UKLONITI */
  /*
  position: absolute;
  right: 24px;
  top: 0;
  */
}

.tab-content-divider {
  height: 1px;
  background-color: #e0e0e0;
  width: 100%;
  margin-bottom: 24px;
}

.full-width-divider {
  margin-left: -24px;
  margin-right: -48px;
  width: calc(100% + 90px);
  margin-top: 9px;
  height: 1px;
  background-color: #e0e0e0;
}
.custom-tabs {
  margin-left: 20px;
  margin-top: -18px;
  margin-bottom: -10px;
  width: 100%;
  max-width: 600px;
  height: 48px;
}

.custom-tab {
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 1.25px;
  text-align: center;
  vertical-align: middle;
  text-transform: none;
  color: #666;
}

.custom-tab.first-tab { width: 143px; }
.custom-tab.second-tab { width: 125px; }
.custom-tab.third-tab { width: 180px; }
.custom-tab.fourth-tab { width: 114px; }

.custom-tabs :deep(.v-tab--selected) {
  color: #3392ea;
  font-weight: 400;
}

.v-card-text {
  padding: 24px 0;
}

.media-tab-content {
  width: 100%;
}


.dropzone-wrapper {
  width: 724px;
  height: 234px;
  margin-bottom: 16px;
}

.dropzone-box {
  width: 100%;
  height: 100%;
  border: 2px dashed #BDBDBD;
  border-radius: 4px;
  background-color: #FFFFFF;
  cursor: pointer;
  opacity: 1;
  transition: border-color 0.3s ease, background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone-box:hover {
  border-color: #3392EA;
  background-color: #F8FBFF;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.dropzone-icon {
  margin-bottom: 16px;
}

.dropzone-text {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #757575;
  line-height: 1.4;
}
.available-images-wrapper {
  width: 724px;
  height: 234px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  background-color: #FFFFFF;
  margin-bottom: 24px;
}

.available-images-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.images-container {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.no-images-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.available-image {
  max-width: 150px;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #E0E0E0;
}

.media-action-buttons {
  margin-top: 24px;
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.loading {
  text-align: center;
  margin-top: 40px;
  font-size: 18px;
  color: #555;
}

.student-books-wrapper {
  width: 100%;
}

.tabs-wrapper {
  background-color: white;
}
</style>