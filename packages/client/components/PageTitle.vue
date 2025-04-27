<template>
  <div class="page-title-container pa-4 pb-0">
    <h1 class="text-h5 font-weight-medium mb-1">{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.page-title-container {
  /* Optional: Add subtle background if needed */
  /* background-color: rgba(var(--v-theme-on-surface), 0.02); */
  /* border-radius: 4px; */
}
</style> 
