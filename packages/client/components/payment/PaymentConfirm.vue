<template>
  <div>
    <div class="payment-summary rounded pa-4 bg-grey-lighten-5 mb-4">
      <p class="text-h6 mb-3">選択プラン</p>
      <div class="d-flex justify-space-between mb-2">
        <span>プラン名</span>
        <span class="font-weight-medium">{{ planDetails?.name }}プラン</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>料金</span>
        <span class="font-weight-medium">{{ planDetails?.amount ? `¥${planDetails?.amount?.toLocaleString()}` : '¥0' }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>課金周期</span>
        <span class="font-weight-medium">{{ planDetails?.interval === 'month' ? '月額' : '年額' }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>初回請求額</span>
        <span class="font-weight-medium">{{ proRatedInitialBillingAmount }}</span>
      </div>
      <div v-if="!planDetails?.isDefault && paymentData" class="d-flex justify-space-between mb-2">
        <span>支払い方法</span>
        <span class="font-weight-medium">
          {{ paymentMethodDisplayName }}
          <span v-if="cardBrandDisplayName && cardLastFourDigits" class="text-grey-darken-1 ms-1">({{ cardBrandDisplayName }} **** {{ cardLastFourDigits }})</span>
        </span>
      </div>
    </div>
    
    <v-alert v-if="!planDetails?.isDefault" type="info" class="my-4" variant="tonal" density="compact">
      <p class="text-body-2 mb-0">
        <v-icon size="small" class="me-1">mdi-information-outline</v-icon>
        お支払いはサブスクリプション形式で、選択したプランの課金周期で自動更新されます。キャンセルはいつでもマイページから可能です。
      </p>
    </v-alert>
    
    <v-alert v-if="planDetails?.isDefault" type="warning" class="my-4" variant="tonal" density="compact">
      <p class="text-body-2 mb-0">
        <v-icon size="small" class="me-1">mdi-alert-circle-outline</v-icon>
        有料プランから基本プランに変更すると、現在のサブスクリプションが解約されます。有料プラン固有の機能は利用できなくなります。
      </p>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Plan, PaymentMethodData } from '~/types/payment'; // 共通の型定義をインポート

const props = defineProps({
  planDetails: {
    type: Object as () => Plan,
    required: true
  },
  paymentData: {
    type: Object as () => PaymentMethodData | null, // PaymentMethodData | null に変更
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 支払い方法の表示名
const paymentMethodDisplayName = computed(() => { // paymentMethod から paymentMethodDisplayName へ変更
  if (!props.paymentData) return '-';
  return props.paymentData.method === 'apple_pay' ? 'Apple Pay' : 'クレジットカード';
});

// カードブランドの表示名
const cardBrandDisplayName = computed(() => props.paymentData?.cardInfo?.brand || ''); // cardBrand から cardBrandDisplayName へ変更

// カード番号下4桁の表示
const cardLastFourDigits = computed(() => props.paymentData?.cardInfo?.last4 || ''); // cardLast4 から cardLastFourDigits へ変更

// 日割り計算された初回請求額（月末処理と月跨ぎを考慮）
const proRatedInitialBillingAmount = computed(() => { // calculateProRatedAmount から proRatedInitialBillingAmount へ変更
  if (!props.planDetails || props.planDetails.isDefault) return '¥0';

  const amount = props.planDetails.amount;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // 当月の日数を取得
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // 当月の残り日数を計算（今日を含む）
  const remainingDaysInCurrentMonth = daysInCurrentMonth - today.getDate() + 1;

  // 日割り金額の計算（小数点以下切り捨て）
  // 念のため、remainingDaysが0以下やdaysInMonthより大きくなるケースを防ぐ
  const validRemainingDays = Math.max(0, Math.min(remainingDaysInCurrentMonth, daysInCurrentMonth));
  const proRatedAmount = Math.floor(amount * (validRemainingDays / daysInCurrentMonth));
  
  // 請求期間の開始日と終了日を明確にする (例: 7月15日〜7月31日)
  const startDate = today.getDate();
  const endDate = daysInCurrentMonth;
  const billingPeriodDisplay = `${currentMonth + 1}月${startDate}日〜${currentMonth + 1}月${endDate}日 (${validRemainingDays}日分)`;

  return `¥${proRatedAmount.toLocaleString()}（${billingPeriodDisplay}）`;
});
</script>

<style scoped>
.bg-transparent {
  background-color: transparent !important;
}

.payjp-logo-placeholder {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  letter-spacing: 1px;
  opacity: 0.6;
  display: inline-block;
}

.payment-summary {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}
</style> 
