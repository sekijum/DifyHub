<template>
  <div>
    <v-chip-group
      v-model="selectedValue"
      column
      mandatory
      active-class="text-primary"
      class="ma-0"
      @update:model-value="$emit('update:modelValue', selectedValue)"
    >
      <!-- 固定カテゴリー -->
      <v-chip key="latest" value="最新" filter>最新</v-chip>
      <v-chip key="trending" value="トレンド" filter>トレンド</v-chip>
      
      <!-- APIから取得したカテゴリ -->
      <v-chip
        v-for="category in categories"
        :key="category.id"
        :value="category.name"
        filter
      >
        {{ category.name }} ({{ category.appCount }})
      </v-chip>
    </v-chip-group>
    
    <!-- カテゴリ読み込みエラー表示 -->
    <v-alert v-if="error" type="warning" density="compact" variant="text" class="mt-1 pa-0">
      人気カテゴリの読み込みに失敗しました。
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CategoryDto } from '~/types/app';

interface Props {
  modelValue: string | null;
  categories: CategoryDto[];
  loading?: boolean;
  error?: Error | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const selectedValue = ref<string | null>(props.modelValue);

// モデル値の変更を監視
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue;
});

// 選択されたカテゴリーが削除された場合、デフォルトの「トレンド」に戻す
watch(() => props.categories, (newCategories) => {
  if (selectedValue.value && selectedValue.value !== 'トレンド' && selectedValue.value !== '最新') {
    if (!newCategories.some(c => c.name === selectedValue.value)) {
      console.warn(`Selected category '${selectedValue.value}' no longer exists. Resetting to 'トレンド'.`);
      selectedValue.value = 'トレンド';
      emit('update:modelValue', selectedValue.value);
    }
  }
}, { deep: true });
</script> 
