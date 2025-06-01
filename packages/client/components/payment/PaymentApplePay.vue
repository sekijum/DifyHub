<template>
  <div v-if="isApplePayAvailable" class="apple-pay-container">
    <p class="text-subtitle-1 font-weight-medium mb-2">Apple Payで支払う</p>
    <div id="apple-pay-button" class="apple-pay-button apple-pay-button-black" @click="processApplePayPayment"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits, defineProps, nextTick } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import type { PaymentMethodData } from '~/types/payment';

const props = defineProps({
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:token',
  'update:error',
  'loading'
]);

const config = useRuntimeConfig();
const payjpPublicKey = config.public.payjpPublicKey;

const isApplePayAvailable = ref(false);
const isPayJpScriptInitialized = ref(false);
let payjp: any = null;

onMounted(async () => {
  try {
    if (typeof (window as any).Payjp === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://js.pay.jp/v2/pay.js';
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Apple Pay: PAY.JP SDKの読み込みに失敗しました。'));
        document.head.appendChild(script);
      });
    }
    
    await nextTick();
    
    if ((window as any).payjpInstance) {
      payjp = (window as any).payjpInstance;
    } else {
      payjp = (window as any).Payjp(payjpPublicKey);
      (window as any).payjpInstance = payjp;
    }
    
    checkApplePayAvailability();
    isPayJpScriptInitialized.value = true;
  } catch (err) {
    console.error('Apple Pay 初期化エラー:', err);
    emit('update:error', 'Apple Payの初期化に失敗しました。ブラウザが対応していないか、設定を確認してください。');
  }
});

const checkApplePayAvailability = () => {
  if (!payjp || !payjp.applePay) {
    isApplePayAvailable.value = false;
    return;
  }
  
  try {
    payjp.applePay.checkAvailability((available: boolean) => {
      isApplePayAvailable.value = available;
    });
  } catch (err) {
    console.error('Apple Pay 利用可否チェックエラー:', err);
    isApplePayAvailable.value = false;
  }
};

const processApplePayPayment = () => {
  if (!isPayJpScriptInitialized.value || !payjp || !payjp.applePay) {
    emit('update:error', 'Apple Payが正しく初期化されていません。');
    return;
  }
  if (!isApplePayAvailable.value) {
    emit('update:error', 'お使いのブラウザまたはデバイスは現在Apple Payに対応していません。');
    return;
  }
  
  emit('loading', true);
  
  try {
    const paymentRequest = {
      countryCode: 'JP',
      currencyCode: 'JPY',
      total: {
        label: `${props.planName}プラン`,
        amount: props.amount.toString()
      }
    };
    
    const session = payjp.applePay.buildSession(
      paymentRequest, 
      (result: any) => {
        if (result && result.token && result.token.id) {
          const tokenData: PaymentMethodData = {
            token: result.token.id,
            method: 'apple_pay',
            cardInfo: {
              brand: result.token.card?.brand,
              last4: result.token.card?.last4
            }
          };
          emit('update:token', tokenData);
        }
        session.completePayment((window as any).ApplePaySession.STATUS_SUCCESS);
        emit('loading', false);
      }, 
      (applePayError: any) => {
        console.error('Apple Pay 処理エラー詳細:', applePayError);
        emit('update:error', applePayError.message || 'Apple Payでの支払い処理中にエラーが発生しました。');
        emit('loading', false);
      }
    );
    session.begin();
  } catch (err: any) {
    console.error('Apple Pay 実行時エラー:', err);
    emit('update:error', err.message || 'Apple Payの実行中に予期せぬエラーが発生しました。');
    emit('loading', false);
  }
};
</script>

<style scoped>
/* Apple Payボタンスタイル - PAY.JPドキュメントに準拠 */
@supports (-webkit-appearance: -apple-pay-button) {
  .apple-pay-button {
    display: inline-block;
    -webkit-appearance: -apple-pay-button;
    width: 100%;
    min-height: 48px;
  }
  .apple-pay-button-black {
    -apple-pay-button-style: black;
  }
}
@supports not (-webkit-appearance: -apple-pay-button) {
  .apple-pay-button {
    display: inline-block;
    background-size: 100% 60%;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    border-radius: 5px;
    padding: 0px;
    box-sizing: border-box;
    min-width: 200px;
    min-height: 48px;
    max-height: 64px;
    width: 100%;
  }
  .apple-pay-button-black {
    background-image: -webkit-named-image(apple-pay-logo-white);
    background-color: black;
  }
}

.apple-pay-container {
  margin-bottom: 20px;
}
</style> 
