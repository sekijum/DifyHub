<template>
  <div class="step-navigation" :class="{ 'justify-end': !showBackButton }">
    <!-- 戻るボタン -->
    <v-btn 
      v-if="showBackButton"
      variant="outlined" 
      rounded="lg" 
      @click="handleBack" 
      min-width="120"
      height="48"
      class="navigation-button back-button"
      :disabled="loading || backDisabled"
      color="secondary"
    >
      <v-icon left class="me-1">mdi-arrow-left</v-icon>
      {{ backText }}
    </v-btn>
    
    <!-- 進むボタン -->
    <v-btn 
      color="primary" 
      :variant="isOutlined ? 'outlined' : 'elevated'" 
      rounded="lg" 
      @click="handleNext" 
      min-width="140"
      height="48"
      class="navigation-button next-button"
      :loading="loading"
      :disabled="nextDisabled"
      :block="!showBackButton"
    >
      {{ nextText }}
      <v-icon v-if="!isLastStep" right class="ms-1">mdi-arrow-right</v-icon>
      <v-icon v-else right class="ms-1">mdi-check</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  // ステップ関連
  currentStep: { type: [String, Number], default: 1 },
  isLastStep: { type: Boolean, default: false },
  
  // ボタン表示制御
  showBackButton: { type: Boolean, default: true },
  nextDisabled: { type: Boolean, default: false },
  backDisabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  isOutlined: { type: Boolean, default: false },
  
  // ボタンテキスト
  backText: { type: String, default: '戻る' },
  nextText: { type: String, default: '次へ進む' }
});

const emit = defineEmits(['back', 'next']);

// 戻るボタンのハンドラー
const handleBack = () => {
  emit('back');
};

// 進むボタンのハンドラー
const handleNext = () => {
  emit('next');
};
</script>

<style scoped>
.step-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
  margin-top: 24px;
}

.navigation-button {
  letter-spacing: 0.25px;
  font-weight: 500;
  text-transform: none;
}

.back-button {
  border: 1px solid rgba(0, 0, 0, 0.23);
}

.next-button {
  font-weight: 600;
}

/* 戻るボタンが非表示の場合 */
.justify-end {
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .step-navigation {
    flex-direction: column-reverse;
  }
  
  .navigation-button {
    width: 100%;
  }
}
</style> 
