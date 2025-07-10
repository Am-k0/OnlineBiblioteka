<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface ArhiviranaRezervacija {
  id: number
  naziv_knjige: string
  slika_knjige: string | null
  datum_rezervacije: string
  rezervacija_istice: string
  status: 'izdata' | 'istekla' | 'otkazana'
}

const router = useRouter()
const rezervacije = ref<ArhiviranaRezervacija[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const defaultBookCover = 'https://via.placeholder.com/32x52?text=Knjiga'

const fetchRezervacije = async () => {
  try {
    loading.value = true
    const response = await $fetch<{ data: ArhiviranaRezervacija[] }>('/api/archived-reservations', {
      baseURL: useRuntimeConfig().public.apiBase,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    rezervacije.value = response.data.map((r: ArhiviranaRezervacija) => ({
      ...r,
      slika_knjige: r.slika_knjige || defaultBookCover
    }))
  } catch (err) {
    error.value = 'Greška pri učitavanju arhive'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRezervacije)
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Arhivirane rezervacije</h1>
    
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knjiga</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum rezervacije</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Istekla</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in rezervacije" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img class="h-10 w-10 rounded" :src="item.slika_knjige || defaultBookCover" :alt="item.naziv_knjige">
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
                    'bg-blue-100 text-blue-800': item.status === 'izdata',
                    'bg-gray-100 text-gray-800': item.status === 'istekla',
                    'bg-red-100 text-red-800': item.status === 'otkazana'
                  }">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>