<template>
  <div class="buttons">
    <v-btn
      color="primary"
      class="save-btn"
      @click="emitSave"
    >
      <v-icon left>mdi-check</v-icon>
      <span>SAČUVAJ</span>
    </v-btn>
    <v-btn
      variant="outlined"
      class="cancel-btn"
      @click="emitCancel"
    >
      <v-icon left>mdi-close</v-icon>
      <span>PONIŠTI</span>
    </v-btn>
  </div>
</template>

<script setup>
const emit = defineEmits(['save', 'cancel'])

const emitSave = () => {
  emit('save')
}

const emitCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
}

.save-btn {
  background-color: #3392EA !important;
  color: white !important;
  width: 124px;
  height: 36px;
}

.cancel-btn {
  border: 1px solid #3392EA !important;
  color: #3392EA !important;
  background-color: white !important;
  width: 115px;
  height: 36px;
}

.v-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 600 !important;
}
</style>
