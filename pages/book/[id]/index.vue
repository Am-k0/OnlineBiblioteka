<template>
  <v-card>
    <div v-if="book" class="book-detail-container">
      <header class="app-header">
        <div>
          <h1 class="page-title">{{ book.naziv_knjige }}</h1>
          <p class="page-subtitle">
            <span class="link" @click="router.push('/books')">Evidencija knjiga</span> / {{ book.naziv_knjige }}
          </p>
        </div>
        
        <div class="header-actions" v-if="book">
          <v-btn variant="text" @click="handleOtpisi" class="action-btn">
            <template v-slot:prepend>
              <v-icon icon="mdi-cancel" size="18"></v-icon>
            </template>
            Otpiši knjigu
          </v-btn>

          <v-btn variant="text" @click="handleIzdaj" class="action-btn">
            <template v-slot:prepend>
              <v-icon icon="mdi-book-arrow-right" size="18"></v-icon>
            </template>
            Izdaj knjigu
          </v-btn>

          <v-btn variant="text" @click="handleVrati" class="action-btn">
            <template v-slot:prepend>
              <v-icon icon="mdi-book-arrow-left" size="18"></v-icon>
            </template>
            Vrati knjigu
          </v-btn>

          <v-btn variant="text" @click="handleRezervisi" class="action-btn">
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
              <v-list-item @click="handleEdit" prepend-icon="mdi-pencil-outline">
                <v-list-item-title>Izmjeni Podatke</v-list-item-title>
              </v-list-item>
              <v-list-item @click="handleDelete" prepend-icon="mdi-delete-outline">
                <v-list-item-title>Izbriši Knjigu</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </header>

      <div class="header-divider"></div>

      <div class="main-content-wrapper">
        <div class="left-side-wrapper">
          <div class="tabs-wrapper">
            <v-tabs
              v-model="tab"
              background-color="white"
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
                  <studentBooks />
                </div>
              </v-window-item>
              <v-window-item value="media">
                <div class="media-tab-content">
                  <div class="field-wrapper photo-upload-wrapper" @click="triggerFileInput">
                    <div class="photo-upload-box">
                      <v-icon v-if="!book.media || book.media.length === 0" size="large" color="#757575">mdi-image</v-icon>
                      <input
                        type="file"
                        ref="fileInput"
                        accept="image/*"
                        @change="handleImageChange"
                        style="display: none"
                        multiple
                      />
                      <div v-if="!book.media || book.media.length === 0" class="upload-text">Dodaj sliku knjige</div>
                      <div v-if="book.media && book.media.length > 0" class="image-gallery-preview">
                        <img :src="book.media[0].url" class="image-preview" alt="Slika knjige" />
                      </div>
                    </div>
                  </div>

                  <div class="available-images-wrapper" v-if="book.media && book.media.length > 1">
                    <div class="available-images-box">
                      <img 
                        v-for="(image, index) in book.media.slice(1)" 
                        :key="index" 
                        :src="image.url" 
                        alt="Dodatna slika knjige" 
                        class="available-image" 
                      />
                    </div>
                  </div>
                  <div v-else class="available-images-wrapper">
                    <div class="available-images-box">
                      <img :src="defaultBookCover" alt="Default slika knjige" class="available-image" />
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
            <BookQuantities v-if="book" :quantities="book" />
        </div>
      </div>

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
import studentBooks from '~/components/studentBooks.vue'
import BookQuantities from '@/components/BookQuantities.vue'
import ActionButtons from '@/components/ActionButtons.vue'

const route = useRoute()
const router = useRouter()

const tab = ref('details')
const book = ref(null)
const error = ref(null)
const uploadError = ref(null)
const fileInput = ref(null)

const defaultBookCover = '/images/default-book-1.jpg';

const fetchCategoryName = async (id) => {
  const response = await axios.get(`http://localhost/api/categories/${id}`);
  return response.data.category.name; 
};

const fetchGenreName = async (id) => {
  const response = await axios.get(`http://localhost/api/genres/${id}`);
  return response.data.genre.name;
};

const fetchBook = async () => {
  try {
    const bookResponse = await axios.get(`http://localhost/api/books/${route.params.id}?include=authors,publisher`);
    const bookData = bookResponse.data.book;

    const categoryPromises = (bookData.categories || []).map(id => fetchCategoryName(id));
    const genrePromises = (bookData.genres || []).map(id => fetchGenreName(id));
    
    const categoryNames = await Promise.all(categoryPromises);
    const genreNames = await Promise.all(genrePromises);
    
    let pictureUrl = null;
    let media = [];
    try {
      const pictureResponse = await axios.get(`http://localhost/api/books/${route.params.id}/picture`);
      if (pictureResponse.data.picture_url) {
        pictureUrl = `http://localhost/storage/${pictureResponse.data.picture_url}`;
        // Simuliranje više slika za galeriju
        media = [
          { url: pictureUrl, filename: 'tom.jpg' },
          { url: '/images/default-book-1.jpg', filename: 'tom-cover-2.jpg' }
        ];
      }
    } catch (err) {
      console.log('Nema slike za ovu knjigu');
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
      autori: bookData.authors && bookData.authors.length 
        ? bookData.authors.map(author => author.name).join(', ')
        : 'Nema podataka',
      kategorije: categoryNames.length > 0 ? categoryNames.join(', ') : 'Nema podataka',
      zanrovi: genreNames.length > 0 ? genreNames.join(', ') : 'Nema podataka',
      izdavac: bookData.publisher ? bookData.publisher.name : 'Nema podataka',
      godina_izdavanja: bookData.published_at || 'N/A',
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
      media: media,
      rawData: bookData,
      na_raspolaganju: na_raspolaganju,
      rezervisano: rezervisano,
      izdato: izdato,
      u_prekoracenju: u_prekoracenju,
      ukupna_kolicina: ukupna_kolicina,
    };
  } catch (err) {
    error.value = `Greška pri učitavanju podataka: ${err.message}.`;
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleImageChange = async (e) => {
  const files = e.target.files;
  if (!files.length) return;

  uploadError.value = null;
  const formData = new FormData();
  for (const file of files) {
    formData.append('images[]', file);
  }

  try {
    // API poziv za upload slika
    console.log('Slanje slika na server...');
  } catch (err) {
    uploadError.value = 'Greška pri otpremanju slike.';
  }
};

const handleSave = () => {
  console.log('Sačuvane promjene na multimediji.');
};

const handleCancel = () => {
  console.log('Poništene promjene.');
};

const handleEdit = () => {
  router.push(`/books/${book.value.id}?edit=true`)
}

const handleDelete = () => {
  console.log('Brisanje knjige:', book.value.id);
}

const handleOtpisi = () => {
  router.push(`/book/${book.value.id}/discard`);
}
const handleIzdaj = () => {
  router.push(`/book/${book.value.id}/issue`);
}
const handleVrati = () => {
  router.push(`/book/${book.value.id}/return`);
}
const handleRezervisi = () => {
  router.push(`/book/${book.value.id}/reserve`);
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
}

.left-side-wrapper {
  flex-grow: 1;
  min-width: 0;
}

.right-side-wrapper {
  flex: 0 0 280px; 
  margin-left: 32px;
  margin-top: -24px; 
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

.photo-upload-wrapper {
  width: 100%;
  max-width: 724px;
  height: 234px;
  margin-bottom: 16px;
}

.photo-upload-box {
  width: 100%;
  height: 100%;
  border: 1px dashed #bdbdbd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #fafafa;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.photo-upload-box:hover {
  border-color: #3392ea;
}

.upload-text {
  margin-top: 8px;
  color: #757575;
  font-size: 14px;
}

.image-gallery-preview {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.available-images-wrapper {
  width: 100%;
  max-width: 724px;
  height: 234px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.available-images-box {
  width: 100%;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.available-image {
  max-width: 200px;
  max-height: 100%;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
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