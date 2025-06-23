<template>
  <div class="header">
      <h1>Nova knjiga</h1>
      <div class="breadcrumbs">
        <a href="/books">Evidencija knjiga</a>
        <span>/ Nova knjiga</span>
      </div>
    </div>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab value="one">Osnovni Detalji</v-tab>
      <v-tab value="two">Specifikacija</v-tab>
      <v-tab value="three">Multimedia</v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <!-- Prvi tab - Osnovni detalji -->
        <v-window-item value="one">
          <v-text-field
            v-model="book.title"
            label="Unesite naziv knjige..."
            variant="outlined"
            hide-details
            class="form-field mb-4"
          ></v-text-field>

          <v-textarea
            v-model="book.summary"
            label="Unesite kratak sadržaj knjige..."
            variant="outlined"
            hide-details
            class="form-field mb-4"
            rows="3"
          ></v-textarea>

          <v-autocomplete
            v-model="book.categories"
            clearable
            label="Izaberite kategoriju"
            :items="['Komedija', 'Drama', 'Naucna fantastika', 'Ljubavni romani', 'Horor', 'Misterija']"
            multiple
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.genres"
            clearable
            label="Izaberite žanr"
            :items="['Komedija', 'Drama', 'Naucna fantastika', 'Ljubavni romani', 'Horor', 'Misterija']"
            multiple
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.authors"
            clearable
            label="Izaberite autore"
            :items="['Ivo Andrić', 'Meša Selimović', 'Bora Ćosić', 'Danilo Kiš', 'Milorad Pavić']"
            multiple
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.publisher"
            clearable
            label="Izaberite izdavača"
            :items="['Vulkan', 'Laguna', 'Dereta', 'Geopoetika', 'Plato']"
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-text-field
            v-model="book.publicationYear"
            label="Unesite godinu izdavanja..."
            variant="outlined"
            type="number"
            hide-details
            class="form-field mb-4"
          ></v-text-field>

          <v-text-field
            v-model="book.quantity"
            label="Unesite količinu..."
            variant="outlined"
            type="number"
            hide-details
            class="form-field mb-4"
          ></v-text-field>
        </v-window-item>

        <!-- Drugi tab - Specifikacija -->
        <v-window-item value="two">
          <v-text-field
            v-model="book.pageCount"
            label="Unesite broj strana"
            variant="outlined"
            type="number"
            class="mb-4"
          ></v-text-field>

          <v-autocomplete
            v-model="book.fontType"
            label="Izaberite vrstu pisma"
            :items="['Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Helvetica']"
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.bindingType"
            label="Izaberite vrstu poveza"
            :items="['Tvrdi povez', 'Meki povez', 'Spiralni povez', 'Platnena korica']"
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-autocomplete
            v-model="book.format"
            label="Izaberite vrstu formata"
            :items="['A5', 'A4', 'B5', 'Pocket', 'Hardcover']"
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>

          <v-text-field
            v-model="book.isbn"
            label="Unesite ISBN"
            variant="outlined"
            class="mb-1"
          ></v-text-field>
          <div class="text-caption text-grey mb-4">
            International Standard Book Number
          </div>
        </v-window-item>

        <!-- Treći tab - Multimedia -->
        <v-window-item value="three">
          <v-card
            variant="outlined"
            class="drop-zone pa-8 text-center"
            @dragover.prevent
            @drop="handleDrop"
            @click="$refs.fileInput.click()"
          >
            <v-icon size="64" color="grey-lighten-1">mdi-cloud-upload</v-icon>
            <div class="text-h6 mt-2">
              Drag your files here or click in this area
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

<script>
import ActionButtons from '@/components/ActionButtons.vue'

export default {
  components: {
    ActionButtons
  },
  data: () => ({
    tab: 'one',
    isSaving: false,
    book: {
      title: '',
      summary: '',
      categories: [],
      genres: [],
      authors: [],
      publisher: '',
      publicationYear: null,
      quantity: 0,
      pageCount: null,
      fontType: '',
      bindingType: '',
      format: '',
      isbn: '',
      files: []
    }
  }),
  methods: {
    async saveBook() {
      this.isSaving = true
      try {
        console.log('Sačuvana knjiga:', this.book)
        // Simulacija API poziva
        await new Promise(resolve => setTimeout(resolve, 1000))
      } finally {
        this.isSaving = false
      }
    },
    cancel() {
      this.book = {
        title: '',
        summary: '',
        categories: [],
        genres: [],
        authors: [],
        publisher: '',
        publicationYear: null,
        quantity: 0,
        pageCount: null,
        fontType: '',
        bindingType: '',
        format: '',
        isbn: '',
        files: []
      }
      this.tab = 'one'
    },
    handleDrop(e) {
      e.preventDefault()
      this.book.files = [...this.book.files, ...Array.from(e.dataTransfer.files)]
    },
    handleFileSelect(e) {
      this.book.files = [...this.book.files, ...Array.from(e.target.files)]
      e.target.value = ''
    },
    removeFile(index) {
      this.book.files.splice(index, 1)
    }
  }
}
</script>

<style scoped>

.header {
  margin-bottom: 32px;
}

.header h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #212121;
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
}
.breadcrumbs a {
  color: #3392EA;
  text-decoration: none;
}
.breadcrumbs a:hover {
  text-decoration: underline;
}

.form-field {
  margin-bottom: 16px;
}
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.3s;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.drop-zone:hover {
  border-color: #1976d2;
}
.text-transform-none {
  text-transform: none;
}
</style>