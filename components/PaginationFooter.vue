<template>
  <div class="d-flex align-center justify-end pa-2" style="gap: 8px;">
    <div class="caption">
      Rows per page:
    </div>
    
    <v-menu>
      <template v-slot:activator="{ props }">
        <div 
          v-bind="props"
          class="d-flex align-center"
          style="cursor: pointer;"
        >
          <span class="mr-1">{{ itemsPerPage === -1 ? '100' : itemsPerPage }}</span>
          <v-icon size="18">mdi-chevron-down</v-icon>
        </div>
      </template>
      <v-list>
        <v-list-item
          v-for="(option, i) in itemsPerPageOptions"
          :key="i"
          @click="updateItemsPerPage(option.value)"
        >
          <v-list-item-title>{{ option.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <div class="page-info">
      {{ paginationRange }}
    </div>

    <v-btn
      icon
      variant="text"
      size="small"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
      class="pagination-button"
    >
      <v-icon size="18">mdi-chevron-left</v-icon>
    </v-btn>
    <v-btn
      icon
      variant="text"
      size="small"
      :disabled="currentPage === pageCount"
      @click="goToPage(currentPage + 1)"
      class="pagination-button"
    >
      <v-icon size="18">mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  itemsPerPage: {
    type: Number,
    required: true
  },
  currentPage: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:itemsPerPage', 'update:currentPage'])

const itemsPerPageOptions = [
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 }
]

const pageCount = computed(() => {
  if (props.itemsPerPage === -1) return 1
  return Math.ceil(props.totalItems / props.itemsPerPage)
})

const paginationRange = computed(() => {
  return `${props.currentPage} of ${pageCount.value}`
})

function updateItemsPerPage(value) {
  emit('update:itemsPerPage', value)
  // Reset to first page when changing items per page
  emit('update:currentPage', 1)
}

function goToPage(page) {
  emit('update:currentPage', page)
}
</script>

<style scoped>
.caption {
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0.4px;
}

.page-info {
  width: 33px; 
  font-weight: 400; 
  font-size: 12px; 
  line-height: 24px; 
  letter-spacing: 0.4px;
}

.pagination-button {
  width: 44px; 
  height: 18px;
}
</style>