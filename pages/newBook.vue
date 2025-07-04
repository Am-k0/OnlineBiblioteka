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
            <!-- Prvi tab -->
            <v-window-item value="one">
              <div class="tab-content form-content"
                :class="{ 'form-content--error': showErrors && hasErrorsOnFirstTab }"
              >
                <div v-if="globalError" class="custom-error" style="font-weight:bold;">{{ globalError }}</div>
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.naziv_knjige"
                    label="Unesite naziv knjige*"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.naziv_knjige"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.naziv_knjige" class="custom-error">Morate unijeti naziv knjige!</div>
                </div>
                <div class="field-wrapper">
                  <v-textarea
                    v-model="book.kratak_sadrzaj"
                    label="Unesite kratak sadržaj knjige"
                    variant="outlined"
                    :style="textareaStyle"
                    rows="3"
                    hide-details="auto"
                  />
                </div>
                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.kategorija"
                    label="Izaberite kategoriju*"
                    :items="uniqueCategories"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.kategorija"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.kategorija" class="custom-error">Morate izabrati kategoriju!</div>
                </div>
                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.zanr"
                    label="Izaberite žanr*"
                    :items="uniqueGenres"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.zanr"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.zanr" class="custom-error">Morate izabrati žanr!</div>
                </div>
                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.autor"
                    label="Izaberite autora*"
                    :items="uniqueAuthors"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.autor"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.autor" class="custom-error">Morate izabrati autora!</div>
                </div>
                <div class="field-wrapper">
                  <v-autocomplete
                    v-model="book.izdavac"
                    label="Izaberite izdavača*"
                    :items="uniquePublishers"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.izdavac"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.izdavac" class="custom-error">Morate izabrati izdavača!</div>
                </div>
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.godina_izdavanja"
                    label="Godina izdavanja*"
                    type="date"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.godina_izdavanja"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.godina_izdavanja" class="custom-error">Morate unijeti godinu izdavanja!</div>
                </div>
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.ukupna_kolicina"
                    label="Ukupna količina*"
                    type="number"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && (!book.ukupna_kolicina || book.ukupna_kolicina <= 0)"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && (!book.ukupna_kolicina || book.ukupna_kolicina <= 0)" class="custom-error">Morate unijeti pozitivnu količinu!</div>
                </div>
                <div class="form-actions">
                  <ActionButtons @save="validateAndSave" @cancel="cancel" :loading="isSaving" />
                </div>
              </div>
            </v-window-item>
            <!-- Drugi tab -->
            <v-window-item value="two">
              <div class="tab-content form-content">
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.broj_stranica"
                    label="Broj stranica*"
                    type="number"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && (!book.broj_stranica || book.broj_stranica <= 0)"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && (!book.broj_stranica || book.broj_stranica <= 0)" class="custom-error">Morate unijeti broj stranica!</div>
                </div>
                <div class="field-wrapper">
                  <v-select
                    v-model="book.pismo"
                    label="Vrsta pisma*"
                    :items="[
                      { title: 'Ćirilica', value: 'ćirilica' },
                      { title: 'Latinica', value: 'latinica' },
                      { title: 'Ostalo', value: 'ostalo' }
                    ]"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.pismo"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.pismo" class="custom-error">Morate izabrati vrstu pisma!</div>
                </div>
                <div class="field-wrapper">
                  <v-select
                    v-model="book.povez"
                    label="Vrsta poveza*"
                    :items="[
                      { title: 'Tvrdi povez', value: 'tvrdi povez' },
                      { title: 'Meki povez', value: 'meki povez' }
                    ]"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.povez"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.povez" class="custom-error">Morate izabrati vrstu poveza!</div>
                </div>
                <div class="field-wrapper">
                  <v-select
                    v-model="book.format"
                    label="Format*"
                    :items="['A3', 'A4', 'A5', '21x29cm', '15x21cm']"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.format"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.format" class="custom-error">Morate izabrati format!</div>
                </div>
                <div class="field-wrapper">
                  <v-select
                    v-model="book.jezik"
                    label="Jezik*"
                    :items="[
                      { title: 'Crnogorski', value: 'crnogorski' },
                      { title: 'Engleski', value: 'engleski' },
                      { title: 'Ostalo', value: 'ostalo' }
                    ]"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !book.jezik"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.jezik" class="custom-error">Morate izabrati jezik!</div>
                </div>
                <div class="field-wrapper">
                  <v-text-field
                    v-model="book.isbn"
                    label="ISBN*"
                    variant="outlined"
                    :style="fieldStyle"
                    :error="showErrors && !validIsbn"
                    hide-details="auto"
                  />
                  <div v-if="showErrors && !book.isbn" class="custom-error">Morate unijeti ISBN!</div>
                  <div v-else-if="showErrors && book.isbn && !validIsbn" class="custom-error">Nevažeći ISBN format!</div>
                </div>
                <div class="form-actions">
                  <ActionButtons @save="validateAndSave" @cancel="cancel" :loading="isSaving" />
                </div>
              </div>
            </v-window-item>
            <!-- Treći tab -->
            <v-window-item value="three">
              <div class="tab-content form-content">
                <div class="field-wrapper">
                  <div
                    class="photo-upload-box"
                    @click="triggerFileInput"
                  >
                    <v-icon 
                      v-if="!imageUrl"
                      size="large"
                      color="#757575"
                    >mdi-image</v-icon>
                    <input 
                      type="file"
                      ref="fileInput"
                      accept="image/*"
                      @change="handleFileUpload"
                      style="display: none"
                    >
                    <div v-if="!imageUrl" class="upload-text">Dodaj sliku knjige</div>
                    <img
                      v-if="imageUrl"
                      :src="imageUrl"
                      class="image-preview"
                      alt="Slika knjige"
                    />
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
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'
import ActionButtons from '@/components/ActionButtons.vue'

const tab = ref('one')
const isSaving = ref(false)
const fileInput = ref(null)
const router = useRouter()
const form = ref(null)
const imageUrl = ref('')

const showErrors = ref(false)
const globalError = ref('')

const book = reactive({
  naziv_knjige: '',
  autor: '',
  kategorija: '',
  kratak_sadrzaj: '',
  ukupna_kolicina: 0,
  izdavac: '',
  zanr: '',
  godina_izdavanja: '',
  pismo: '',
  broj_stranica: null,
  povez: '',
  format: '',
  jezik: '',
  isbn: ''
})

const uniqueCategories = ref([])
const uniqueGenres = ref([])
const uniqueAuthors = ref([])
const uniquePublishers = ref([])

const supabase = useSupabaseClient()

onMounted(() => {
  fetchBookData()
})

async function fetchBookData() {
  try {
    const { data: books, error } = await supabase
      .from('knjige')
      .select('kategorija, zanr, autor, izdavac')

    if (error) throw error

    uniqueCategories.value = [...new Set(books.map(b => b.kategorija).filter(Boolean))]
    uniqueGenres.value = [...new Set(books.map(b => b.zanr).filter(Boolean))]
    uniqueAuthors.value = [...new Set(books.map(b => b.autor).filter(Boolean))]
    uniquePublishers.value = [...new Set(books.map(b => b.izdavac).filter(Boolean))]
  } catch (error) {
    globalError.value = 'Greška pri učitavanju podataka!'
    console.error('Greška pri učitavanju podataka:', error)
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (evt) => {
      imageUrl.value = evt.target.result
    }
    reader.readAsDataURL(file)
  }
}

const validIsbn = computed(() => {
  return !!book.isbn && /^[0-9-]+$/.test(book.isbn)
})

const hasErrorsOnFirstTab = computed(() => {
  return (
    !book.naziv_knjige ||
    !book.kategorija ||
    !book.zanr ||
    !book.autor ||
    !book.izdavac ||
    !book.godina_izdavanja ||
    !book.ukupna_kolicina || book.ukupna_kolicina <= 0
  )
})

async function validateAndSave() {
  showErrors.value = true
  globalError.value = ''
  if (
    !book.naziv_knjige ||
    !book.kategorija ||
    !book.zanr ||
    !book.autor ||
    !book.izdavac ||
    !book.godina_izdavanja ||
    !book.ukupna_kolicina || book.ukupna_kolicina <= 0 ||
    !book.broj_stranica || book.broj_stranica <= 0 ||
    !book.pismo ||
    !book.povez ||
    !book.format ||
    !book.jezik ||
    !book.isbn || !validIsbn.value
  ) {
    return
  }
  await saveBook()
}

async function saveBook() {
  isSaving.value = true
  globalError.value = ''
  try {
    const bookData = {
      ...book,
      slika_knjige: imageUrl.value || ''
    }

    const { data, error } = await supabase
      .from('knjige')
      .insert(bookData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        globalError.value = 'Knjiga sa ovim ISBN-om već postoji!'
      } else if (error.message?.includes('row-level security')) {
        globalError.value = 'Nemate dozvolu za upis u bazu! Proverite RLS policy u Supabase-u.'
      } else {
        globalError.value = error.message || 'Greška pri čuvanju knjige.'
      }
      throw error
    }

    router.push(`/book/${data.id}`)
  } catch (error) {
    console.error('Greška pri čuvanju knjige:', error)
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  color: #3392EA;
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
  border: 1px dashed #BDBDBD;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #FAFAFA;
  position: relative;
  overflow: hidden;
}

.photo-upload-box:hover {
  border-color: #3392EA;
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
  color: #CF2A27;
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
