<template>
    <v-container fluid class="px-4">
      <!-- Notification Section -->
      <v-row pt-0 mt-0 px-0 pb-4>
        <v-col cols="12">
          <v-alert
            type="info"
            title="セキュリティ強化のお知らせ"
            variant="tonal"
            prominent
            border="start"
            density="compact"
          >
            セキュリティ向上のため、一部の決済処理において3Dセキュア（本人認証サービス）による追加認証が必要になる場合がございます。ご理解とご協力をお願いいたします。
          </v-alert>
        </v-col>
      </v-row>
  
      <PageTitle title="料金プラン" />
      
      <!-- ローディングインジケーター -->
      <div v-if="isLoadingPlans" class="d-flex justify-center align-center my-8">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      </div>
      
      <!-- エラーメッセージ -->
      <v-alert v-if="planFetchError" type="error" class="my-4">
        {{ planFetchError }}
      </v-alert>
      
      <!-- プラン選択コンテンツ -->
      <v-row v-if="!isLoadingPlans && !planFetchError && availablePlans.length > 0" justify="center">
        <!-- プラン概要 -->
        <v-col cols="12" class="text-center mb-8">
          <h2 class="text-h5 font-weight-bold mb-4">あなたのニーズに合ったプランをお選びください</h2>
          <p class="text-body-1 mx-auto" style="max-width: 800px;">
            すべてのプランには基本機能が含まれています。より高度な機能や容量が必要な場合は、
            有料プランへのアップグレードをご検討ください。
          </p>
          
          <v-alert v-if="currentUserPlanName" color="info" variant="tonal" class="mt-6 mx-auto" max-width="600px" density="comfortable">
            <div class="d-flex align-center">
              <v-icon icon="mdi-information-outline" class="mr-3"></v-icon>
              <div>
                <p class="font-weight-medium mb-1">現在のプラン: {{ currentUserPlanName }}</p>
                <p class="text-body-2 mb-0">別のプランを選択すると、プラン変更の手続きに進みます。</p>
              </div>
            </div>
          </v-alert>
        </v-col>
        
        <!-- プランカード -->
        <v-col 
          v-for="plan in availablePlans" 
          :key="plan.id" 
          cols="12" 
          sm="6" 
          md="4" 
          class="mb-6"
        >
          <v-card 
            :class="[
              'h-100 plan-card d-flex flex-column', 
              isCurrentPlan(plan) ? 'plan-card--current border-primary' : ''
            ]" 
            :elevation="isCurrentPlan(plan) ? 4 : 2"
          >
            <v-card-item>
              <v-card-title class="text-h5 pb-0">{{ plan.name }}</v-card-title>
              <v-card-subtitle class="pt-2">
                <span v-if="plan.amount" class="text-h6">¥{{ plan.amount.toLocaleString() }}</span>
                <span v-else class="text-h6">¥0</span>
                <span class="text-subtitle-1">/ {{ plan.interval === 'month' ? '月' : '年' }}</span>
              </v-card-subtitle>
            </v-card-item>
            
            <v-card-text class="flex-grow-1">
              <v-divider class="my-3"></v-divider>
              
              <!-- 機能リスト -->
              <v-list density="compact" class="bg-transparent">
                <template v-if="plan.features && plan.features.additionalFeatures">
                  <v-list-item 
                    v-for="(feature, idx) in getFeaturesList(plan.features.additionalFeatures)" 
                    :key="idx"
                    :prepend-icon="feature.includes ? 'mdi-check-circle' : 'mdi-close-circle'"
                    :prepend-icon-color="feature.includes ? 'success' : 'error'"
                    class="py-2"
                  >
                    {{ feature.text }}
                  </v-list-item>
                </template>
              </v-list>
            </v-card-text>
            
            <v-card-actions class="pa-4 pt-0">
              <v-btn 
                v-if="isCurrentPlan(plan)"
                variant="outlined" 
                color="primary"
                block
                disabled
              >
                現在のプラン
              </v-btn>
              <v-btn 
                v-else
                variant="elevated" 
                color="primary"
                block
                @click="proceedToPlanPayment(plan)"
              >
                このプランを選択
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- プランがない場合 -->
      <v-row v-else-if="!isLoadingPlans && !planFetchError && availablePlans.length === 0" justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-alert type="info" class="my-6">
            現在、利用可能なプランはありません。後ほど再度お試しください。
          </v-alert>
        </v-col>
      </v-row>
      
      <!-- 質問などがある場合の連絡先 -->
      <v-row justify="center" class="mt-8">
        <v-col cols="12" class="text-center">
          <v-divider class="mb-6"></v-divider>
          <p class="text-body-2 text-grey-darken-1">
            料金プランについてご質問がある場合は、
            <a href="mailto:support@example.com" class="text-decoration-none">support@example.com</a>
            までお問い合わせください。
          </p>
        </v-col>
      </v-row>
      
      <!-- 完了通知 -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { useNuxtApp } from 'nuxt/app';
  import { useRouter } from 'vue-router';
  import PageTitle from '~/components/PageTitle.vue';
  import { useMeApi } from '~/composables/useMeApi';
  import type { Plan, PlanFeature } from '~/types/payment'; // 共通の型定義をインポート
  
  const { $api } = useNuxtApp();
  const router = useRouter();
  const meApi = useMeApi();
  
  const isLoadingPlans = ref(false); // loading から isLoadingPlans へ変更
  const planFetchError = ref(''); // error から planFetchError へ変更
  const availablePlans = ref<Plan[]>([]); // plans から availablePlans へ変更
  const currentUserPlanName = ref(''); // currentPlanName から currentUserPlanName へ変更
  
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success'
  });
  
  // 現在のユーザープロフィール取得
  const fetchCurrentUserProfile = async () => {
    try {
      const { data } = await meApi.findMyProfile();
      if (data && data.planName) {
        currentUserPlanName.value = data.planName;
      }
    } catch (err) {
      // プロフィール取得エラーはスナックバー等でユーザーに通知せず、コンソールエラーに留める
      console.error('ユーザープロフィールの取得に失敗しました:', err);
    }
  };
  
  // APIからプラン一覧を取得
  const fetchAvailablePlans = async () => {
    isLoadingPlans.value = true;
    planFetchError.value = '';
    
    try {
      const response = await $api.get('/user/plans');
      // APIレスポンスの形式に合わせて調整 (response.data.data の存在をチェック)
      const plansData = response.data?.data || response.data || [];
      availablePlans.value = plansData.map((plan: any) => { // planにany型を使用している箇所は改善の余地あり
        const isFreePlan = 
          plan.name.toLowerCase().includes('free') || 
          plan.amount === 0 || 
          !plan.payjpPlanId;
        
        return {
          ...plan,
          isDefault: plan.isDefault !== undefined ? plan.isDefault : isFreePlan, // isDefaultが未定義なら計算
          features: plan.features || {
            additionalFeatures: isFreePlan
              ? ['+基本機能', '+無料チャット', '-高度な生成機能', '-カスタマイズ機能', '-優先サポート']
              : ['+基本機能', '+無料チャット', '+高度な生成機能', '+カスタマイズ機能', '+優先サポート']
          }
        };
      });
    } catch (err) {
      console.error('料金プランの取得エラー:', err); // 開発用ログは残す
      planFetchError.value = '料金プランの取得中にエラーが発生しました。時間をおいて再度お試しください。';
    } finally {
      isLoadingPlans.value = false;
    }
  };
  
  // コンポーネントマウント時にデータ取得
  onMounted(async () => {
    await fetchCurrentUserProfile();
    await fetchAvailablePlans();
  });
  
  // 機能リストを「含む」「除く」で整形
  const getFeaturesList = (features: string[]): PlanFeature[] => {
    if (!features || !Array.isArray(features)) return [];
    
    return features.map(feature => {
      const includes = !feature.startsWith('-');
      const text = feature.startsWith('+') 
        ? feature.substring(1) 
        : feature.startsWith('-') 
          ? feature.substring(1) 
          : feature;
      
      return { includes, text };
    });
  };
  
  // 現在のプランかどうかを判定
  const isCurrentPlan = (plan: Plan): boolean => {
    return plan.name.toLowerCase() === currentUserPlanName.value.toLowerCase();
  };
  
  // プラン選択時の処理
  const proceedToPlanPayment = async (plan: Plan): Promise<void> => {
    // 現在のプランと同じ場合は何もしない
    if (isCurrentPlan(plan)) {
      snackbar.text = 'すでに現在ご利用中のプランです。';
      snackbar.color = 'info';
      snackbar.show = true;
      return;
    }

    console.log('選択したプラン詳細:', plan, 'isDefault:', plan.isDefault);

    // プラン名をパスパラメータとして渡す
    router.push(`/plans/${encodeURIComponent(plan.name)}`);
  };
  </script>
  
  <style scoped>
  .bg-transparent {
    background-color: transparent !important;
  }
  
  .plan-card {
    transition: all 0.3s ease;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
  }
  
  .plan-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1) !important;
  }
  
  .plan-card--current {
    border: 2px solid var(--v-primary-base) !important;
  }
  
  .border-primary {
    border-color: var(--v-primary-base) !important;
  }
  </style> 
  