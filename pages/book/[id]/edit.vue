<template>
  <div class="page-container bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">{{ book.name || 'Izmjena knjige' }}</h1>
        <div class="breadcrumbs">
          <router-link to="/books" class="breadcrumb-link">Evidencija knjiga</router-link>
         
          <span>/ Izmijena knjige</span>
        </div>
      </div>
    </header>

    <div class="header-divider"></div>

    <div class="page-content">
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
                <div class="tab-content form-content" :class="{ 'form-content--error': showErrors && hasErrorsOnFirstTab }">
                  <div v-if="globalError" class="custom-error" style="font-weight: bold">
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
                    <div v-if="showErrors && (!book.publication_year || book.publication_year <= 0)" class="custom-error">
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
                    <div v-if="showErrors && (!book.number_of_copies_available || book.number_of_copies_available <= 0)" class="custom-error">
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
                    <div v-if="showErrors && (!book.number_of_pages || book.number_of_pages <= 0)" class="custom-error">
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
                  <div class="field-wrapper photo-upload-wrapper" @click="triggerFileInput">
                    <div class="photo-upload-box">
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

                  <div class="available-images-wrapper">
                    <div class="available-images-box">
                      <img :src="defaultImageUrl" alt="Default slika knjige" class="available-image" />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButtons from '@/components/ActionButtons.vue'
import axios from '@/axios'

const tab = ref('one')
const isSaving = ref(false)
const fileInput = ref(null)
const router = useRouter()
const route = useRoute()
const form = ref(null)
const imageUrl = ref('')
const selectedFile = ref(null)
const showErrors = ref(false)
const globalError = ref('')
const defaultImageUrl = ref('/images/default-book-1.jpg')

const book = reactive({
  id: null,
  name: '',
  description: '',
  number_of_copies_available: null,
  number_of_pages: null,
  publication_year: null,
  script: '',
  binding: '',
  dimensions: '',
  language: '',
  isbn: '',
  categories: [],
  genres: [],
  authors: [],
  publisher_id: null,
  image_url: ''
})

const uniqueCategories = ref({ data: [] })
const uniqueGenres = ref({ data: [] })
const uniqueAuthors = ref({ data: [] })
const uniquePublishers = ref({ data: [] })

const SCRIPT_OPTIONS = [
  { title: 'Ćirilica', value: 'cyrillic' },
  { title: 'Latinica', value: 'latin' },
  { title: 'Arapsko pismo', value: 'arabic' }
]
const BINDING_OPTIONS = [
  { title: 'Tvrdi povez', value: 'hardcover' },
  { title: 'Meki povez', value: 'paperback' },
  { title: 'Spiralni povez', value: 'spiral-bound' }
]
const DIMENSIONS_OPTIONS = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
  '21cm x 29.7cm',
  '15cm x 21cm',
  '29.7cm x 42cm',
  '42cm x 59.4cm',
  '59.4cm x 84.1cm'
]
const LANGUAGE_OPTIONS = [
  { title: 'Crnogorski', value: 'crnogorski' },
  { title: 'Engleski', value: 'engleski' },
  { title: 'Srpski', value: 'srpski' },
  { title: 'Hrvatski', value: 'hrvatski' },
  { title: 'Bosanski', value: 'bosanski' },
  { title: 'Ostalo', value: 'ostalo' }
]

onMounted(async () => {
  await fetchRelatedData()
  await fetchBookData()
})

async function fetchRelatedData() {
  try {
    const [categoriesRes, genresRes, authorsRes, publishersRes] = await Promise.all([
      axios.get('/categories'),
      axios.get('/genres'),
      axios.get('/authors?per_page=100'),
      axios.get('/publishers?per_page=100')
    ])
    if (categoriesRes?.data?.categories?.data) uniqueCategories.value.data = categoriesRes.data.categories.data
    if (genresRes?.data?.genres?.data) uniqueGenres.value.data = genresRes.data.genres.data
    if (authorsRes?.data?.data?.data) uniqueAuthors.value.data = authorsRes.data.data.data.map(author => ({
      ...author,
      name: `${author.first_name} ${author.last_name}`
    }))
    if (publishersRes?.data?.publishers?.data) uniquePublishers.value.data = publishersRes.data.publishers.data
  } catch (err) {
    globalError.value = 'Greška pri učitavanju podataka za padajuće liste!'
  }
}

async function fetchBookData() {
  const bookId = route.params.id
  if (!bookId) {
    globalError.value = 'Nije prosleđen ID knjige.'
    return
  }
  try {
    const response = await axios.get(`/books/${bookId}`)
    const data = response.data.book || response.data.data || response.data
    book.id = bookId
    book.name = data.name || ''
    book.description = data.description || ''
    book.number_of_copies_available = data.number_of_copies_available ?? null
    book.number_of_pages = data.number_of_pages ?? null
    book.publication_year = data.publication_year ?? null
    book.isbn = data.isbn || ''
    book.script = data.script || ''
    book.binding = data.binding || ''
    book.dimensions = data.dimensions || ''
    book.language = data.language || ''
    book.publisher_id = data.publisher_id ?? null
    book.image_url = data.image_url || ''
    if (data.categories) book.categories = Array.isArray(data.categories) ? data.categories.map(c => c.id ?? c) : (data.categories ?? [])
    if (data.genres) book.genres = Array.isArray(data.genres) ? data.genres.map(g => g.id ?? g) : (data.genres ?? [])
    if (data.authors) book.authors = Array.isArray(data.authors) ? data.authors.map(a => a.id ?? a) : (data.authors ?? [])
    if (data.image_url) {
      imageUrl.value = data.image_url
    } else {
      imageUrl.value = ''
    }
  } catch (err) {
    globalError.value = 'Greška pri dobijanju podataka o knjizi!'
    imageUrl.value = ''
  }
}

const triggerFileInput = () => fileInput.value.click()

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

const validIsbn = computed(() => {
  const isbnCleaned = (book.isbn || '').replace(/[- ]/g, '')
  if (!isbnCleaned) return false
  if (isbnCleaned.length === 10) {
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(isbnCleaned[i]) * (10 - i)
    const lastChar = isbnCleaned[9]
    sum += ((lastChar === 'X' || lastChar === 'x') ? 10 : parseInt(lastChar))
    return (sum % 11 === 0)
  } else if (isbnCleaned.length === 13) {
    let sum = 0
    for (let i = 0; i < 12; i++) sum += parseInt(isbnCleaned[i]) * (i % 2 === 0 ? 1 : 3)
    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit === parseInt(isbnCleaned[12])
  }
  return false
})

const hasErrorsOnFirstTab = computed(() => {
  return (
    !book.name ||
    !book.description ||
    !book.publisher_id ||
    book.authors.length === 0 ||
    !book.publication_year ||
    book.publication_year <= 0 ||
    !book.number_of_copies_available ||
    book.number_of_copies_available <= 0
  )
})
const hasErrorsOnSecondTab = computed(() => {
  return (
    !book.number_of_pages ||
    book.number_of_pages <= 0 ||
    !book.isbn ||
    !validIsbn.value
  )
})

async function validateAndSave() {
  showErrors.value = true
  globalError.value = ''
  if (hasErrorsOnFirstTab.value) {
    tab.value = 'one'
    globalError.value = 'Molimo popunite sva obavezna polja na kartici "Osnovni Detalji"!'
    return
  }
  if (hasErrorsOnSecondTab.value) {
    tab.value = 'two'
    globalError.value = 'Molimo popunite sva obavezna polja na kartici "Specifikacija"!'
    return
  }
  await saveBook()
}

async function saveBook() {
  isSaving.value = true
  globalError.value = ''
  const bookId = route.params.id
  if (!bookId) {
    globalError.value = 'Nije prosleđen ID knjige.'
    isSaving.value = false
    return
  }
  try {
    const formData = new FormData()
    formData.append('name', book.name)
    formData.append('description', book.description)
    formData.append('number_of_pages', book.number_of_pages)
    formData.append('number_of_copies_available', book.number_of_copies_available)
    formData.append('publication_year', book.publication_year)
    formData.append('isbn', book.isbn)
    if (book.language) formData.append('language', book.language)
    if (book.script) formData.append('script', book.script)
    if (book.binding) formData.append('binding', book.binding)
    if (book.dimensions) formData.append('dimensions', book.dimensions)
    if (book.publisher_id) formData.append('publisher_id', book.publisher_id)
    if (book.categories && book.categories.length > 0) book.categories.forEach((id, index) => formData.append(`categories[${index}]`, id))
    if (book.genres && book.genres.length > 0) book.genres.forEach((id, index) => formData.append(`genres[${index}]`, id))
    if (book.authors && book.authors.length > 0) book.authors.forEach((id, index) => formData.append(`authors[${index}]`, id))
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }
    await axios.post(`/books/${bookId}/update?_method=PATCH`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
    })
    router.push(`/book/${bookId}`)
  } catch (error) {
    if (error.response) {
      if (error.response.status === 422 && error.response.data?.errors) {
        const errors = error.response.data.errors
        let errorMessage = 'Molimo ispravite sljedeće greške:\n'
        for (const key in errors) {
          errorMessage += Array.isArray(errors[key]) ? `- ${errors[key].join(', ')}\n` : `- ${errors[key]}\n`
        }
        globalError.value = errorMessage
      } else if (error.response.data?.message) {
        globalError.value = error.response.data.message
      } else {
        globalError.value = `Greška servera (${error.response.status}). Molimo pokušajte ponovo.`
      }
    } else if (error.request) {
      globalError.value = 'Nema odgovora od servera. Molimo proverite konekciju.'
    } else {
      globalError.value = error.message || 'Neočekivana greška pri čuvanju knjige.'
    }
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  router.push('/books')
}

const fieldStyle = { width: '724px', height: '48px' }
const textareaStyle = { width: '724px', height: '160px' }
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
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
  line-height: 100%;
  letter-spacing: 0.15px;
  vertical-align: middle;
  margin: 0;
}

.breadcrumbs {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  font-family: 'Roboto', sans-serif;
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link {
  color: #1976d2;
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #666;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 13px;
  margin-bottom: 24px;
}

.page-content {
  padding: 0 24px;
  flex-grow: 1;
}

.form-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.custom-tabs {
  margin-left: 20px;
  margin-top: -18px;
  margin-bottom: -10px;
  width: 414px;
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
.custom-tab.third-tab { width: 114px; }

.custom-tabs :deep(.v-tab--selected) {
  color: #3392ea;
  font-weight: 400;
}

.form-content {
  width: 724px;
  min-height: 660px;
  margin-top: 5px;
  transition: min-height 0.3s;
}

.form-content--error {
  min-height: 856px !important;
}

.photo-upload-wrapper {
  width: 724px;
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

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
}

.available-images-wrapper {
  width: 724px;
  height: 234px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.available-images-box {
  width: 200px;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.available-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.custom-error {
  color: #cf2a27;
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0.4px;
  vertical-align: middle;
  margin-top: 2px;
  margin-left: 4px;
}

.form-actions {
  padding: 16px 0 0 0;
  border-top: none;
  display: flex;
  justify-content: flex-end;
  width: 100%;
  background: transparent;
}

.field-wrapper {
  margin-bottom: 18px;
  position: relative;
}
</style>