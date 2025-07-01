<template>
  <div class="header">
    <h1>Nova knjiga</h1>
    <div class="breadcrumbs">
      <a href="/books">Evidencija knjiga</a>
      <span>/ Nova knjiga</span>
    </div>
  </div>
  <v-card class="form-card">
    <v-tabs v-model="tab" class="tabs">
      <v-tab value="one">Osnovni Detalji</v-tab>
      <v-tab value="two">Specifikacija</v-tab>
      <v-tab value="three">Multimedia</v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <!-- Prvi tab - Osnovni detalji (smanjena visina) -->
        <v-window-item value="one" class="tab-content tab-one">
          <v-text-field
            v-model="book.title"
            label="Unesite naziv knjige..."
            variant="outlined"
            hide-details
            class="form-field"
          ></v-text-field>

          <v-textarea
            v-model="book.summary"
            label="Unesite kratak sadržaj knjige..."
            variant="outlined"
            hide-details
            rows="5"
            class="form-field textarea-field"
          ></v-textarea>

          <v-autocomplete
            v-model="book.categories"
            clearable
            label="Izaberite kategoriju"
            :items="uniqueCategories"
            multiple
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.genres"
            clearable
            label="Izaberite žanr"
            :items="uniqueGenres"
            multiple
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.authors"
            clearable
            label="Izaberite autore"
            :items="uniqueAuthors"
            multiple
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.publisher"
            clearable
            label="Izaberite izdavača"
            :items="uniquePublishers"
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-select
            v-model="book.publicationYear"
            label="Izaberite godinu izdavanja"
            :items="years"
            variant="outlined"
            class="form-field"
          ></v-select>

          <v-text-field
            v-model="book.quantity"
            label="Unesite količinu..."
            variant="outlined"
            type="number"
            hide-details
            class="form-field"
          ></v-text-field>
        </v-window-item>

        <!-- Drugi tab - Specifikacija (724x384) -->
        <v-window-item value="two" class="tab-content tab-two">
          <v-text-field
            v-model="book.pageCount"
            label="Unesite broj strana"
            variant="outlined"
            type="number"
            class="form-field"
          ></v-text-field>

          <v-autocomplete
            v-model="book.fontType"
            label="Izaberite vrstu pisma"
            :items="['ćirilica', 'latinica', 'ostalo']"
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.bindingType"
            label="Izaberite vrstu poveza"
            :items="['Tvrdi povez', 'Meki povez']"
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.format"
            label="Izaberite vrstu formata"
            :items="['A3', 'A4', 'A5', '21x29cm', '15x21cm']"
            variant="outlined"
            class="form-field"
          ></v-autocomplete>

          <v-text-field
            v-model="book.isbn"
            label="Unesite ISBN"
            variant="outlined"
            class="form-field"
          ></v-text-field>
          <div class="text-caption text-grey mb-4">
            International Standard Book Number
          </div>
        </v-window-item>

        <!-- Treći tab - Multimedia (724x286) -->
        <v-window-item value="three" class="tab-content tab-three">
          <v-card
            variant="outlined"
            class="drop-zone pa-8 text-center"
            @dragover.prevent
            @drop="handleDrop"
            @click="$refs.fileInput.click()"
          >
            <v-icon size="64" color="grey-lighten-1">mdi-cloud-upload</v-icon>
            <div class="text-h6 mt-2">
              Prevucite fajlove ovde ili kliknite na ovu oblast
            </div>

            <input
              ref="fileInput"
              type="file"
              multiple
              style="display: none"
              @change="handleFileSelect"
            />
          </v-card>

          <div v-if="book.files && book.files.length" class="mt-4">
            <div
              v-for="(file, index) in book.files"
              :key="index"
              class="d-flex align-center mb-2"
            >
              <v-icon class="mr-2">mdi-file</v-icon>
              <span>{{ file.name }}</span>
              <v-spacer></v-spacer>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click.stop="removeFile(index)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>

    <v-card-actions class="d-flex justify-end pa-4">
      <ActionButtons 
        @save="saveBook" 
        @cancel="cancel"
        :loading="isSaving"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import ActionButtons from '@/components/ActionButtons.vue'

const tab = ref('one')
const isSaving = ref(false)
const fileInput = ref(null)

const book = reactive({
  title: '',
  summary: '',
  categories: [],
  genres: [],
  authors: [],
  publisher: '',
  publicationYear: '',
  quantity: 0,
  pageCount: null,
  fontType: '',
  bindingType: '',
  format: '',
  isbn: '',
  files: []
})

// Podaci iz baze
const uniqueCategories = ref([])
const uniqueGenres = ref([])
const uniqueAuthors = ref([])
const uniquePublishers = ref([])
const years = ref([])

const supabase = useSupabaseClient()

// Učitavanje podataka iz tabele knjige
async function fetchBookData() {
  try {
    const { data: books, error } = await supabase
      .from('knjige')
      .select('kategorija, zanr, autor, izdavac, godina_izdavanja')
    
    if (error) throw error

    uniqueCategories.value = [...new Set(books.map(b => b.kategorija).filter(Boolean))]
    uniqueGenres.value = [...new Set(books.map(b => b.zanr).filter(Boolean))]
    uniqueAuthors.value = [...new Set(books.map(b => b.autor).filter(Boolean))]
    uniquePublishers.value = [...new Set(books.map(b => b.izdavac).filter(Boolean))]

    const currentYear = new Date().getFullYear()
    years.value = Array.from({ length: 100 }, (_, i) => currentYear - i)
  } catch (error) {
    console.error('Greška pri učitavanju podataka:', error)
  }
}

onMounted(() => {
  fetchBookData()
})

function handleDrop(e) {
  e.preventDefault()
  book.files.push(...Array.from(e.dataTransfer.files))
}

function handleFileSelect(e) {
  book.files.push(...Array.from(e.target.files))
  e.target.value = ''
}

function removeFile(index) {
  book.files.splice(index, 1)
}

async function saveBook() {
  isSaving.value = true
  try {
    console.log('Sačuvana knjiga:', JSON.parse(JSON.stringify(book)))
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  Object.assign(book, {
    title: '',
    summary: '',
    categories: [],
    genres: [],
    authors: [],
    publisher: '',
    publicationYear: '',
    quantity: 0,
    pageCount: null,
    fontType: '',
    bindingType: '',
    format: '',
    isbn: '',
    files: []
  })
}
</script>

<style scoped>
.header {
  margin-bottom: 16px;
}

.breadcrumbs {
  font-size: 0.9rem;
  color: #666;
}

.breadcrumbs a {
  color: #1976d2;
  text-decoration: none;
  margin-right: 6px;
}

.form-card {
  width: 724px;
  min-height: 856px;
  padding: 24px;
  box-sizing: border-box;
}

.tabs {
  margin-bottom: 16px; /* Smanjena margina ispod tabova */
}

.tab-content {
  overflow-y: auto;
}

.tab-one {
  height: 600px; /* Smanjena visina prvog taba */
  padding-top: 8px; /* Dodatni padding na vrhu */
}

.tab-two {
  height: 384px;
}

.tab-three {
  height: 286px;
}

.form-field {
  height: 48px;
  margin-bottom: 12px; /* Smanjena margina između polja */
}

.textarea-field {
  height: 160px !important;
  margin-bottom: 12px; /* Smanjena margina ispod textarea */
}

.drop-zone {
  border: 2px dashed #bbb;
  cursor: pointer;
  user-select: none;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
}
</style>