import { ref, readonly } from 'vue';

interface ModalOptions {
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'custom';
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'error' | 'warning' | 'info' | 'success';
  persistent?: boolean;
  maxWidth?: string;
}

interface ModalState {
  visible: boolean;
  options: ModalOptions | null;
  resolve: ((value: boolean) => void) | null;
}

interface SnackbarOptions {
  message: string;
  color?: 'success' | 'error' | 'warning' | 'info' | 'primary';
  timeout?: number;
}

interface SnackbarState {
  visible: boolean;
  options: SnackbarOptions | null;
}

const modalState = ref<ModalState>({
  visible: false,
  options: null,
  resolve: null,
});

const snackbarState = ref<SnackbarState>({
  visible: false,
  options: null,
});

const snackbarQueue = ref<SnackbarOptions[]>([]);

export const useGlobalModal = () => {
  // 基本的なモーダル表示関数
  const showModal = (options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      modalState.value = {
        visible: true,
        options: {
          type: 'confirm',
          confirmText: '確認',
          cancelText: 'キャンセル',
          color: 'primary',
          persistent: true,
          maxWidth: '450px',
          ...options,
        },
        resolve,
      };
    });
  };

  // プライマリカラーの確認モーダル
  const showPrimaryModal = (message: string, title: string = '確認'): Promise<boolean> => {
    return showModal({
      title,
      message,
      type: 'confirm',
      confirmText: '確認',
      cancelText: 'キャンセル',
      color: 'primary',
    });
  };

  // エラーカラーの確認モーダル（削除確認など）
  const showErrorModal = (message: string, title: string = '削除確認'): Promise<boolean> => {
    return showModal({
      title,
      message,
      type: 'confirm',
      confirmText: '削除',
      cancelText: 'キャンセル',
      color: 'error',
    });
  };

  // 警告カラーの確認モーダル
  const showWarningModal = (message: string, title: string = '警告'): Promise<boolean> => {
    return showModal({
      title,
      message,
      type: 'confirm',
      confirmText: '続行',
      cancelText: 'キャンセル',
      color: 'warning',
    });
  };

  // 情報カラーのアラートモーダル
  const showInfoModal = (message: string, title: string = '情報'): Promise<boolean> => {
    return showModal({
      title,
      message,
      type: 'alert',
      confirmText: 'OK',
      color: 'info',
    });
  };

  // 成功カラーのアラートモーダル
  const showSuccessModal = (message: string, title: string = '成功'): Promise<boolean> => {
    return showModal({
      title,
      message,
      type: 'alert',
      confirmText: 'OK',
      color: 'success',
    });
  };

  // 削除確認専用の便利関数
  const confirmDelete = (itemName: string, itemType: string = 'アイテム'): Promise<boolean> => {
    return showErrorModal(
      `${itemType}「${itemName}」を削除してもよろしいですか？`,
      `${itemType}削除の確認`
    );
  };

  // モーダルを閉じる
  const closeModal = (result: boolean = false) => {
    if (modalState.value.resolve) {
      modalState.value.resolve(result);
    }
    modalState.value = {
      visible: false,
      options: null,
      resolve: null,
    };
  };

  // 確認ボタンクリック
  const handleConfirm = () => {
    closeModal(true);
  };

  // キャンセルボタンクリック
  const handleCancel = () => {
    closeModal(false);
  };

  // Snackbar functions
  const showSnackbar = (options: SnackbarOptions) => {
    if (snackbarState.value.visible) {
      snackbarQueue.value.push(options);
      return;
    }

    snackbarState.value = {
      visible: true,
      options: {
        timeout: 4000,
        ...options,
      },
    };

    setTimeout(() => {
      closeSnackbar();
    }, snackbarState.value.options?.timeout || 4000);
  };

  const closeSnackbar = () => {
    snackbarState.value = {
      visible: false,
      options: null,
    };

    // Show next snackbar in queue
    if (snackbarQueue.value.length > 0) {
      const nextSnackbar = snackbarQueue.value.shift();
      if (nextSnackbar) {
        setTimeout(() => showSnackbar(nextSnackbar), 300);
      }
    }
  };

  // Convenience snackbar methods
  const showSuccessSnackbar = (message: string) => {
    showSnackbar({
      message,
      color: 'success',
    });
  };

  const showErrorSnackbar = (message: string) => {
    showSnackbar({
      message,
      color: 'error',
    });
  };

  const showWarningSnackbar = (message: string) => {
    showSnackbar({
      message,
      color: 'warning',
    });
  };

  const showInfoSnackbar = (message: string) => {
    showSnackbar({
      message,
      color: 'info',
    });
  };

  return {
    // Modal State
    modalState: readonly(modalState),
    
    // Modal Color-based methods
    showPrimaryModal,
    showErrorModal,
    showWarningModal,
    showInfoModal,
    showSuccessModal,
    
    // Modal Convenience methods
    confirmDelete,
    
    // Modal Control methods
    closeModal,
    handleConfirm,
    handleCancel,

    // Snackbar State
    snackbarState: readonly(snackbarState),

    // Snackbar methods
    showSnackbar,
    closeSnackbar,
    showSuccessSnackbar,
    showErrorSnackbar,
    showWarningSnackbar,
    showInfoSnackbar,
  };
}; 
