<template>
  <div class="page">
    <div class="header">
      <h1>Nova knjiga</h1>
      <div class="breadcrumbs">
        <a href="/books">Evidencija knjiga</a>
        <span>/ Nova knjiga</span>
      </div>
    </div>

    <v-card class="form-card">
      <v-tabs v-model="tab" class="custom-tabs" grow slider-color="#3392EA">
        <v-tab value="one" class="custom-tab first-tab">Osnovni Detalji</v-tab>
        <v-tab value="two" class="custom-tab second-tab">Specifikacija</v-tab>
        <v-tab value="three" class="custom-tab third-tab">Multimedia</v-tab>
      </v-tabs>

      <v-card-text>
        <v-form ref="form">
          <v-window v-model="tab">
            <v-window-item value="one">
              <div
                class="tab-content form-content"
                :class="{ 'form-content--error': showErrors && hasErrorsOnFirstTab }"
              >
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
import ActionButtons from '@/components/ActionButtons.vue'
import axios from '@/axios'

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
  script: '',
  binding: '',
  dimensions: '',
  language: '',
  isbn: '',
  categories: [],
  genres: [],
  authors: [],
  publisher_id: null
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

onMounted(() => {
  fetchRelatedData()
})

async function fetchRelatedData() {
  console.log('Započeto učitavanje podataka za padajuće liste...')
  try {
    const [categoriesRes, genresRes, authorsRes, publishersRes] = await Promise.all([
      axios.get('/categories'),
      axios.get('/genres'),
      axios.get('/authors?per_page=100'),
      axios.get('/publishers?per_page=100')
    ])

    // Obrada KATEGORIJA
    if (categoriesRes?.data?.categories?.data && Array.isArray(categoriesRes.data.categories.data)) {
      uniqueCategories.value.data = categoriesRes.data.categories.data
      console.log('Kategorije uspešno učitane:', uniqueCategories.value.data)
    } else {
      console.warn('Podaci za kategorije nisu u očekivanom formatu (očekuje se .data.categories.data). Response:', categoriesRes.data)
      uniqueCategories.value.data = []
    }

    // Obrada ŽANROVA
    if (genresRes?.data?.genres?.data && Array.isArray(genresRes.data.genres.data)) {
      uniqueGenres.value.data = genresRes.data.genres.data
      console.log('Žanrovi uspešno učitani:', uniqueGenres.value.data)
    } else {
      console.warn('Podaci za žanrove nisu u očekivanom formatu (očekuje se .data.genres.data). Response:', genresRes.data)
      uniqueGenres.value.data = []
    }

    // Obrada AUTORA - ISPRAVLJENO
    if (authorsRes?.data?.data?.data && Array.isArray(authorsRes.data.data.data)) {
      uniqueAuthors.value.data = authorsRes.data.data.data.map(author => ({
        ...author,
        name: `${author.first_name} ${author.last_name}`
      }))
      console.log('Autori uspešno učitani:', uniqueAuthors.value.data)
    } else {
      console.warn('Podaci za autore nisu u očekivanom formatu. Response:', authorsRes.data)
      uniqueAuthors.value.data = []
    }

    // Obrada IZDAVAČA
    if (publishersRes?.data?.publishers?.data && Array.isArray(publishersRes.data.publishers.data)) {
      uniquePublishers.value.data = publishersRes.data.publishers.data
      console.log('Izdavači uspešno učitani:', uniquePublishers.value.data)
    } else {
      console.warn('Podaci za izdavače nisu u očekivanom formatu (očekuje se .data.publishers.data). Response:', publishersRes.data)
      uniquePublishers.value.data = []
    }

    console.log('Svi podaci za padajuće liste su obrađeni.')
  } catch (error) {
    globalError.value = 'Greška pri učitavanju podataka za padajuće liste!'
    console.error('Greška pri učitavanju podataka:', error.response || error.message || error)
    uniqueCategories.value.data = []
    uniqueGenres.value.data = []
    uniqueAuthors.value.data = []
    uniquePublishers.value.data = []
  }
}

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

const validIsbn = computed(() => {
  const isbnCleaned = (book.isbn || '').replace(/[- ]/g, '')
  if (!isbnCleaned) return false

  if (isbnCleaned.length === 10) {
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbnCleaned[i]) * (10 - i)
    }
    const lastChar = isbnCleaned[9]
    sum += ((lastChar === 'X' || lastChar === 'x') ? 10 : parseInt(lastChar))
    return (sum % 11 === 0)
  } else if (isbnCleaned.length === 13) {
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(isbnCleaned[i]) * (i % 2 === 0 ? 1 : 3)
    }
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

  try {
    const formData = new FormData()

    // Dodavanje osnovnih polja
    formData.append('name', book.name)
    formData.append('description', book.description)
    formData.append('number_of_pages', book.number_of_pages)
    formData.append('number_of_copies_available', book.number_of_copies_available)
    formData.append('publication_year', book.publication_year)
    formData.append('isbn', book.isbn)

    // Dodavanje opcionih polja samo ako su popunjena
    if (book.language) formData.append('language', book.language)
    if (book.script) formData.append('script', book.script)
    if (book.binding) formData.append('binding', book.binding)
    if (book.dimensions) formData.append('dimensions', book.dimensions)

    // Publisher ID
    if (book.publisher_id) {
      formData.append('publisher_id', book.publisher_id)
    }

    // Dodavanje arrays - koristimo standardan format za Laravel
    if (book.categories && book.categories.length > 0) {
      book.categories.forEach((id, index) => {
        formData.append(`categories[${index}]`, id)
      })
    }
    
    if (book.genres && book.genres.length > 0) {
      book.genres.forEach((id, index) => {
        formData.append(`genres[${index}]`, id)
      })
    }
    
    if (book.authors && book.authors.length > 0) {
      book.authors.forEach((id, index) => {
        formData.append(`authors[${index}]`, id)
      })
    }

    // Dodavanje slike
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    console.log('Šalje se zahtev na /books/create endpoint...')
    
    // ISPRAVKA: Vraćen na originalni endpoint /books/create
    const response = await axios.post('/books/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })

    console.log('Odgovor servera:', response)

    // Proveravamo različite moguće strukture odgovora
    let bookId = null
    if (response.data?.book?.id) {
      bookId = response.data.book.id
    } else if (response.data?.data?.id) {
      bookId = response.data.data.id
    } else if (response.data?.id) {
      bookId = response.data.id
    }

    if (bookId) {
      console.log('Knjiga je uspešno kreirana sa ID:', bookId)
      router.push(`/book/${bookId}`)
    } else {
      console.log('Knjiga je kreirana, redirektovanje na listu knjiga...')
      router.push('/books')
    }

  } catch (error) {
    console.error('Greška pri čuvanju knjige:', error)
    
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
      
      if (error.response.status === 422 && error.response.data?.errors) {
        // Validation errors
        const errors = error.response.data.errors
        let errorMessage = 'Molimo ispravite sljedeće greške:\n'
        for (const key in errors) {
          if (Array.isArray(errors[key])) {
            errorMessage += `- ${errors[key].join(', ')}\n`
          } else {
            errorMessage += `- ${errors[key]}\n`
          }
        }
        globalError.value = errorMessage
      } else if (error.response.status === 405) {
        globalError.value = 'Endpoint /books/create ne postoji ili ne podržava POST metodu. Molimo proverite API rutu.'
      } else if (error.response.status === 401) {
        globalError.value = 'Nemate dozvolu za ovu akciju. Molimo proverite autentifikaciju.'
      } else if (error.response.data?.message) {
        globalError.value = error.response.data.message
      } else {
        globalError.value = `Greška servera (${error.response.status}). Molimo pokušajte ponovo.`
      }
    } else if (error.request) {
      globalError.value = 'Nema odgovora od servera. Molimo proverite internetsku konekciju.'
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

const fieldStyle = {
  width: '724px',
  height: '48px'
}

const textareaStyle = {
  width: '724px',
  height: '160px'
}
</script>

<style scoped>
.header {
  margin-top: 12px;
  margin-left: 24px;
}

.header h1 {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 8px;
}

.breadcrumbs {
  font-size: 14px;
  color: #666;
}

.breadcrumbs a {
  color: #1976d2;
  text-decoration: none;
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
  line-height: 100%;
  letter-spacing: 1.25px;
  text-align: center;
  vertical-align: middle;
  text-transform: none;
  color: #666;
}

.custom-tab.first-tab {
  width: 143px;
}

.custom-tab.second-tab {
  width: 125px;
}

.custom-tab.third-tab {
  width: 114px;
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