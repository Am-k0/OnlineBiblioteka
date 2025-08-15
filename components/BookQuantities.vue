<template>
  <div class="quantities-panel ml-8">
    <v-card class="quantities-card" flat>
      <v-card-text>
        <h3 class="panel-title">Količine</h3>
        <div class="quantity-item">
          <span class="label">Na raspolaganju:</span>
          <v-chip class="value custom-chip-style available" label>{{ quantities.na_raspolaganju }} primeraka</v-chip>
        </div>
        <div class="quantity-item">
          <span class="label">Rezervisano:</span>
          <v-chip class="value custom-chip-style reserved" label>{{ quantities.rezervisano }} primeraka</v-chip>
        </div>
        <div class="quantity-item">
          <span class="label">Izdato:</span>
          <v-chip class="value custom-chip-style issued" label>{{ quantities.izdato }} primeraka</v-chip>
        </div>
        <div class="quantity-item">
          <span class="label">U prekoračenju:</span>
          <v-chip class="value custom-chip-style overdue" label>{{ quantities.u_prekoracenju }} primeraka</v-chip>
        </div>
        <div class="quantity-item">
          <span class="label">Ukupna količina:</span>
          <v-chip class="value custom-chip-style total" label>{{ quantities.ukupna_kolicina }} primeraka</v-chip>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  quantities: {
    type: Object,
    required: true,
    default: () => ({
      na_raspolaganju: 0,
      rezervisano: 0,
      izdato: 0,
      u_prekoracenju: 0,
      ukupna_kolicina: 0,
    }),
  },
});
</script>

<style scoped>
/* Količine panel */
.quantities-panel {
  width: 380px;
}

.quantities-card {
  height: 315px;
  padding: 24px;
  border: 1px solid #e0e0e0;
}

.panel-title {
  font-size: 20px;
  font-weight: 500;
  color: #222;
  margin-bottom: 24px;
}

.quantity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quantity-item .label {
  color: #777;
}

/* Modifikovani stilovi za čipove */
.custom-chip-style {
  width: 113px;
  height: 32px;
  border-radius: 50px;
  padding: 12px;
  opacity: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-style: solid;
  background-color: white;
  font-family: 'Roboto', sans-serif !important;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
}

.available {
  border-color: #009E0F;
  color: #009E0F;
}

.reserved {
  border-color: #FF9900;
  color: #FF9900;
}

.issued {
  border-color: #3392EA;
  color: #3392EA;
}

.overdue {
  border-color: #CF2A27;
  color: #CF2A27;
}

.total {
  border-color: #00000099;
  color: #00000099;
}
</style>