<template>
  <div>
    <v-menu location="bottom end" offset-y>
      <template v-slot:activator="{ props }">
        <v-btn icon variant="text" v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list class="dropdown-menu">
        <!-- Opcija "Pogledaj detalje" se prikazuje samo ako nismo na detaljnoj stranici -->
        <v-list-item 
          v-if="!hideViewOption"
          @click="handleView" 
          class="dropdown-item view-item"
        >
          <template v-slot:prepend>
            <v-icon size="24" class="dropdown-icon">mdi-file-document-outline</v-icon>
          </template>
          <v-list-item-title class="dropdown-text">Pogledaj detalje</v-list-item-title>
        </v-list-item>

        <!-- Opcija "Izmijeni" -->
        <v-list-item @click="handleEdit" class="dropdown-item edit-item">
          <template v-slot:prepend>
            <v-icon size="24" class="dropdown-icon">mdi-pencil-outline</v-icon>
          </template>
          <v-list-item-title class="dropdown-text">Izmijeni {{ entityName }}</v-list-item-title>
        </v-list-item>

        <!-- Opcije specifične za knjige -->
        <template v-if="entityName === 'knjigu'">
          <!-- Prikaz u jednom redu sa ikonicama i tekstom -->
          <div v-if="inlineLayout" class="horizontal-actions">
            <v-list-item 
              @click="handleOtpisi" 
              class="action-item otpisi-item"
            >
              <template v-slot:prepend>
                <v-icon size="24" class="action-icon">mdi-cancel</v-icon>
              </template>
              <v-list-item-title class="action-text">Otpiši knjigu</v-list-item-title>
            </v-list-item>

            <v-list-item 
              @click="handleIzdaj" 
              class="action-item izdaj-item"
            >
              <template v-slot:prepend>
                <v-icon size="24" class="action-icon">mdi-book-arrow-right</v-icon>
              </template>
              <v-list-item-title class="action-text">Izdaj knjigu</v-list-item-title>
            </v-list-item>

            <v-list-item 
              @click="handleVrati" 
              class="action-item vrati-item"
            >
              <template v-slot:prepend>
                <v-icon size="24" class="action-icon">mdi-book-arrow-left</v-icon>
              </template>
              <v-list-item-title class="action-text">Vrati knjigu</v-list-item-title>
            </v-list-item>

            <v-list-item 
              @click="handleRezervisi" 
              class="action-item rezervisi-item"
            >
              <template v-slot:prepend>
                <v-icon size="24" class="action-icon">mdi-bookmark-outline</v-icon>
              </template>
              <v-list-item-title class="action-text">Rezerviši knjigu</v-list-item-title>
            </v-list-item>
          </div>

          <!-- Standardni prikaz jedna ispod druge ako nije inlineLayout -->
          <template v-else>
            <v-list-item @click="handleOtpisi" class="dropdown-item otpisi-item">
              <template v-slot:prepend>
                <v-icon size="24" class="dropdown-icon">mdi-cancel</v-icon>
              </template>
              <v-list-item-title class="dropdown-text">Otpiši knjigu</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleIzdaj" class="dropdown-item izdaj-item">
              <template v-slot:prepend>
                <v-icon size="24" class="dropdown-icon">mdi-book-arrow-right</v-icon>
              </template>
              <v-list-item-title class="dropdown-text">Izdaj knjigu</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleVrati" class="dropdown-item vrati-item">
              <template v-slot:prepend>
                <v-icon size="24" class="dropdown-icon">mdi-book-arrow-left</v-icon>
              </template>
              <v-list-item-title class="dropdown-text">Vrati knjigu</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleRezervisi" class="dropdown-item rezervisi-item">
              <template v-slot:prepend>
                <v-icon size="24" class="dropdown-icon">mdi-bookmark-outline</v-icon>
              </template>
              <v-list-item-title class="dropdown-text">Rezerviši knjigu</v-list-item-title>
            </v-list-item>
          </template>
        </template>

        <!-- Opcija za brisanje -->
        <v-list-item @click="handleDelete" class="dropdown-item delete-item">
          <template v-slot:prepend>
            <v-icon size="24" class="dropdown-icon">mdi-delete-outline</v-icon>
          </template>
          <v-list-item-title class="dropdown-text">Izbriši {{ entityName }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Potvrdite brisanje</v-card-title>
        <v-card-text>
          Da li ste sigurni da želite obrisati {{ entityName }} "{{ entityTitle }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Otkaži</v-btn>
          <v-btn color="red darken-1" text @click="confirmDelete">Obriši</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  entityName: {
    type: String,
    default: 'knjigu'
  },
  titleProperty: {
    type: String,
    default: 'naziv_knjige'
  },
  hideViewOption: {
    type: Boolean,
    default: false
  },
  inlineLayout: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'otpisi', 'izdaj', 'vrati', 'rezervisi', 'error'])

const deleteDialog = ref(false)

const entityTitle = computed(() => props.item[props.titleProperty] || props.item.id)

const handleView = () => {
  emit('edit', { item: props.item, mode: 'view' })
}

const handleEdit = () => {
  emit('edit', { item: props.item, mode: 'edit' })
}

const handleOtpisi = () => {
  emit('otpisi', props.item)
}

const handleIzdaj = () => {
  emit('izdaj', props.item)
}

const handleVrati = () => {
  emit('vrati', props.item)
}

const handleRezervisi = () => {
  emit('rezervisi', props.item)
}

const handleDelete = () => {
  deleteDialog.value = true
}

const confirmDelete = () => {
  emit('delete', props.item)
  deleteDialog.value = false
}
</script>

<style scoped>
.dropdown-menu {
  width: 320px;
  padding: 0;
  overflow: hidden;
}

.dropdown-item {
  width: 320px;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.dropdown-icon {
  color: rgba(0, 0, 0, 0.6);
}

.dropdown-text {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-left: 4px;
}

/* Stilovi za horizontalne akcije */
.horizontal-actions {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin: 8px 0;
}

.action-item {
  flex: 1;
  min-width: 120px;
  height: auto;
  padding: 8px 4px;
  flex-direction: column;
  text-align: center;
}

.action-icon {
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.6);
}

.action-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  white-space: normal;
  text-align: center;
  line-height: 1.2;
}

/* Povećaj padding između akcija */
.action-item:not(:last-child) {
  margin-right: 4px;
}
</style>