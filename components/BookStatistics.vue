<template>
  <div v-if="bookStats" class="book-stats-list">
    <div class="stat-row">
      <span class="stat-label">Na raspolaganju:</span>
      <span class="stat-badge available">{{ bookStats.na_raspolaganju }} primjeraka</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Rezervisano:</span>
      <span class="stat-badge reserved">{{ bookStats.rezervisano }} primjerka</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Izdato:</span>
      <span class="stat-badge issued">{{ bookStats.izdato }} primjerka</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">U prekoracenju:</span>
      <span class="stat-badge overdue">{{ bookStats.u_prekoracenju }} primjerka</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Ukupna kolicina:</span>
      <span class="stat-badge total">{{ bookStats.ukupna_kolicina }} primjeraka</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  bookId: {
    type: Number,
    required: true
  }
})

const bookStats = ref(null)
const loading = ref(false)
const error = ref(null)

// Ovdje dodaj fetch logiku za bookStats, npr. preko watch na props.bookId
watch(() => props.bookId, async () => {
  // bookStats.value = ... (pozovi svoj backend)
})
</script>

<style scoped>
.book-stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 305px; 
  max-height: 232px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  margin-left: auto; 
  margin-top: 64px; 
}
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
}
.stat-label { text-align: left; flex: 1; }
.stat-badge {
  display: inline-block;
  min-width: 60px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  border: 1px solid #e0e0e0;
  background: #f7f7f7;
}
.stat-badge.available { background: #e8f5e9; color: #1b7e2c; border-color: #5dd067; }
.stat-badge.reserved { background: #fff8e1; color: #d68600; border-color: #ffd54f; }
.stat-badge.issued { background: #e3f2fd; color: #1565c0; border-color: #64b5f6; }
.stat-badge.overdue { background: #ffebee; color: #c62828; border-color: #ef9a9a; }
.stat-badge.total { background: #f4f4f4; color: #666; border-color: #bbb; }
</style>
