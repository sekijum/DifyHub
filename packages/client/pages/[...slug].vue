<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-icon">
        <div class="error-code">404</div>
      </div>
      
      <h1 class="text-h4 font-weight-medium text-center mb-3">ページが見つかりません</h1>
      
      <p class="text-body-1 text-center text-medium-emphasis mb-6">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      
      <div class="d-flex justify-center" style="gap: 24px;">
        <v-btn
          color="primary"
          rounded="lg"
          min-width="160"
          prepend-icon="mdi-home"
          @click="goToHome"
        >
          ホームに戻る
        </v-btn>
        
        <v-btn
          variant="outlined"
          rounded="lg"
          min-width="160"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          前に戻る
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { useNuxtApp } from 'nuxt/app';

definePageMeta({
  layout: 'default',
});

const router = useRouter();
const route = useRoute();
const nuxtApp = useNuxtApp();

// ユーザーが直接アクセスしたURLを記録
const requestedPath = route.path;

// ホームに戻る関数
const goToHome = () => {
  router.push('/');
};

// 戻る関数 - ステップを1つ戻す
const goBack = () => {
  // 前の画面に戻る
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    // 履歴がない場合はホームに戻る
    router.push('/');
  }
};

// マウント時にURLをコンソールに記録（デバッグ用）
onMounted(() => {
  console.log(`存在しないパスへのアクセス: ${requestedPath}`);
});
</script>

<style scoped>
.not-found-container {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.not-found-content {
  max-width: 500px;
  width: 100%;
  padding: 1rem;
  text-align: center;
}

.not-found-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.error-code {
  font-size: 96px;
  font-weight: 700;
  color: rgba(var(--v-theme-primary), 0.15);
  line-height: 1;
}

@media (max-width: 600px) {
  .not-found-container {
    padding: 1rem;
  }
}
</style> 
