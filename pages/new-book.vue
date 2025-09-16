<template>
  <div class="page bg-white min-h-screen">
    <header class="app-header">
      <div>
        <h1 class="page-title">Nova knjiga</h1>
        <p class="page-subtitle">
          <span class="link" @click="router.push('/books')"
            >Evidencija knjiga</span
          >
          / Nova knjiga
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
                :class="{
                  'form-content--error': showErrors && hasErrorsOnFirstTab,
                }"
              >
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.name"
                    label="Unesite naziv knjige*"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.name"
                    hide-details="auto"
                    color="primary"
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
                    color="primary"
                  />
                  <div
                    v-if="showErrors && !book.description"
                    class="custom-error"
                  >
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
                    color="primary"
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
                    color="primary"
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
                    color="primary"
                  />
                  <div
                    v-if="showErrors && book.authors.length === 0"
                    class="custom-error"
                  >
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
                    color="primary"
                  />
                  <div
                    v-if="showErrors && !book.publisher_id"
                    class="custom-error"
                  >
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
                    :error="
                      showErrors &&
                      (!book.publication_year || book.publication_year <= 0)
                    "
                    hide-details="auto"
                    color="primary"
                  />
                  <div
                    v-if="
                      showErrors &&
                      (!book.publication_year || book.publication_year <= 0)
                    "
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
                    :error="
                      showErrors &&
                      (!book.number_of_copies_available ||
                        book.number_of_copies_available <= 0)
                    "
                    hide-details="auto"
                    color="primary"
                  />
                  <div
                    v-if="
                      showErrors &&
                      (!book.number_of_copies_available ||
                        book.number_of_copies_available <= 0)
                    "
                    class="custom-error"
                  >
                    Morate unijeti pozitivnu količinu!
                  </div>
                </div>

                <div class="form-actions">
                  <ActionButtons
                    @save="validateAndSave"
                    @cancel="cancel"
                    :loading="isSaving"
                  />
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
                    :error="
                      showErrors &&
                      (!book.number_of_pages || book.number_of_pages <= 0)
                    "
                    hide-details="auto"
                    color="primary"
                  />
                  <div
                    v-if="
                      showErrors &&
                      (!book.number_of_pages || book.number_of_pages <= 0)
                    "
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
                    color="primary"
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
                    color="primary"
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
                    color="primary"
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
                    color="primary"
                  />
                </div>

                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.isbn"
                    label="ISBN*"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.isbn"
                    hide-details="auto"
                    color="primary"
                  />
                  <div v-if="showErrors && !book.isbn" class="custom-error">
                    Morate unijeti ISBN!
                  </div>
                </div>

                <div class="form-actions">
                  <ActionButtons
                    @save="validateAndSave"
                    @cancel="cancel"
                    :loading="isSaving"
                  />
                </div>
              </div>
            </v-window-item>

            <v-window-item value="three">
              <div class="tab-content form-content">
                <div class="field-wrapper">
                  <div class="photo-upload-box" @click="triggerFileInput">
                    <v-icon v-if="!imageUrl" size="large" color="#757575"
                      >mdi-image</v-icon
                    >
                    <input
                      type="file"
                      ref="fileInput"
                      accept="image/*"
                      @change="handleFileUpload"
                      style="display: none"
                    />
                    <div v-if="!imageUrl" class="upload-text">
                      Dodaj sliku knjige
                    </div>
                    <img
                      v-if="imageUrl"
                      :src="imageUrl"
                      class="image-preview"
                      alt="Slika knjige"
                    />
                  </div>
                </div>

                <div class="form-actions">
                  <ActionButtons
                    @save="validateAndSave"
                    @cancel="cancel"
                    :loading="isSaving"
                  />
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-form>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="errorSnackbar.show" color="error" :timeout="5000" top>
      {{ errorSnackbar.text }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="errorSnackbar.show = false">
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="successSnackbar.show"
      color="primary"
      :timeout="3000"
      bottom
    >
      {{ successSnackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="successSnackbar.show = false"
        >
          Zatvori
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth', 'auth-librarian'],
})
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ActionButtons from '~/components/action-buttons.vue'
import axios from '@/axios'

const tab = ref('one')
const isSaving = ref(false)
const fileInput = ref(null)
const router = useRouter()
const form = ref(null)
const imageUrl = ref('')
const selectedFile = ref(null)
const showErrors = ref(false)

const errorSnackbar = ref({
  show: false,
  text: '',
})

const successSnackbar = ref({
  show: false,
  text: '',
})

const book = reactive({
  name: '',
  description: '',
  number_of_copies_available: null,
  number_of_pages: null,
  publication_year: null,
  script: null,
  binding: null,
  dimensions: 'A1',
  language: 'crnogorski',
  isbn: '',
  categories: [],
  genres: [],
  authors: [],
  publisher_id: null,
})

const uniqueCategories = ref({ data: [] })
const uniqueGenres = ref({ data: [] })
const uniqueAuthors = ref({ data: [] })
const uniquePublishers = ref({ data: [] })

const SCRIPT_OPTIONS = [
  { title: 'Ćirilica', value: 'Ćirilica' },
  { title: 'Latinica', value: 'Latinica' },
  { title: 'Arapsko pismo', value: 'Arapsko pismo' },
]

const BINDING_OPTIONS = [
  { title: 'Tvrdi povez', value: 'Tvrdi povez' },
  { title: 'Meki povez', value: 'Meki povez' },
  { title: 'Spiralni povez', value: 'Spiralni povez' },
]
const DIMENSIONS_OPTIONS = ['A1', 'A2', '21cm x 29.7cm', '15cm x 21cm']

const LANGUAGE_OPTIONS = [
  { title: 'Crnogorski', value: 'crnogorski' },
  { title: 'Engleski', value: 'engleski' },
  { title: 'Srpski', value: 'srpski' },
]

onMounted(() => {
  fetchRelatedData()
})

async function fetchRelatedData() {
  try {
    const [categoriesRes, genresRes, authorsRes, publishersRes] =
      await Promise.all([
        axios.get('/categories'),
        axios.get('/genres'),
        axios.get('/authors?per_page=100'),
        axios.get('/publishers?per_page=100'),
      ])

    uniqueCategories.value.data = categoriesRes.data.categories.data
    uniqueGenres.value.data = genresRes.data.genres.data
    uniqueAuthors.value.data = authorsRes.data.data.data.map((a) => ({
      ...a,
      name: `${a.first_name} ${a.last_name}`,
    }))

    uniquePublishers.value.data = publishersRes.data.publishers.data.map(
      (p) => ({
        name: p.publisher_name,
        id: p.publisher_id,
      })
    )
  } catch (error) {
    console.error('Greška pri učitavanju podataka:', error)
    const errorMessage =
      error.response?.data?.message ||
      'Greška pri učitavanju podataka za padajuće liste.'
    showErrorSnackbar(errorMessage)
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
  return !book.number_of_pages || book.number_of_pages <= 0 || !book.isbn
})

async function validateAndSave() {
  showErrors.value = true
  errorSnackbar.value.show = false

  if (hasErrorsOnFirstTab.value) {
    tab.value = 'one'
    showErrorSnackbar('Molimo ispunite sva obavezna polja na prvom koraku.')
    return
  }
  if (hasErrorsOnSecondTab.value) {
    tab.value = 'two'
    showErrorSnackbar('Molimo ispunite sva obavezna polja na drugom koraku.')
    return
  }
  await saveBook()
}

async function saveBook() {
  isSaving.value = true
  errorSnackbar.value.show = false

  const formData = new FormData()

  formData.append('name', book.name)
  formData.append('description', book.description)
  formData.append('number_of_copies_available', book.number_of_copies_available)
  formData.append('number_of_pages', book.number_of_pages)
  formData.append('publication_year', book.publication_year)
  formData.append('isbn', book.isbn)

  if (book.script) formData.append('script', book.script)
  if (book.binding) formData.append('binding', book.binding)
  if (book.dimensions) formData.append('dimensions', book.dimensions)
  if (book.language) formData.append('language', book.language)

  if (book.publisher_id) formData.append('publisher_id', book.publisher_id)

  if (book.authors && book.authors.length > 0) {
    book.authors.forEach((id) => formData.append('authors[]', id))
  }
  if (book.genres && book.genres.length > 0) {
    book.genres.forEach((id) => formData.append('genres[]', id))
  }
  if (book.categories && book.categories.length > 0) {
    book.categories.forEach((id) => formData.append('categories[]', id))
  }

  if (selectedFile.value) {
    formData.append('images[]', selectedFile.value)
    formData.append('image_types[]', 'front_cover')
  }

  try {
    const response = await axios.post('/books/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    successSnackbar.value.text = 'Knjiga je uspješno kreirana'
    successSnackbar.value.show = true

    setTimeout(() => {
      const bookId = response.data?.book?.id
      if (bookId) {
        router.push(`/book/${bookId}`)
      } else {
        router.push('/books')
      }
    }, 1000)
  } catch (error) {
    console.error('Greška pri čuvanju knjige:', error)
    let errorMessage =
      'Došlo je do neočekivane greške na serveru. Pokušajte ponovo.'
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      const errorMessages = Object.values(errors).flat()
      errorMessage = `Validacijska greška: ${errorMessages.join(', ')}`
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    showErrorSnackbar(errorMessage)
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  router.push('/books')
}

function showErrorSnackbar(message) {
  errorSnackbar.value.text = message
  errorSnackbar.value.show = true
}

const fieldStyle = { width: '724px', height: '48px' }
const textareaStyle = { width: '724px', height: '160px' }
</script>

<style scoped>
/* Vaši stilovi ostaju nepromenjeni */
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

/* Ažurirani stilovi za photo-upload-box */
.photo-upload-box {
  width: 724px;
  height: 234px;
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
