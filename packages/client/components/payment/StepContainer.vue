<template>
  <v-card class="step-container" variant="outlined">
    <v-card-title v-if="title" class="step-title d-flex align-center pa-4">
      <v-icon v-if="icon" :icon="icon" color="primary" class="me-2" size="24"></v-icon>
      <span class="text-h6">{{ title }}</span>
    </v-card-title>

    <v-divider v-if="title"></v-divider>
    
    <v-card-text class="pa-4">
      <slot></slot>
    </v-card-text>
    
    <v-card-actions v-if="$slots.actions" class="pa-4 pt-0">
      <slot name="actions"></slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.step-container {
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: white;
  overflow: hidden;
  transition: all 0.2s ease;
}

.step-title {
  font-weight: 500;
  background-color: rgba(0, 0, 0, 0.02);
}
</style> 
