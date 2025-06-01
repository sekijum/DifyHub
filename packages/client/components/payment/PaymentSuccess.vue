<template>
  <v-card elevation="3" class="text-center py-6">
    <v-card-text>
      <v-icon
        icon="mdi-check-circle"
        color="success"
        size="x-large"
        class="mb-4"
      ></v-icon>
      
      <h2 class="text-h5 font-weight-bold mb-4">
        プラン変更が完了しました
      </h2>
      
      <p class="text-body-1 mb-5">
        {{ planDetails?.name }}プランへの変更手続きが完了しました。<br>
        ご利用ありがとうございます。
      </p>
      
      <v-chip
        color="primary"
        variant="elevated"
        class="mb-5 px-4 py-3"
        size="large"
      >
        {{ planDetails?.name }}プラン
      </v-chip>
      
      <div class="d-flex justify-center align-center">
        <v-btn
          color="primary"
          variant="outlined"
          min-width="160"
          class="mx-2"
          @click="navigateToDashboardOrPath('/plans')"
        >
          プラン一覧へ
        </v-btn>
        
        <v-btn
          color="primary"
          variant="elevated"
          min-width="160"
          class="mx-2"
          @click="navigateToDashboardOrPath('/mypage')"
        >
          マイページへ
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { Plan } from '~/types/payment'; // 共通の型定義をインポート

// プランの型定義 (削除)
// interface PlanFeatures { ... }
// interface Plan { ... }

const props = defineProps({
  planDetails: {
    type: Object as () => Plan | null, // Plan | null に変更
    required: true
  },
  message: {
    type: String,
    default: ''
  }
});

const router = useRouter();

// ページ遷移 (navigateToDashboardOrPath に変更)
const navigateToDashboardOrPath = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.bg-transparent {
  background-color: transparent !important;
}
</style> 
