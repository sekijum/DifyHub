<template>
  <v-dialog
    v-model="modalState.visible"
    :persistent="modalState.options?.persistent"
    :max-width="modalState.options?.maxWidth || '450px'"
  >
    <v-card v-if="modalState.options">
      <v-card-title class="text-h5">
        {{ modalState.options.title }}
      </v-card-title>
      
      <v-card-text>
        <div v-html="modalState.options.message"></div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        
        <!-- キャンセルボタン (confirmタイプの場合のみ表示) -->
        <v-btn
          v-if="modalState.options.type === 'confirm'"
          color="grey darken-1"
          variant="text"
          @click="handleCancel"
        >
          {{ modalState.options.cancelText || 'キャンセル' }}
        </v-btn>
        
        <!-- 確認ボタン -->
        <v-btn
          :color="modalState.options.color || 'primary'"
          variant="text"
          @click="handleConfirm"
        >
          {{ modalState.options.confirmText || '確認' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar -->
  <v-snackbar
    v-model="snackbarState.visible"
    :color="snackbarState.options?.color || 'primary'"
    :timeout="snackbarState.options?.timeout || 4000"
    location="bottom right"
    @update:model-value="!$event && closeSnackbar()"
  >
    <v-icon class="mr-2">
      {{ getSnackbarIcon(snackbarState.options?.color) }}
    </v-icon>
    {{ snackbarState.options?.message }}

    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="closeSnackbar"
        icon="mdi-close"
        size="small"
      ></v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useGlobalModal } from '~/composables/useGlobalModal';

const { 
  modalState, 
  handleConfirm, 
  handleCancel,
  snackbarState,
  closeSnackbar 
} = useGlobalModal();

// Helper function to get appropriate icon for snackbar color
const getSnackbarIcon = (color?: string) => {
  switch (color) {
    case 'success':
      return 'mdi-check-circle';
    case 'error':
      return 'mdi-alert-circle';
    case 'warning':
      return 'mdi-alert';
    case 'info':
      return 'mdi-information';
    default:
      return 'mdi-information';
  }
};
</script> 
