<template>
  <div class="payment-container">
    <PageTitle title="プラン変更" class="text-center mb-6" />
    
    <!-- ローディングインジケーター -->
    <div v-if="isLoadingPlanDetails && !planDetails" class="d-flex justify-center align-center my-8">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>
    
    <!-- エラーメッセージ -->
    <v-alert v-if="errorMessage" type="error" class="my-4" variant="tonal" border="start">
      {{ errorMessage }}
    </v-alert>
    
    <!-- メインコンテンツ -->
    <v-row v-if="!isLoadingPlanDetails || planDetails" justify="center" class="payment-content">
      <v-col cols="12" sm="11" md="10" lg="8">
        <!-- プラン変更フローステッパー -->
        <client-only>
          <v-stepper v-model="currentStep" class="mb-6 elevation-0 stepper-border custom-stepper">
            <v-stepper-header>
              <v-stepper-item value="1" complete-icon="mdi-check" :complete="parseInt(currentStep) > 1" class="no-number">
                <v-icon size="small" class="me-1">mdi-format-list-checks</v-icon>
                プラン選択
              </v-stepper-item>
              
              <v-divider></v-divider>
              
              <!-- 有料プランの場合のみステップ2を表示 -->
              <template v-if="!planDetails?.isDefault">
                <v-stepper-item value="2" complete-icon="mdi-check" :complete="parseInt(currentStep) > 2" class="no-number">
                  <v-icon size="small" class="me-1">mdi-credit-card</v-icon>
                  お支払い
                </v-stepper-item>
                
                <v-divider></v-divider>
              </template>
              
              <v-stepper-item :value="getStepValue('confirm')" complete-icon="mdi-check" :complete="parseInt(currentStep) > parseInt(getStepValue('confirm'))" class="no-number">
                <v-icon size="small" class="me-1">mdi-clipboard-text</v-icon>
                確認
              </v-stepper-item>
              
              <v-divider></v-divider>
              
              <v-stepper-item :value="getStepValue('complete')" complete-icon="mdi-check" :complete="parseInt(currentStep) > parseInt(getStepValue('complete'))" class="no-number">
                <v-icon size="small" class="me-1">mdi-check-circle</v-icon>
                完了
              </v-stepper-item>
            </v-stepper-header>
          </v-stepper>
        </client-only>
        
        <!-- ステップコンテンツ -->
        <v-window v-model="currentStep" class="mt-6">
          <!-- Step 1: プラン選択（すでに選択済み） -->
          <v-window-item value="1">
            <StepContainer title="プラン選択" icon="mdi-check-circle-outline">
              <div class="text-center">
                <div class="plan-selected-icon mb-4">
                  <v-icon icon="mdi-check-circle" color="success" size="x-large"></v-icon>
                </div>
                <h3 class="text-h5 font-weight-bold mb-4">{{ planDetails?.name }}プランが選択されています</h3>
                <p class="text-body-1 mb-5">
                  {{ planDetails?.amount ? `料金: ¥${planDetails?.amount.toLocaleString()}` : '料金: ¥0' }} / 
                  {{ planDetails?.interval === 'month' ? '月' : '年' }}
                </p>
              </div>
              
              <template #actions>
                <StepNavigation
                  :current-step="1"
                  :back-text="'プラン選択に戻る'"
                  :next-text="'次へ進む'"
                  @back="navigateBackToPlanSelection"
                  @next="proceedToNextStep"
                />
              </template>
            </StepContainer>
          </v-window-item>
          
          <!-- Step 2: 支払い情報入力（無料プランの場合はスキップ） -->
          <v-window-item value="2">
            <!-- 無料プラン -->
            <div v-if="planDetails?.isDefault === true">
              <StepContainer title="お支払い確認" icon="mdi-credit-card-check-outline">
                <PaymentConfirm 
                  :plan-details="planDetails as Plan"
                  :loading="isProcessingPayment"
                  @complete="executePaymentProcess"
                  @prev-step="navigateToPreviousStep"
                />
                
                <template #actions>
                  <StepNavigation
                    :current-step="2"
                    :back-text="'戻る'"
                    :next-text="'確認する'"
                    :loading="isProcessingPayment"
                    @back="navigateToPreviousStep"
                    @next="executePaymentProcess"
                  />
                </template>
              </StepContainer>
            </div>
            
            <!-- 有料プラン -->
            <div v-else-if="planDetails && planDetails.isDefault === false">
              <StepContainer title="お支払い情報" icon="mdi-credit-card-outline">
                <PaymentCard 
                  ref="paymentCardComponentRef"
                  :loading="isProcessingPayment"
                  :plan-details="planDetails || undefined"
                  @update:token="handlePaymentMethodSelection"
                  @update:error="handlePaymentProcessingError"
                  @update:card-complete="updateCardInputCompletionStatus"
                  @loading="updatePaymentLoadingState"
                  @next-step="proceedAfterPaymentMethodSelection"
                />
                
                <template #actions>
                  <StepNavigation
                    :current-step="2"
                    :back-text="'戻る'"
                    :next-text="'次へ進む'"
                    :loading="isProcessingPayment"
                    :next-disabled="!isCardInputComplete"
                    @back="navigateToPreviousStep"
                    @next="processCardPaymentAndAdvance"
                  />
                </template>
              </StepContainer>
            </div>
            
            <!-- エラー状態 -->
            <div v-else>
              <StepContainer title="エラー" icon="mdi-alert-circle-outline">
                <v-alert type="warning" class="my-4" variant="tonal" border="start">
                  プラン情報の読み込みに問題が発生しました。時間をおいて再度お試しください。
                </v-alert>
                
                <template #actions>
                  <StepNavigation
                    :current-step="2"
                    :show-back-button="false"
                    :next-text="'プラン選択に戻る'"
                    @next="navigateBackToPlanSelection"
                  />
                </template>
              </StepContainer>
            </div>
          </v-window-item>
          
          <!-- Step 3: 確認画面（有料プランの場合）/ 完了画面（無料プランの場合） -->
          <v-window-item :value="getStepValue('confirm')">
            <!-- 無料プランの場合は完了画面 -->
            <div v-if="planDetails?.isDefault === true">
              <StepContainer title="変更完了" icon="mdi-check-decagram">
                <div class="text-center">
                  <div class="success-icon mb-5">
                    <v-icon icon="mdi-check-circle" color="success" size="48"></v-icon>
                  </div>
                  <h2 class="text-h5 font-weight-medium mb-4">変更完了</h2>
                  <p class="text-body-1 mb-5 text-medium-emphasis">
                    {{ planDetails.name }}プランへの変更が完了しました
                  </p>
                </div>
                
                <template #actions>
                  <StepNavigation
                    :current-step="getStepValue('confirm')"
                    :is-last-step="true"
                    :show-back-button="false"
                    :next-text="'マイページへ'"
                    @next="navigateToMypage"
                  />
                </template>
              </StepContainer>
            </div>
            
            <!-- 有料プランでカード情報未入力の場合 -->
            <div v-else-if="planDetails && planDetails.isDefault === false && !selectedPaymentMethodData">
              <StepContainer title="支払い情報が必要です" icon="mdi-alert-circle-outline">
                <v-alert type="warning" class="my-4" variant="tonal" border="start">
                  支払い情報が未入力です。お支払い情報を入力してください。
                </v-alert>
                
                <template #actions>
                  <StepNavigation
                    :current-step="getStepValue('confirm')"
                    :show-back-button="false"
                    :next-text="'支払い情報入力に戻る'"
                    @next="navigateToPreviousStep"
                  />
                </template>
              </StepContainer>
            </div>
            
            <!-- 有料プランの確認画面 -->
            <div v-else-if="planDetails && planDetails.isDefault === false">
              <StepContainer title="ご注文内容の確認" icon="mdi-clipboard-text-outline">
                <PaymentConfirm 
                  :plan-details="planDetails as Plan"
                  :payment-data="selectedPaymentMethodData || undefined"
                  :loading="isProcessingPayment"
                  @complete="executePaymentProcess"
                  @prev-step="navigateToPreviousStep"
                />
                
                <template #actions>
                  <StepNavigation
                    :current-step="getStepValue('confirm')"
                    :back-text="'戻る'"
                    :next-text="'支払いを確定する'"
                    :loading="isProcessingPayment"
                    :is-outlined="false"
                    @back="navigateToPreviousStep"
                    @next="executePaymentProcess"
                  />
                </template>
              </StepContainer>
            </div>
          </v-window-item>
          
          <!-- Step 4: 完了画面（有料プランの場合のみ） -->
          <v-window-item :value="getStepValue('complete')">
            <StepContainer title="変更完了" icon="mdi-check-decagram">
              <div class="text-center">
                <div class="success-icon mb-5">
                  <v-icon icon="mdi-check-circle" color="success" size="48"></v-icon>
                </div>
                <h2 class="text-h5 font-weight-medium mb-4">変更完了</h2>
                <p class="text-body-1 mb-5 text-medium-emphasis">
                  {{ planDetails?.name }}プランへの変更が完了しました
                </p>
              </div>
              
              <template #actions>
                <StepNavigation
                  :current-step="getStepValue('complete')"
                  :is-last-step="true"
                  :show-back-button="false"
                  :next-text="'マイページへ'"
                  @next="navigateToMypage"
                />
              </template>
            </StepContainer>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
    
    <!-- プラン情報なしエラー -->
    <v-row v-else-if="!isLoadingPlanDetails && !errorMessage && !planDetails" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-alert type="warning" class="my-6" variant="tonal" border="start">
          プラン情報の取得に失敗しました。プラン選択画面からお試しください。
        </v-alert>
        <div class="action-buttons mt-4">
          <v-btn 
            color="primary" 
            rounded="lg" 
            @click="navigateBackToPlanSelection" 
            min-width="160"
            height="48"
            class="action-button"
          >
            プラン選択に戻る
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 完了通知 -->
    <v-snackbar v-model="notificationSnackbar.show" :color="notificationSnackbar.color" timeout="3000" location="top">
      {{ notificationSnackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import PageTitle from '~/components/PageTitle.vue';
import PaymentCard from '~/components/payment/PaymentCard.vue';
import PaymentConfirm from '~/components/payment/PaymentConfirm.vue';
import StepContainer from '~/components/payment/StepContainer.vue';
import StepNavigation from '~/components/payment/StepNavigation.vue';
import type { Plan, PaymentMethodData, PaymentCardComponent } from '~/types/payment';

definePageMeta({
  layout: 'payment' as any,
});

const paymentCardComponentRef = ref<PaymentCardComponent | null>(null);

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

// 状態管理
const isLoadingPlanDetails = ref(true);
const errorMessage = ref('');
const isProcessingPayment = ref(false);
const planDetails = ref<Plan | null>(null);
const planNameFromRouteParam = ref('');
const currentStep = ref('1');
const selectedPaymentMethodData = ref<PaymentMethodData | null>(null);
const paymentSuccessMessage = ref('');
const isCardInputComplete = ref(false);

const notificationSnackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

// プラン種別に応じたステップ値を取得
const getStepValue = (stepType: 'confirm' | 'complete'): string => {
  if (planDetails.value?.isDefault) {
    // 無料プラン: 1(選択) -> 2(確認) -> 3(完了)
    return stepType === 'confirm' ? '2' : '3';
  } else {
    // 有料プラン: 1(選択) -> 2(支払い) -> 3(確認) -> 4(完了)
    return stepType === 'confirm' ? '3' : '4';
  }
};

// 前のステップに戻る
const navigateToPreviousStep = (): void => {
  const currentStepNum = parseInt(currentStep.value);
  if (currentStepNum > 1) {
    currentStep.value = String(currentStepNum - 1);
  }
};

// 次のステップに進む
const proceedToNextStep = (): void => {
  const currentStepNum = parseInt(currentStep.value);
  currentStep.value = String(currentStepNum + 1);
};

// プラン選択画面に戻る
const navigateBackToPlanSelection = (): void => {
  router.push('/plans');
};

// マイページに移動
const navigateToMypage = (): void => {
  router.push('/dashboard');
};

// 初期化処理
onMounted(() => {
  currentStep.value = '1';
  if (route.params.name) {
    planNameFromRouteParam.value = Array.isArray(route.params.name) 
      ? route.params.name[0] 
      : route.params.name as string;
    loadPlanDetailsByName();
  } else {
    errorMessage.value = 'プラン情報が不正です。プラン選択ページからお試しください。';
    isLoadingPlanDetails.value = false;
  }
});

// プラン詳細変更時の処理
watch(() => planDetails.value, (newPlan) => {
  if (newPlan) {
    // プラン情報が読み込まれたら、必ずステップ1から開始
    if (currentStep.value !== '1') {
      currentStep.value = '1';
    }
    // 有料プランで支払い情報が未入力の場合のチェック（確認画面以降でのみ）
    const confirmStepValue = getStepValue('confirm');
    const currentStepNum = parseInt(currentStep.value);
    const confirmStepNum = parseInt(confirmStepValue);
    
    if (newPlan.isDefault === false && currentStepNum >= confirmStepNum && !selectedPaymentMethodData.value) {
      setTimeout(() => {
        errorMessage.value = '支払い情報を入力してください。';
        currentStep.value = '2';
      }, 100);
    }
  }
});

// プラン詳細を取得
const loadPlanDetailsByName = async (): Promise<void> => {
  if (!planNameFromRouteParam.value) return;
  
  isLoadingPlanDetails.value = true;
  errorMessage.value = '';
  
  try {
    const response = await $api.get(`/user/plans/${encodeURIComponent(planNameFromRouteParam.value)}`);
    const planData = response.data;
    
    if (planData) {
      // プラン種別の判定と正規化
      if (planData.name.toLowerCase().includes('pro')) {
        planData.isDefault = false;
      } else {
        const isFreeOrDefaultPlan = 
          (planData.name.toLowerCase().includes('free') || 
          planData.amount === 0 || 
          !planData.payjpPlanId);
        
        if (isFreeOrDefaultPlan && !planData.isDefault) {
          planData.isDefault = true;
        } else if (!isFreeOrDefaultPlan && planData.isDefault) {
          planData.isDefault = false;
        }
      }
      
      // 機能一覧の設定
      if (!planData.features || !planData.features.additionalFeatures) {
        planData.features = {
          additionalFeatures: planData.isDefault 
            ? ['+基本機能', '+無料チャット', '-高度な生成機能', '-カスタマイズ機能', '-優先サポート']
            : ['+基本機能', '+無料チャット', '+高度な生成機能', '+カスタマイズ機能', '+優先サポート']
        };
      }
      
      planDetails.value = planData;
    } else {
      router.push('/404');
    }
  } catch (err: any) {
    if (err.response?.status === 404) {
      router.push('/404');
    } else {
      errorMessage.value = 'プラン情報の取得に失敗しました。時間をおいて再度お試しください。';
    }
  } finally {
    isLoadingPlanDetails.value = false;
  }
};

// 決済処理の状態を更新
const updatePaymentLoadingState = (isLoading: boolean): void => {
  isProcessingPayment.value = isLoading;
};

// 支払い方法が選択された時の処理
const handlePaymentMethodSelection = (tokenData: PaymentMethodData): void => {
  if (!tokenData || !tokenData.token) {
    errorMessage.value = '支払い情報の取得に失敗しました。再度お試しください。';
    return;
  }
  selectedPaymentMethodData.value = {
    token: tokenData.token,
    method: tokenData.method || 'card',
    cardInfo: tokenData.cardInfo || undefined
  };
  errorMessage.value = '';
};

// 決済エラー時の処理
const handlePaymentProcessingError = (errorMsg: string): void => {
  errorMessage.value = errorMsg;
};

// 決済確認・実行処理
const executePaymentProcess = async (): Promise<void> => {
  if (!planDetails.value) {
    errorMessage.value = 'プラン情報が不完全です。最初からやり直してください。';
    return;
  }
  
  isProcessingPayment.value = true;
  errorMessage.value = '';
  
  try {
    const isFreePlan = planDetails.value.isDefault === true;
    const payload: { planName: string; cardToken?: string } = {
      planName: planDetails.value.name
    };
    
    if (!isFreePlan) {
      if (!selectedPaymentMethodData.value) {
        errorMessage.value = '支払い情報が選択されていません。お支払い方法を選択してください。';
        isProcessingPayment.value = false;
        currentStep.value = '2';
        return;
      }
      payload.cardToken = selectedPaymentMethodData.value.token;
    }
    
    const response = await $api.patch('/me/plan', payload);
    paymentSuccessMessage.value = response.data.message || `${planDetails.value.name}プランへの変更が完了しました`;
    
    notificationSnackbar.text = paymentSuccessMessage.value;
    notificationSnackbar.color = 'success';
    notificationSnackbar.show = true;
    
    isProcessingPayment.value = false;
    
    setTimeout(() => {
      currentStep.value = getStepValue('complete');
    }, 200);
  } catch (err: any) {
    const responseMessage = err.response?.data?.message;
    if (err.response?.status === 400 && responseMessage) {
      errorMessage.value = responseMessage;
    } else if (responseMessage && responseMessage.includes('既に加入しています')) {
      paymentSuccessMessage.value = `${planDetails.value?.name}プランには既に加入されています。`;
      notificationSnackbar.text = paymentSuccessMessage.value;
      notificationSnackbar.color = 'info';
      notificationSnackbar.show = true;
      errorMessage.value = '';
      setTimeout(() => {
        currentStep.value = getStepValue('complete');
      }, 200);
      isProcessingPayment.value = false;
      return;
    } else {
      errorMessage.value = 'プラン更新処理中に予期せぬエラーが発生しました。サポートにお問い合わせください。';
    }
  } finally {
    isProcessingPayment.value = false;
  }
};

// 支払い方法選択後の次ステップ処理
const proceedAfterPaymentMethodSelection = (): void => {
  if (planDetails.value?.isDefault) {
    currentStep.value = getStepValue('confirm');
  } else {
    isProcessingPayment.value = false;
    if (!selectedPaymentMethodData.value || !selectedPaymentMethodData.value.token) {
      errorMessage.value = '支払い情報の取得に失敗しました。カード情報を再入力してください。';
      return;
    }
    currentStep.value = getStepValue('confirm');
  }
};

// カード情報処理
const processCardPaymentAndAdvance = async (): Promise<void> => {
  if (!paymentCardComponentRef.value) return;
  
  try {
    isProcessingPayment.value = true;
    await paymentCardComponentRef.value.handleCardSubmit();
  } catch (err: any) {
    // カード処理エラーはPaymentCardコンポーネント内で処理される
  } finally {
    isProcessingPayment.value = false;
  }
};

// カード情報処理完了時の処理
const updateCardInputCompletionStatus = (isComplete: boolean): void => {
  isCardInputComplete.value = isComplete;
};
</script>

<style scoped>
.payment-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

.payment-content {
  margin-bottom: 2rem;
}

/* ステッパーのスタイル */
.stepper-border {
  box-shadow: none !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.v-stepper-header) {
  box-shadow: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.v-stepper-item) {
  padding: 12px 16px;
}

/* ステッパーの番号を非表示 */
:deep(.v-stepper-item__avatar) {
  display: none !important;
}

/* カスタムステッパースタイル */
:deep(.custom-stepper .v-stepper-item.no-number) {
  padding-left: 16px;
}

:deep(.custom-stepper .v-stepper-item .v-stepper-item__avatar) {
  display: none !important;
}

:deep(.custom-stepper .v-stepper-item--complete .v-stepper-item__content),
:deep(.custom-stepper .v-stepper-item--active .v-stepper-item__content) {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

:deep(.custom-stepper .v-stepper-item--inactive .v-stepper-item__content) {
  color: rgba(0, 0, 0, 0.6);
}

:deep(.v-stepper-item--complete),
:deep(.v-stepper-item--active) {
  color: rgb(var(--v-theme-primary));
}

/* アイコンスタイル */
.plan-selected-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto;
  background-color: rgba(var(--v-theme-success), 0.08);
  border-radius: 50%;
}

.success-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  background-color: rgba(var(--v-theme-success), 0.08);
  border-radius: 50%;
}

:deep(.v-alert) {
  font-size: 0.95rem;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .payment-container {
    padding: 0 8px;
  }
  
  :deep(.v-stepper-item) {
    padding: 8px 6px;
    font-size: 0.85rem;
  }
  
  :deep(.custom-stepper .v-stepper-item.no-number) {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style> 
