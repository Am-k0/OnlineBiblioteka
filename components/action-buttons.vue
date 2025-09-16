<template>
  <div class="buttons">
    <v-btn
      variant="outlined"
      class="cancel-btn"
      @click="emitCancel"
      :style="{ width: cancelBtnWidth, height: cancelBtnHeight }"
    >
      <v-icon left>{{ cancelIcon }}</v-icon>
      <span>{{ cancelLabel }}</span>
    </v-btn>
    <v-btn
      color="primary"
      class="save-btn"
      @click="emitSave"
      :style="{ width: saveBtnWidth, height: saveBtnHeight }"
    >
      <v-icon left>{{ saveIcon }}</v-icon>
      <span>{{ saveLabel }}</span>
    </v-btn>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  saveLabel: {
    type: String,
    default: 'SAČUVAJ'
  },
  cancelLabel: {
    type: String,
    default: 'PONIŠTI'
  },
  saveIcon: {
    type: String,
    default: 'mdi-check'
  },
  cancelIcon: {
    type: String,
    default: 'mdi-close'
  },
  saveWidth: {
    type: String,
    default: '124px' // Podrazumevana širina
  },
  cancelWidth: {
    type: String,
    default: '115px' // Podrazumevana širina
  },
  saveHeight: {
    type: String,
    default: '36px' // Podrazumevana visina
  },
  cancelHeight: {
    type: String,
    default: '36px' // Podrazumevana visina
  }
});

const emit = defineEmits(['save', 'cancel']);

const emitSave = () => {
  emit('save');
};

const emitCancel = () => {
  emit('cancel');
};


const saveBtnWidth = computed(() => props.saveWidth);
const saveBtnHeight = computed(() => props.saveHeight);
const cancelBtnWidth = computed(() => props.cancelWidth);
const cancelBtnHeight = computed(() => props.cancelHeight);
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
}

.cancel-btn {
  border: 1px solid #3392EA !important;
  color: #3392EA !important;
  background-color: white !important;
}

.v-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 600 !important;
}
</style>