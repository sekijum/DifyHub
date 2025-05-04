import { ref } from 'vue';

interface ToastState {
  show: boolean;
  message: string;
  color: string;
  timeout?: number;
}

// デフォルトのトースト表示時間（ミリ秒）
const DEFAULT_TIMEOUT = 3000;

export function useToast() {
  const toast = ref<ToastState>({
    show: false,
    message: '',
    color: 'success',
    timeout: DEFAULT_TIMEOUT,
  });

  // 成功メッセージを表示
  const showSuccessToast = (message: string, timeout?: number) => {
    toast.value = {
      show: true,
      message,
      color: 'success',
      timeout: timeout || DEFAULT_TIMEOUT,
    };
  };

  // エラーメッセージを表示
  const showErrorToast = (message: string, timeout?: number) => {
    toast.value = {
      show: true,
      message,
      color: 'error',
      timeout: timeout || DEFAULT_TIMEOUT,
    };
  };

  // 警告メッセージを表示
  const showWarningToast = (message: string, timeout?: number) => {
    toast.value = {
      show: true,
      message,
      color: 'warning',
      timeout: timeout || DEFAULT_TIMEOUT,
    };
  };

  // 情報メッセージを表示
  const showInfoToast = (message: string, timeout?: number) => {
    toast.value = {
      show: true,
      message,
      color: 'info',
      timeout: timeout || DEFAULT_TIMEOUT,
    };
  };

  // トーストを非表示
  const hideToast = () => {
    toast.value.show = false;
  };

  return {
    toast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    hideToast,
  };
} 
