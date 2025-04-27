<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue')" persistent max-width="400">
    <v-card>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :color="cancelColor" text @click="$emit('update:modelValue', false)">
          {{ cancelText }}
        </v-btn>
        <v-btn :color="confirmColor" text @click="confirm">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
}

withDefaults(defineProps<Props>(), {
  title: '確認',
  message: '実行してもよろしいですか？',
  confirmText: 'はい',
  cancelText: 'いいえ',
  confirmColor: 'primary',
  cancelColor: 'grey darken-1',
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const confirm = () => {
  emit('confirm');
  emit('update:modelValue', false); // Close dialog after confirm
};
</script> 
