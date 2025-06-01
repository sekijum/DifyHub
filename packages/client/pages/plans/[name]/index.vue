<template>
  <div>
    <div class="d-flex justify-center align-center my-8">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  // パスパラメータからプラン名を取得
  const planName = route.params.name;
  if (!planName) {
    // プラン名がない場合はプラン一覧に戻る
    router.push('/plans');
    return;
  }

  // プラン名をそのままURLパスとして使用し、paymentページに遷移
  router.push(`/plans/${encodeURIComponent(Array.isArray(planName) ? planName[0] : planName)}/payment`);
});
</script> 
