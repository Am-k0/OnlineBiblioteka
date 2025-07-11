<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRuntimeConfig } from '#imports'

interface KnjigaRezervacija {
  id: number
  naziv_knjige: string
  slika_knjige: string | null
  datum_rezervacije: string
  rezervacija_istice: string
  status: 'rezervisano' | 'odbijeno'
}

const router = useRouter()
const config = useRuntimeConfig()

const rezervacije = ref<KnjigaRezervacija[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/32x52?text=Knjiga'

const fetchRezervacije = async () => {
  try {
    loading.value = true
    error.value = null
    // TODO: Zamijeni endpoint po potrebi
    const data = await $fetch('/api/active-reservations', {
      baseURL: config.public.apiBase,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    rezervacije.value = (data as KnjigaRezervacija[]).map(r => ({
      ...r,
      slika_knjige: r.slika_knjige || defaultBookCover
    }))
  } catch (err) {
    error.value = 'Greška pri učitavanju rezervacija'
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await $fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
      baseURL: config.public.apiBase,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    await fetchRezervacije()
  } catch (err) {
    error.value = 'Greška pri brisanju rezervacije'
  }
}

onMounted(fetchRezervacije)
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Aktivne rezervacije</h1>
    
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knjiga</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum rezervacije</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ističe</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in rezervacije" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img class="h-10 w-10 rounded" :src="item.slika_knjige ?? defaultBookCover" :alt="item.naziv_knjige">
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ item.naziv_knjige }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ new Date(item.datum_rezervacije).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ new Date(item.rezervacija_istice).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                  :class="{
                    'bg-green-100 text-green-800': item.status === 'rezervisano',
                    'bg-red-100 text-red-800': item.status === 'odbijeno'
                  }">
                  {{ item.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="router.push(`/reservation/${item.id}`)" class="text-blue-600 hover:text-blue-900 mr-3">
                  Pregled
                </button>
                <button @click="handleDelete(item.id)" class="text-red-600 hover:text-red-900">
                  Obriši
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="error" class="text-red-600 text-center py-4">{{ error }}</div>
        <div v-if="loading" class="text-center py-4">Učitavanje...</div>
      </div>
    </div>
  </div>
</template>
