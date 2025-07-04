<template>
  <v-card>
    <div v-if="book" class="book-detail-container">
      <div class="header-section">
        <div class="book-header">
          <h2 class="book-title">{{ book.naziv_knjige }}</h2>
          <p class="breadcrumb">
            <span class="link" @click="router.push('/books')">Evidencija knjiga</span> /
            <span>KNJIGA-{{ book.id }}</span>
          </p>
        </div>
        
        <div class="stats-container">
          <BookStatistics :book-id="book.id" />
        </div>
      </div>

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
        <div class="action-menu-container">
          <ActionMenu 
            :item="book"
            entityName="knjigu"
            inlineLayout
            @otpisi="handleOtpisi"
            @izdaj="handleIzdaj"
            @vrati="handleVrati"
            @rezervisi="handleRezervisi"
          />
        </div>

        <v-window v-model="tab">
          <v-window-item value="details">
            <BookDetail :book="book" />
          </v-window-item>

          <v-window-item value="spec">
            <BookSpecifications :book="book" />
          </v-window-item>

          <v-window-item value="records">
            <div class="under-construction">EVIDENCIJA IZNAJMLJIVANJA - U izradi</div>
          </v-window-item>

          <v-window-item value="media">
            <div class="media-tab-content">
              <div class="current-image">
                <img 
                  :src="book.slika_knjige || 'https://via.placeholder.com/300x450'" 
                  alt="Book cover"
                  class="book-image"
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
                  accept="image/*"
                  @change="handleImageChange"
                />
              </div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </div>
    <div v-else class="loading">Učitavanje podataka o knjizi...</div>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import BookDetail from '@/components/BookDetails.vue'
import BookSpecifications from '~/components/BookSpecifications.vue'
import ActionMenu from '@/components/ActionMenu.vue'
import BookStatistics from '@/components/BookStatistics.vue'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const tab = ref('details')
const book = ref(null)
const error = ref(null)
const fileInput = ref(null)

const fetchBook = async () => {
  try {
    const { data, error: supabaseError } = await supabase
      .from('knjige')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (supabaseError) throw supabaseError

    book.value = data
  } catch (err) {
    error.value = `Došlo je do greške: ${err.message}`
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleImageChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    // Simulacija uploada - u produkciji bi ovo bio pravi upload na server
    const imageUrl = URL.createObjectURL(file)
    
    // Ažurirajte knjigu u bazi
    const { error } = await supabase
      .from('knjige')
      .update({ slika_knjige: imageUrl })
      .eq('id', book.value.id)
    
    if (error) throw error
    
    // Osvežite podatke
    await fetchBook()
  } catch (error) {
    console.error('Greška pri promjeni slike:', error)
  }
}

const handleOtpisi = () => {}
const handleIzdaj = () => {}
const handleVrati = () => {}
const handleRezervisi = () => {}

onMounted(fetchBook)
</script>

<style scoped>
.book-detail-container {
  padding: 24px;
  margin-right: auto;
  max-width: 100%;
  position: relative;
}

.header-section {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
</style>