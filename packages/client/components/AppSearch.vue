<template>
  <v-text-field
    v-model="model"
    :label="label"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
    density="compact"
    hide-details
    clearable
  ></v-text-field>
</template>

<script setup lang="ts">
// Use defineModel for v-model binding (Vue 3.4+)
// If using older Vue, use defineProps and defineEmits
const model = defineModel<string>();

defineProps({
  label: {
    type: String,
    default: '検索...'
  }
});
</script> 
