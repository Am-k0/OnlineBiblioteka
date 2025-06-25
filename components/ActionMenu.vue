<template>
  <div>
    <v-menu location="bottom end" offset-y>
      <template v-slot:activator="{ props }">
        <v-btn icon variant="text" v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list density="compact">
        <v-list-item @click="handleView">
          <v-list-item-title>Pogledaj detalje</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleEdit">
          <v-list-item-title>Izmijeni autora</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleDelete">
          <v-list-item-title>Izbriši autora</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Potvrdite brisanje</v-card-title>
        <v-card-text>
          Da li ste sigurni da želite obrisati autora "{{ author?.naziv }}"?
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
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const props = defineProps({
  author: {
    type: Object,
    required: true
  },
  onEdit: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['deleted'])

const deleteDialog = ref(false)

const handleView = () => {
  navigateTo(`/author/${props.author.id}`)
}

const handleEdit = () => {
  props.onEdit(props.author)
}

const handleDelete = () => {
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    const { error } = await supabase
      .from('autori')
      .delete()
      .eq('id', props.author.id)

    if (error) throw error

    emit('deleted')
    deleteDialog.value = false
  } catch (err) {
    console.error('Greška pri brisanju autora:', err)
    emit('error', `Došlo je do greške pri brisanju: ${err.message}`)
  }
}
</script>