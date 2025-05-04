<template>
  <v-snackbar
    v-model="toast.show"
    :color="toast.color"
    :timeout="toast.timeout"
    location="top"
  >
    {{ toast.message }}
    <template v-slot:actions>
      <v-btn
        icon="mdi-close"
        variant="text"
        @click="hideToast"
      ></v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toast, hideToast } = useToast();
</script> 
