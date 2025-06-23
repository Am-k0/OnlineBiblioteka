<template>
  <div>
    <v-toolbar flat color="white" class="mb-4">
      <v-toolbar-title>Autori</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" class="ml-2" @click="onAddAutor">
        + NOVI AUTOR
      </v-btn>
    </v-toolbar>

    <v-data-table
      :headers="visibleHeaders"
      :items="autori"
      :loading="loading"
      loading-text="Učitavam autore..."
      item-value="id"
      items-per-page="10"
      hover
      class="elevation-1"
      show-select
    >
      <template v-slot:item.avatar="{ item }">
        <v-avatar size="36">
          <img :src="item.avatar || defaultAvatar" alt="Avatar" />
        </v-avatar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
      <div class="mt-2">
        <v-btn @click="fetchAutori" color="white" small>Pokušaj ponovo</v-btn>
      </div>
    </v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const supabase = useSupabaseClient()
const autori = ref([])
const loading = ref(false)
const error = ref(null)
const defaultAvatar = 'https://randomuser.me/api/portraits/men/1.jpg' 

// Zaglavlja tabele
const visibleHeaders = ref([
  { title: '', key: 'avatar', align: 'center', sortable: false },
  { title: 'Naziv Autora', key: 'naziv', align: 'start' },
  { title: 'Opis', key: 'opis' },
  { title: '', key: 'actions', align: 'end', sortable: false },
])

const fetchAutori = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('autori')
      .select('id, naziv, opis, avatar') 

    if (supabaseError) throw supabaseError

    // Dodaj default avatar ako nije setovan
    autori.value = (data || []).map(a => ({
      ...a,
      avatar: a.avatar || defaultAvatar,
    }))
  } catch (err) {
    console.error('Greška pri dohvatu autora:', err)
    error.value = `Došlo je do greške: ${err.message}`
  } finally {
    loading.value = false
  }
}

function onAddAutor() {

  alert('Dodaj autora - implementacija po potrebi')
}

onMounted(fetchAutori)
</script>
