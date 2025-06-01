<template>
  <div class="payment-card">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    
    <!-- Apple Payコンポーネント -->
    <PaymentApplePay
      v-if="planDetails"
      :plan-name="planDetails.name"
      :amount="planDetails.amount"
      :loading="loading"
      @update:token="handleApplePayTokenUpdate"
      @update:error="handleApplePayErrorUpdate"
      @loading="$emit('loading', $event)"
    />
    
    <!-- クレジットカードフォーム -->
    <div class="mt-2 mb-6">
      <p class="text-subtitle-1 font-weight-medium mb-3">クレジットカード情報を入力</p>
      
      <div class="mb-4 card-brands">
        <v-icon class="me-2 text-primary">mdi-credit-card</v-icon>
        <span class="text-caption text-grey">Visa, Mastercard, JCB, AMEX, Discover など</span>
      </div>
      
      <!-- カード番号入力フィールド -->
      <div class="mb-5 card-form-container">
        <label for="cardNumber" class="text-body-2 text-grey-darken-1 mb-1 d-block">
          カード番号
          <v-icon
            v-if="isCardNumberComplete"
            icon="mdi-check-circle-outline"
            color="success"
            size="small"
            class="ms-1"
          ></v-icon>
        </label>
        <div id="cardNumber" class="card-field"></div>
      </div>
      
      <!-- 有効期限とセキュリティコードを包むコンテナ -->
      <div class="card-small-fields-container mb-4">
        <!-- 有効期限入力フィールド -->
        <div class="card-expiry-container">
          <label for="cardExpiry" class="text-body-2 text-grey-darken-1 mb-1 d-block">
            有効期限 (MM/YY)
            <v-icon
              v-if="isCardExpiryComplete"
              icon="mdi-check-circle-outline"
              color="success"
              size="small"
              class="ms-1"
            ></v-icon>
          </label>
          <div id="cardExpiry" class="card-field"></div>
        </div>
        
        <!-- セキュリティコード入力フィールド -->
        <div class="card-cvc-container">
          <label for="cardCvc" class="text-body-2 text-grey-darken-1 mb-1 d-block">
            セキュリティコード
            <v-icon
              v-if="isCardCvcComplete"
              icon="mdi-check-circle-outline"
              color="success"
              size="small"
              class="ms-1"
            ></v-icon>
          </label>
          <div id="cardCvc" class="card-field"></div>
        </div>
      </div>
      
      <p v-if="!areAllCardFieldsComplete && isPayJpInitialized" class="text-caption text-warning mb-4">
        <v-icon icon="mdi-information-outline" size="small" class="me-1"></v-icon>
        すべてのカード情報を入力してください
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits, defineProps, computed, onUnmounted, nextTick, watch } from 'vue';
import { useNuxtApp, useRuntimeConfig } from 'nuxt/app';
import PaymentApplePay from './PaymentApplePay.vue';
import type { Plan, PaymentMethodData } from '~/types/payment';

const props = defineProps({
  loading: { type: Boolean, default: false },
  planDetails: { type: Object as () => Plan | null, default: null }
});

const emit = defineEmits([
  'update:token',
  'update:error',
  'next-step',
  'loading',
  'update:card-complete'
]);

const config = useRuntimeConfig();
const payjpPublicKey = config.public.payjpPublicKey;

const error = ref('');
const isPayJpInitialized = ref(false);
const isCardNumberComplete = ref(false);
const isCardExpiryComplete = ref(false);
const isCardCvcComplete = ref(false);

let payjp: any = null;
let elements: any = null;
let cardNumberElement: any = null;
let cardExpiryElement: any = null;
let cardCvcElement: any = null;

const submittedTokenData = ref<PaymentMethodData | null>(null);

const areAllCardFieldsComplete = computed(() => {
  return isCardNumberComplete.value && isCardExpiryComplete.value && isCardCvcComplete.value;
});

watch(() => areAllCardFieldsComplete.value, (newValue) => {
  emit('update:card-complete', newValue);
});

onMounted(async () => {
  emit('loading', true);
  error.value = '';
  
  try {
    if (typeof (window as any).Payjp === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://js.pay.jp/v2/pay.js';
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('PAY.JP SDKの読み込みに失敗しました。'));
        document.head.appendChild(script);
      });
    }
    
    await nextTick();
    
    try {
      payjp = (window as any).Payjp(payjpPublicKey);
      elements = payjp.elements();
      
      cardNumberElement = elements.create('cardNumber', {
        placeholder: '4242 4242 4242 4242'
      });
      cardExpiryElement = elements.create('cardExpiry', {
        placeholder: 'MM/YY'
      });
      cardCvcElement = elements.create('cardCvc', {
        placeholder: 'CVC'
      });
      
      cardNumberElement.on('change', (e: any) => {
        isCardNumberComplete.value = e.complete;
        if (e.error) {
          error.value = e.error.message || 'カード番号の形式が正しくありません。';
        } else if (error.value && error.value.includes('カード番号')) {
          error.value = '';
        }
        if (e.complete && cardExpiryElement) {
          cardExpiryElement.focus();
        }
      });
      
      cardExpiryElement.on('change', (e: any) => {
        isCardExpiryComplete.value = e.complete;
        if (e.error) {
          error.value = e.error.message || '有効期限の形式が正しくありません。';
        } else if (error.value && error.value.includes('有効期限')) {
          error.value = '';
        }
        if (e.complete && cardCvcElement) {
          cardCvcElement.focus();
        }
      });
      
      cardCvcElement.on('change', (e: any) => {
        isCardCvcComplete.value = e.complete;
        if (e.error) {
          error.value = e.error.message || 'セキュリティコードの形式が正しくありません。';
        } else if (error.value && error.value.includes('セキュリティコード')) {
          error.value = '';
        }
      });
      
      cardNumberElement.mount('#cardNumber');
      cardExpiryElement.mount('#cardExpiry');
      cardCvcElement.mount('#cardCvc');
      
      isPayJpInitialized.value = true;
    } catch (initError: any) {
      console.error('PAY.JP Elements 初期化エラー:', initError);
      error.value = '決済システムの初期化に失敗しました。ページを再読み込みして解決しない場合は、サポートにご連絡ください。';
      throw initError;
    }
  } catch (err: any) {
    console.error('PAY.JP SDK読み込み/初期化エラー:', err);
    error.value = '決済システムの読み込みに失敗しました。ページを再読み込みしてください。';
    emit('update:error', error.value);
  } finally {
    emit('loading', false);
  }
});

onUnmounted(() => {
  if (cardNumberElement) {
    try {
      cardNumberElement.unmount();
    } catch (err) {
      console.warn('カード番号要素のアンマウントに失敗:', err);
    }
  }
  if (cardExpiryElement) {
    try {
      cardExpiryElement.unmount();
    } catch (err) {
      console.warn('有効期限要素のアンマウントに失敗:', err);
    }
  }
  if (cardCvcElement) {
    try {
      cardCvcElement.unmount();
    } catch (err) {
      console.warn('セキュリティコード要素のアンマウントに失敗:', err);
    }
  }
});

const submitCardDetails = async () => {
  if (!isPayJpInitialized.value || !payjp || !cardNumberElement || !cardExpiryElement || !cardCvcElement) {
    error.value = '決済システムが初期化されていません。ページを再読み込みしてください。';
    emit('update:error', error.value);
    return;
  }
  
  if (!areAllCardFieldsComplete.value) {
    error.value = 'すべてのカード情報を正しく入力してください。';
    emit('update:error', error.value);
    return;
  }
  
  emit('loading', true);
  error.value = '';
  emit('update:error', '');
  
  try {
    const result = await payjp.createToken(cardNumberElement);
    if (result.error) {
      error.value = result.error.message || 'カード情報のトークン化に失敗しました。入力内容をご確認ください。';
      emit('update:error', error.value);
      return;
    }
    
    submittedTokenData.value = {
      token: result.id,
      method: 'card',
      cardInfo: {
        brand: result.card?.brand,
        last4: result.card?.last4
      }
    };
    
    emit('update:token', submittedTokenData.value);
    emit('next-step');
  } catch (err: any) {
    console.error('カードトークン生成エラー:', err);
    error.value = err.message || 'カード情報の処理中に予期せぬエラーが発生しました。';
    emit('update:error', error.value);
  } finally {
    emit('loading', false);
  }
};

defineExpose({
  handleCardSubmit: submitCardDetails
});

const handleApplePayTokenUpdate = (data: PaymentMethodData): void => {
  submittedTokenData.value = data;
  emit('update:token', data);
  emit('next-step');
};

const handleApplePayErrorUpdate = (message: string): void => {
  error.value = message;
  emit('update:error', message);
};
</script>

<style scoped>
.card-field {
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  padding: 16px;
  height: 56px;
  transition: border-color 0.3s;
  display: flex;
  align-items: center;
  background-color: #fff;
}

.card-field:hover {
  border-color: rgba(0, 0, 0, 0.87);
}

.card-field:focus-within {
  border-color: var(--v-theme-primary);
  border-width: 2px;
  padding: 15px;
}

.card-small-fields-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.card-expiry-container, .card-cvc-container {
  flex: 1;
  min-width: 150px;
}

.payment-card {
  min-height: 360px;
}

@media (max-width: 600px) {
  .card-small-fields-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .card-expiry-container, .card-cvc-container {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .card-field {
    padding: 12px;
    height: 50px;
  }
  
  .card-field:focus-within {
    padding: 11px;
  }
}
</style> 
