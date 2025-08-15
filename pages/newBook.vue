<template>
  <div class="page bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Nova knjiga</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/books')">Evidencija knjiga</span> / Nova knjiga
        </p>
      </div>
    </header>

    <div class="header-divider"></div>

    <v-card class="form-card">
      <v-tabs v-model="tab" class="custom-tabs" grow slider-color="#3392EA">
        <v-tab value="one" class="custom-tab first-tab">Osnovni Detalji</v-tab>
        <v-tab value="two" class="custom-tab second-tab">Specifikacija</v-tab>
        <v-tab value="three" class="custom-tab third-tab">Multimedija</v-tab>
      </v-tabs>

      <v-card-text>
        <v-form ref="form">
          <v-window v-model="tab">
            <v-window-item value="one">
              <div
                class="tab-content form-content"
                :class="{ 'form-content--error': showErrors && hasErrorsOnFirstTab }"
              >
                <div v-if="globalError" class="custom-error" style="font-weight: bold; margin-bottom: 1rem;">
                  {{ globalError }}
                </div>

                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.name"
                    label="Unesite naziv knjige*"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.name"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.name" class="custom-error">
                    Morate unijeti naziv knjige!
                  </div>
                </div>

                <div class="field-wrapper">
                  <v-textarea
                    v-model="book.description"
                    label="Unesite kratak sadržaj knjige*"
                    variant="outlined"
                    :style="textareaStyle"
                    rows="3"
                    :error="showErrors && !book.description"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.description" class="custom-error">
                    Morate unijeti kratak sadržaj knjige!
                  </div>
                </div>

                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.categories"
                    label="Izaberite kategoriju"
                    :items="uniqueCategories.data"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    multiple
                    chips
                    :style="fieldStyle"
                    hide-details="auto"
                  />
                </div>

                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.genres"
                    label="Izaberite žanr"
                    :items="uniqueGenres.data"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    multiple
                    chips
                    :style="fieldStyle"
                    hide-details="auto"
                  />
                </div>

                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.authors"
                    label="Izaberite autora*"
                    :items="uniqueAuthors.data"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    multiple
                    chips
                    :style="fieldStyle"
                    :error="showErrors && book.authors.length === 0"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && book.authors.length === 0" class="custom-error">
                    Morate izabrati barem jednog autora!
                  </div>
                </div>

                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.publisher_id"
                    label="Izaberite izdavača*"
                    :items="uniquePublishers.data"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.publisher_id"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.publisher_id" class="custom-error">
                    Morate izabrati izdavača!
                  </div>
                </div>

                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.publication_year"
                    label="Godina izdavanja*"
                    type="number"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && (!book.publication_year || book.publication_year <= 0)"
                    hide-details="auto"
                  />
                  <div
                    v-if="showErrors && (!book.publication_year || book.publication_year <= 0)"
                    class="custom-error"
                  >
                    Morate unijeti godinu izdavanja!
                  </div>
                </div>

                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.number_of_copies_available"
                    label="Ukupna količina*"
                    type="number"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && (!book.number_of_copies_available || book.number_of_copies_available <= 0)"
                    hide-details="auto"
                  />
                  <div
                    v-if="showErrors && (!book.number_of_copies_available || book.number_of_copies_available <= 0)"
                    class="custom-error"
                  >
                    Morate unijeti pozitivnu količinu!
                  </div>
                </div>

                <div class="form-actions">
                  <ActionButtons @save="validateAndSave" @cancel="cancel" :loading="isSaving" />
                </div>
              </div>
            </v-window-item>

            <v-window-item value="two">
              <div class="tab-content form-content">
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.number_of_pages"
                    label="Broj stranica*"
                    type="number"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && (!book.number_of_pages || book.number_of_pages <= 0)"
                    hide-details="auto"
                  />
                  <div
                    v-if="showErrors && (!book.number_of_pages || book.number_of_pages <= 0)"
                    class="custom-error"
                  >
                    Morate unijeti broj stranica!
                  </div>
                </div>

                <div class="field-wrapper">
                  <v-select
                    v-model="book.script"
                    label="Vrsta pisma"
                    :items="SCRIPT_OPTIONS"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    :style="fieldStyle"
                    hide-details="auto"
                  />
                </div>

                <div class="field-wrapper">
                  <v-select
                    v-model="book.binding"
                    label="Vrsta poveza"
                    :items="BINDING_OPTIONS"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    :style="fieldStyle"
                    hide-details="auto"
                  />
                </div>

                <div class="field-wrapper">
                  <v-select
                    v-model="book.dimensions"
                    label="Format"
                    :items="DIMENSIONS_OPTIONS"
                    variant="outlined"
                    :style="fieldStyle"
                    hide-details="auto"
                  />
                </div>

                <div class="field-wrapper">
                  <v-select
                    v-model="book.language"
                    label="Jezik"
                    :items="LANGUAGE_OPTIONS"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    :style="fieldStyle"
                    hide-details="auto"
                  />
                </div>

                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.isbn"
                    label="ISBN*"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && (!book.isbn || !validIsbn)"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.isbn" class="custom-error">
                    Morate unijeti ISBN!
                  </div>
                  <div v-else-if="showErrors && book.isbn && !validIsbn" class="custom-error">
                    Nevažeći ISBN format!
                  </div>
                </div>

                <div class="form-actions">
                  <ActionButtons @save="validateAndSave" @cancel="cancel" :loading="isSaving" />
                </div>
              </div>
            </v-window-item>

            <v-window-item value="three">
              <div class="tab-content form-content">
                <div class="field-wrapper">
                  <div class="photo-upload-box" @click="triggerFileInput">
                    <v-icon v-if="!imageUrl" size="large" color="#757575">mdi-image</v-icon>
                    <input
                      type="file"
                      ref="fileInput"
                      accept="image/*"
                      @change="handleFileUpload"
                      style="display: none"
                    />
                    <div v-if="!imageUrl" class="upload-text">Dodaj sliku knjige</div>
                    <img v-if="imageUrl" :src="imageUrl" class="image-preview" alt="Slika knjige" />
                  </div>
                </div>

                <div class="form-actions">
                  <ActionButtons @save="validateAndSave" @cancel="cancel" :loading="isSaving" />
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ActionButtons from '@/components/ActionButtons.vue' // Prilagodite putanju ako je potrebno
import axios from '@/axios' // Prilagodite putanju ako je potrebno

const tab = ref('one')
const isSaving = ref(false)
const fileInput = ref(null)
const router = useRouter()
const form = ref(null)
const imageUrl = ref('')
const selectedFile = ref(null)
const showErrors = ref(false)
const globalError = ref('')

const book = reactive({
  name: '',
  description: '',
  number_of_copies_available: null,
  number_of_pages: null,
  publication_year: null,
  script: 'latin',
  binding: 'paperback',
  dimensions: 'A5',
  language: 'crnogorski',
  isbn: '',
  categories: [],
  genres: [],
  authors: [],
  publisher_id: null
})

// Definicije padajućih lista
const uniqueCategories = ref({ data: [] })
const uniqueGenres = ref({ data: [] })
const uniqueAuthors = ref({ data: [] })
const uniquePublishers = ref({ data: [] })

const SCRIPT_OPTIONS = [
  { title: 'Ćirilica', value: 'cyrillic' },
  { title: 'Latinica', value: 'latin' }
]

const BINDING_OPTIONS = [
  { title: 'Tvrdi povez', value: 'hardcover' },
  { title: 'Meki povez', value: 'paperback' }
]

const DIMENSIONS_OPTIONS = ['A4', 'A5', 'A6']

const LANGUAGE_OPTIONS = [
  { title: 'Crnogorski', value: 'crnogorski' },
  { title: 'Engleski', value: 'engleski' },
  { title: 'Srpski', value: 'srpski' }
]

// Učitavanje podataka za padajuće liste
onMounted(() => {
  fetchRelatedData()
})

async function fetchRelatedData() {
  try {
    const [categoriesRes, genresRes, authorsRes, publishersRes] = await Promise.all([
      axios.get('/categories'),
      axios.get('/genres'),
      axios.get('/authors?per_page=100'),
      axios.get('/publishers?per_page=100')
    ])
    uniqueCategories.value.data = categoriesRes.data.categories.data
    uniqueGenres.value.data = genresRes.data.genres.data
    uniqueAuthors.value.data = authorsRes.data.data.data.map(a => ({ ...a, name: `${a.first_name} ${a.last_name}` }))
    uniquePublishers.value.data = publishersRes.data.publishers.data
  } catch (error) {
    globalError.value = 'Greška pri učitavanju podataka za padajuće liste.'
    console.error('Greška pri učitavanju podataka:', error)
  }
}

// Rukovanje fajlom
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (evt) => {
      imageUrl.value = evt.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Validacija
const validIsbn = computed(() => {
  const isbn = (book.isbn || '').replace(/[- ]/g, '')
  return isbn.length === 10 || isbn.length === 13; // Osnovna provera dužine
})

const hasErrorsOnFirstTab = computed(() => {
  return !book.name || !book.description || !book.publisher_id || book.authors.length === 0 || !book.publication_year || book.publication_year <= 0 || !book.number_of_copies_available || book.number_of_copies_available <= 0
})

const hasErrorsOnSecondTab = computed(() => {
  return !book.number_of_pages || book.number_of_pages <= 0 || !book.isbn || !validIsbn.value
})

async function validateAndSave() {
  showErrors.value = true
  globalError.value = ''

  if (hasErrorsOnFirstTab.value) {
    tab.value = 'one'
    return
  }
  if (hasErrorsOnSecondTab.value) {
    tab.value = 'two'
    return
  }
  await saveBook()
}

// Glavna funkcija za čuvanje
async function saveBook() {
  isSaving.value = true
  globalError.value = ''

  const formData = new FormData()

  // Dodavanje osnovnih polja
  Object.keys(book).forEach(key => {
    const value = book[key]
    if (key !== 'authors' && key !== 'genres' && key !== 'categories' && value !== null) {
      formData.append(key, value)
    }
  })

  // Dodavanje nizova (autori, žanrovi, kategorije)
  book.authors.forEach(id => formData.append('authors[]', id))
  book.genres.forEach(id => formData.append('genres[]', id))
  book.categories.forEach(id => formData.append('categories[]', id))

  // *** KLJUČNA ISPRAVKA ***
  // Slanje slike unutar niza 'images' kako backend očekuje
  if (selectedFile.value) {
    formData.append('images[]', selectedFile.value)
  }

  try {
    const response = await axios.post('/books/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // Uspešno kreiranje, preusmeravanje na stranicu knjige
    const bookId = response.data?.book?.id
    if (bookId) {
      router.push(`/book/${bookId}`)
    } else {
      router.push('/books')
    }

  } catch (error) {
    console.error('Greška pri čuvanju knjige:', error.response?.data || error.message)
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      const errorMessages = Object.values(errors).flat()
      globalError.value = `Došlo je do greške: ${errorMessages.join(' ')}`
    } else {
      globalError.value = 'Došlo je do neočekivane greške na serveru. Pokušajte ponovo.'
    }
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  router.push('/books')
}

// Stilovi (nepromenjeni)
const fieldStyle = { width: '724px', height: '48px' }
const textareaStyle = { width: '724px', height: '160px' }
</script>

<style scoped>
.page {
  padding: 0;
  background-color: white;
  min-height: 100vh;
  overflow: hidden;
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
}
.page-subtitle {
  font-size: 14px;
  color: #777;
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
  margin-top: 15px;
  margin-bottom: 24px;
}
.form-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.custom-tabs {
  margin-left: 20px;
  width: 414px;
  height: 48px;
}
.custom-tab {
  font-size: 14px;
  text-transform: none;
  color: #666;
}
.custom-tabs :deep(.v-tab--selected) {
  color: #3392ea;
  font-weight: 400;
}
.form-content {
  width: 724px;
  min-height: 660px;
  transition: min-height 0.3s;
}
.form-content--error {
  min-height: 856px !important;
}
.photo-upload-box {
  width: 200px;
  height: 160px;
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
}
.photo-upload-box:hover {
  border-color: #3392ea;
}
.upload-text {
  margin-top: 8px;
  color: #757575;
  font-size: 14px;
}
.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.custom-error {
  color: #cf2a27;
  font-size: 12px;
  margin-top: 2px;
}
.form-actions {
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.field-wrapper {
  margin-bottom: 18px;
  position: relative;
}
</style>