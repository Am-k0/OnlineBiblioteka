<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'

interface Author {
  id: number
  naziv: string
  opis: string
  avatar: string | null
}

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const author = ref<Author | null>(null)
const error = ref<string | null>(null)
const editMode = ref(false)
const form = ref({
  naziv: '',
  opis: '',
  avatar: ''
})

onMounted(async () => {
  await loadAuthor()
})

const loadAuthor = async () => {
  const { data, error: supabaseError } = await supabase
    .from('autori')
    .select('id, naziv, opis, avatar')
    .eq('id', route.params.id)
    .single()

  if (supabaseError) {
    error.value = `Greška pri učitavanju autora: ${supabaseError.message}`
  } else if (data) {
    author.value = {
      ...data,
      avatar: data.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
    }
    form.value = {
      naziv: data.naziv,
      opis: data.opis,
      avatar: data.avatar || '',
    }
  }
}

const saveAuthor = async () => {
  if (!author.value) return
  
  const { error: updateError } = await supabase
    .from('autori')
    .update({
      naziv: form.value.naziv,
      opis: form.value.opis,
      avatar: form.value.avatar,
    })
    .eq('id', author.value.id)

  if (updateError) {
    alert(`Greška pri čuvanju: ${updateError.message}`)
  } else {
    editMode.value = false
    await loadAuthor()
  }
}

const deleteAuthor = async () => {
  const confirmed = confirm('Da li ste sigurni da želite da obrišete autora?')
  if (!confirmed || !author.value) return
  
  const { error: deleteError } = await supabase
    .from('autori')
    .delete()
    .eq('id', author.value.id)

  if (deleteError) {
    alert(`Greška pri brisanju: ${deleteError.message}`)
  } else {
    router.push('/authors')
  }
}
</script>

<template>
  <div class="author-wrapper">
    <div class="author-header">
      <div>
        <h1 class="author-title">{{ author?.naziv }}</h1>
        <p class="author-subtitle">
          <span class="link" @click="router.push('/authors')">Evidencija autora</span> / ID: {{ route.params.id }}
        </p>
      </div>
      <v-menu>
        <template #activator="{ props }">
          <v-icon v-bind="props" class="dots-icon">mdi-dots-vertical</v-icon>
        </template>
        <v-list>
          <v-list-item @click="editMode = true">
            <v-list-item-title>Izmeni podatke</v-list-item-title>
          </v-list-item>
          <v-list-item @click="deleteAuthor">
            <v-list-item-title>Izbriši autora</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div v-if="author && !editMode" class="author-card">
      <img :src="author.avatar" alt="Avatar autora" class="author-avatar" />
      <div class="author-info">
        <div class="label">Ime i Prezime</div>
        <div class="author-name">{{ author.naziv }}</div>
        <div class="label">Opis</div>
        <div class="author-description">{{ author.opis }}</div>
      </div>
    </div>

    <div v-if="editMode && author" class="author-card">
      <img :src="form.avatar || author.avatar" alt="Avatar autora" class="author-avatar" />
      <div class="author-info">
        <v-text-field v-model="form.avatar" label="URL slike" dense class="mt-2" />
        <div class="label">Ime i Prezime</div>
        <v-text-field v-model="form.naziv" class="name-field" dense required />
        <div class="label">Opis</div>
        <v-textarea v-model="form.opis" class="description-field" dense required />
        <div class="mt-2">
          <v-btn color="primary" @click="saveAuthor">Sačuvaj</v-btn>
          <v-btn text @click="editMode = false">Otkaži</v-btn>
        </div>
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
    </v-alert>
  </div>
</template>

<style scoped>
.author-wrapper {
  max-width: 800px;
  margin: 0;
  padding: 16px;
  text-align: left;
}

.author-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.author-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.author-subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
}

.author-subtitle .link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.author-card {
  width: 463px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.author-avatar {
  width: 200px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 8px;
  margin-bottom: 4px;
}

.author-name {
  width: 100%;
  font-size: 16px;
  
}

.author-description {
  width: 100%;
 
  border: 1px solid #eee;
  
  border-radius: 4px;
}

.name-field {
  width: 100%;
}

.description-field {
  width: 100%;
}

.v-btn {
  margin-right: 8px;
}

.dots-icon {
  cursor: pointer;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.6);
}
</style>