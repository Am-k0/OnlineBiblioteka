<template>
  <div class="spec-container">
    <div class="spec-item">
      <span class="label">Broj strana</span>
      <span class="value">{{ book?.broj_stranica || 'N/A' }}</span>
    </div>
    <div class="spec-item">
      <span class="label">Pismo</span>
      <span class="value">{{ book?.pismo || 'N/A' }}</span>
    </div>
    <div class="spec-item">
      <span class="label">Jezik:</span>
      <span class="value">{{ book?.jezik || 'N/A' }}</span>
    </div>
    <div class="spec-item">
      <span class="label">Povez</span>
      <span class="value">{{ book?.povez || 'N/A' }}</span>
    </div>
    <div class="spec-item">
      <span class="label">Format</span>
      <span class="value">{{ book?.format || 'N/A' }}</span>
    </div>
    <div class="spec-item">
      <span class="label">International Standard Book Number(ISBN)</span>
      <span class="value">{{ book?.isbn || 'N/A' }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  book: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.spec-container {
  width: 316px;
  height: 436px;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
  
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.spec-item {
  display: flex;
  flex-direction: column;
}

.label {
 
  font-size: 14px;
 color: rgba(0, 0, 0, 0.6)
}

.value {
  font-size: 14px;
  color: #000000;
}
</style>
