<template>
  <div>
    <v-menu location="bottom end" offset-y>
      <template v-slot:activator="{ props }">
        <v-btn icon variant="text" v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list class="dropdown-menu">
        <v-list-item v-if="showView" @click="handleView" class="dropdown-item view-item">
          <template v-slot:prepend>
            <v-icon size="24" class="dropdown-icon">mdi-file-document-outline</v-icon>
          </template>
          <v-list-item-title class="dropdown-text">Pogledaj detalje</v-list-item-title>
        </v-list-item>

        <v-list-item @click="handleEdit" class="dropdown-item edit-item">
          <template v-slot:prepend>
            <v-icon size="24" class="dropdown-icon">mdi-pencil-outline</v-icon>
          </template>
          <v-list-item-title class="dropdown-text">{{ editText }}</v-list-item-title>
        </v-list-item>

        <v-list-item @click="handleDelete" class="dropdown-item delete-item">
          <template v-slot:prepend>
            <v-icon size="24" class="dropdown-icon">mdi-delete-outline</v-icon>
          </template>
          <v-list-item-title class="dropdown-text">{{ deleteText }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Potvrdite brisanje</v-card-title>
        <v-card-text>
          Da li ste sigurni da želite obrisati {{ entityName.toLowerCase() }} "{{ entityTitle }}"?
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
  showView: {
    type: Boolean,
    default: true
  },
  entityName: {
    type: String,
    default: 'zapis'
  },
  titleProperty: {
    type: String,
    default: 'naziv'
  }
})

const emit = defineEmits(['edit', 'delete', 'error'])

const deleteDialog = ref(false)

const entityTitle = computed(() => props.item[props.titleProperty] || props.item.id)
const editText = computed(() => `Izmijeni ${props.entityName.toLowerCase()}`)
const deleteText = computed(() => `Izbriši ${props.entityName.toLowerCase()}`)

const handleView = () => {
  emit('edit', { item: props.item, mode: 'view' })
}

const handleEdit = () => {
  emit('edit', { item: props.item, mode: 'edit' })
}

const handleDelete = () => {
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    emit('delete', props.item)
    deleteDialog.value = false
  } catch (err) {
    console.error('Greška pri brisanju:', err)
    emit('error', `Došlo je do greške pri brisanju: ${err.message}`)
  }
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
</style>