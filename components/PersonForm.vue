<template>
  <div class="form-wrapper">
    <div class="photo-section">
      <div class="photo-upload-box" @click="pokreniFileInput">
        <v-icon v-if="!slikaUrl" size="large" color="#757575">mdi-image</v-icon>
        <input type="file" ref="fileInput" accept="image/*" @change="obradiUploadSlike" style="display: none">
        <div v-if="!slikaUrl" class="upload-text">Dodajte fotografiju</div>
        <v-img v-if="slikaUrl" :src="slikaUrl" class="image-preview"></v-img>
      </div>
    </div>

    <div class="form-container">
      <v-text-field
        v-model="ime"
        label="Unesite ime..."
        variant="outlined"
        hide-details
        class="form-field"
      ></v-text-field>
      <div v-if="greske.ime" class="error-message">{{ greske.ime }}</div>

      <v-text-field
        v-model="prezime"
        label="Unesite prezime..."
        variant="outlined"
        hide-details
        class="form-field"
      ></v-text-field>
      <div v-if="greske.prezime" class="error-message">{{ greske.prezime }}</div>

      <v-text-field
        v-model="jmbg"
        label="Unesite JMBG..."
        variant="outlined"
        hide-details
        class="form-field"
        type="number"
        @keypress="samoBrojevi($event)"
      ></v-text-field>
      <div v-if="greske.jmbg" class="error-message">{{ greske.jmbg }}</div>

      <v-text-field
        v-model="email"
        label="Unesite e-mail..."
        variant="outlined"
        hide-details
        class="form-field"
        type="email"
      ></v-text-field>
      <div v-if="greske.email" class="error-message">{{ greske.email }}</div>

      <v-text-field
        v-model="korisnickoIme"
        label="Unesite korisničko ime..."
        variant="outlined"
        hide-details
        class="form-field"
      ></v-text-field>
      <div v-if="greske.korisnickoIme" class="error-message">{{ greske.korisnickoIme }}</div>

      <v-text-field
        v-model="lozinka"
        label="Unesite željenu šifru..."
        variant="outlined"
        :type="vidljivo ? 'text' : 'password'"
        :append-inner-icon="vidljivo ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="vidljivo = !vidljivo"
        hide-details
        class="form-field"
      ></v-text-field>
      <div v-if="greske.lozinka" class="error-message">{{ greske.lozinka }}</div>

      <v-text-field
        v-model="ponoviLozinku"
        label="Ponovo unesite šifru..."
        variant="outlined"
        :type="vidljivo ? 'text' : 'password'"
        hide-details
        class="form-field"
      ></v-text-field>
      <div v-if="greske.ponoviLozinku" class="error-message">{{ greske.ponoviLozinku }}</div>

      <ActionButtons 
        @save="sacuvajOsobu" 
        @cancel="ponisti"
        :loading="cuvaSe"
        container-class="mt-4"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ActionButtons from '@/components/ActionButtons.vue'
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

const props = defineProps({
  kolekcija: {
    type: String,
    required: true,
    validator: (value) => ['ucenici', 'bibliotekari'].includes(value)
  }
})

const supabase = useSupabaseClient()
const router = useRouter()

const fotografija = ref(null)
const slikaUrl = ref('')
const ime = ref('')
const prezime = ref('')
const jmbg = ref('')
const email = ref('')
const korisnickoIme = ref('')
const lozinka = ref('')
const ponoviLozinku = ref('')
const fileInput = ref(null)
const vidljivo = ref(false)
const cuvaSe = ref(false)

const greske = ref({
  ime: '',
  prezime: '',
  jmbg: '',
  email: '',
  korisnickoIme: '',
  lozinka: '',
  ponoviLozinku: ''
})

const samoBrojevi = (evt) => {
  const charCode = evt.which ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault()
  }
}

const pokreniFileInput = () => fileInput.value.click()

const obradiUploadSlike = (e) => {
  const file = e.target.files[0]
  if (file) {
    fotografija.value = file
    slikaUrl.value = URL.createObjectURL(file)
  }
}

const sacuvajOsobu = async () => {
  greske.value = {
    ime: '',
    prezime: '',
    jmbg: '',
    email: '',
    korisnickoIme: '',
    lozinka: '',
    ponoviLozinku: ''
  }

  let imaGresaka = false
  if (!ime.value) { greske.value.ime = 'Morate uneti ime!'; imaGresaka = true }
  if (!prezime.value) { greske.value.prezime = 'Morate uneti prezime!'; imaGresaka = true }
  if (!jmbg.value) { greske.value.jmbg = 'Morate uneti JMBG!'; imaGresaka = true }
  if (!email.value) { greske.value.email = 'Morate uneti e-mail!'; imaGresaka = true }
  if (!korisnickoIme.value) { greske.value.korisnickoIme = 'Morate uneti korisničko ime!'; imaGresaka = true }
  if (!lozinka.value) { greske.value.lozinka = 'Morate uneti šifru!'; imaGresaka = true }
  if (!ponoviLozinku.value) { greske.value.ponoviLozinku = 'Morate ponoviti šifru!'; imaGresaka = true }
  if (lozinka.value !== ponoviLozinku.value) {
    greske.value.ponoviLozinku = 'Šifre se ne poklapaju!'; imaGresaka = true
  }

  if (imaGresaka) return

  cuvaSe.value = true
  try {
    const podaciZaCuvanje = {
      ime_i_prezime: `${ime.value} ${prezime.value}`,
      jmbg: jmbg.value,
      email: email.value,
      tip_korisnika: props.kolekcija === 'ucenici' ? 'Učenik' : 'Bibliotekar',
      korisnicko_ime: korisnickoIme.value,
      lozinka: lozinka.value,
      broj_logovanja: 0,
      zadnji_pristup_sistemu: new Date().toISOString()
    }

    if (slikaUrl.value) {
      podaciZaCuvanje.avatar = slikaUrl.value
    }

    // Dodajemo { data } da dobijemo novi red i njegov id
    const { data, error } = await supabase
      .from(props.kolekcija)
      .insert(podaciZaCuvanje)
      .select('id') // Pretpostavljamo da tabela ima kolonu 'id'
      .single()

    if (error) throw error

    ponisti()

    // Preusmjeri na odgovarajuću stranicu sa ID-em
    if (props.kolekcija === 'ucenici') {
      router.push(`/student/${data.id}`)
    } else {
      router.push(`/librarian/${data.id}`)
    }

  } catch (error) {
    console.error('Greška pri čuvanju:', error)
    greske.value.opsta = error.message || 'Došlo je do greške pri čuvanju podataka.'
  } finally {
    cuvaSe.value = false
  }
}

const ponisti = () => {
  fotografija.value = null
  slikaUrl.value = ''
  ime.value = ''
  prezime.value = ''
  jmbg.value = ''
  email.value = ''
  korisnickoIme.value = ''
  lozinka.value = ''
  ponoviLozinku.value = ''
}
</script>

<style scoped>
.photo-section {
  margin-bottom: 24px;
}
.photo-upload-box {
  width: 200px;
  height: 160px;
  border: 1px dashed #BDBDBD;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #FAFAFA;
  position: relative;
  overflow: hidden;
}
.photo-upload-box:hover {
  border-color: #3392EA;
}
.upload-text {
  margin-top: 8px;
  color: #757575;
  font-size: 14px;
}
.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.form-container {
  width: 724px;
}
.form-field {
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
}
.error-message {
  color: #ff5252;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 16px;
}
.form-wrapper {
  width: 724px;
  height: 734px;
  flex-direction: column;
  padding: 16px;
}
</style>
