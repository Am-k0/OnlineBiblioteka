<template>
  <div class="pa-4">
    <div class="mb-4 polisa-row">
      <div class="polisa-description">
        <h3 class="polisa-title">Rok za rezervaciju</h3>
        <p class="polisa-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fringilla mauris dolor sed duis quam mi faucibus sit eleifend. Sed lobortis ornare porttitor lectus dictum. Turpis diam non pellentesque nisl rhoncus, vitae amet at placerat.
        </p>
      </div>
      <div class="polisa-input-group">
        <v-text-field
          v-model="rokZaRezervaciju"
          hide-details
          variant="outlined"
          density="compact"
          class="polisa-text-field"
        ></v-text-field>
        <span class="polisa-label">dana!</span>
      </div>
    </div>

    <div class="mb-4 polisa-row">
      <div class="polisa-description">
        <h3 class="polisa-title">Rok vraćanja</h3>
        <p class="polisa-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fringilla mauris dolor sed duis quam mi faucibus sit eleifend. Sed lobortis ornare porttitor lectus dictum. Turpis diam non pellentesque nisl rhoncus, vitae amet at placerat.
        </p>
      </div>
      <div class="polisa-input-group">
        <v-text-field
          v-model="rokVracanja"
          hide-details
          variant="outlined"
          density="compact"
          class="polisa-text-field"
        ></v-text-field>
        <span class="polisa-label">dana</span>
      </div>
    </div>

    <div class="mb-4 polisa-row">
      <div class="polisa-description">
        <h3 class="polisa-title">Rok konflikta</h3>
        <p class="polisa-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fringilla mauris dolor sed duis quam mi faucibus sit eleifend. Sed lobortis ornare porttitor lectus dictum. Turpis diam non pellentesque nisl rhoncus, vitae amet at placerat.
        </p>
      </div>
      <div class="polisa-input-group">
        <v-text-field
          v-model="rokKonflikta"
          hide-details
          variant="outlined"
          density="compact"
          class="polisa-text-field"
        ></v-text-field>
        <span class="polisa-label">dana</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PolisaSettings',
  data() {
    return {
      rokZaRezervaciju: '...',
      rokVracanja: '...',
      rokKonflikta: '...'
    };
  }
}
</script>

<style scoped>
.polisa-row {
  display: flex;
  align-items: center; /* Središnje poravnanje po vertikali */
  padding: 16px;
  background-color: white;
  border-radius: 4px;
}

.polisa-description {
  width: 320px;
  height: 80px;
  margin-right: 24px; /* Dodaje razmak između opisa i polja za unos */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Središnje poravnanje po vertikali unutar bloka opisa */
}

.polisa-title {
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0.15px;
  margin-bottom: 8px;
}

.polisa-text {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0.25px;
  color: rgba(0, 0, 0, 0.6);
}

.polisa-input-group {
  display: flex;
  align-items: center;
  height: 48px;
  width: 336px;
  gap: 16px;
}

.polisa-text-field {
  width: 100px; /* Smanjio sam širinu da bude realnija */
  /* Možete podesiti ovu vrijednost po potrebi */
}

.polisa-label {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0.15px;
  color: rgba(0, 0, 0, 0.87);
}
</style>