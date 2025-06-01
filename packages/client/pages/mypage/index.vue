<template>
  <v-container>
    <PageTitle title="マイページ" />

    <!-- Loading Indicator -->
    <v-row v-if="isLoading" justify="center" class="my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <v-row v-if="!isLoading">
      <v-col cols="12">
        <!-- Profile Card -->
        <v-card variant="outlined" class="mb-6">
          <v-card-text class="text-center pa-4">
            <!-- Avatar Display and Change Button -->
            <div class="avatar-container mx-auto mb-4" style="position: relative; width: 120px; height: 120px;">
              <v-avatar size="120" color="grey-lighten-2">
                <v-img :src="avatarPreviewUrl || userAvatarUrl || defaultAvatar" alt="User Avatar"></v-img>
              </v-avatar>
              <v-btn
                icon
                size="small"
                color="primary"
                style="position: absolute; bottom: 0; right: 0;"
                @click="triggerFileInput"
                title="アバターを変更"
                :disabled="isSavingAvatar"
              >
                <v-icon>mdi-camera</v-icon>
              </v-btn>
            </div>
            <!-- Hidden File Input -->
            <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="onFileChange"
                style="display: none;"
             />
             <!-- Save Button for Avatar -->
             <div v-if="selectedAvatarFile" class="text-center mt-2">
               <v-btn
                 color="primary"
                 variant="outlined"
                 size="small"
                 @click="saveAvatar"
                 :loading="isSavingAvatar"
                 :disabled="!selectedAvatarFile"
                 prepend-icon="mdi-upload"
               >
                 アバターを保存
               </v-btn>
               <v-btn
                 color="grey"
                 variant="text"
                 size="small"
                 @click="selectedAvatarFile = null; avatarPreviewUrl = null"
                 :disabled="isSavingAvatar"
                 class="ml-2"
               >
                 キャンセル
               </v-btn>
             </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-list lines="two">
            <!-- Name Section -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account-outline"></v-icon>
              </template>
              <v-list-item-title>名前</v-list-item-title>
              <v-list-item-subtitle v-if="!isEditingName">{{ userName }}</v-list-item-subtitle>
              <v-text-field
                v-else
                v-model="editedName"
                label="新しい名前"
                variant="outlined"
                density="compact"
                hide-details
                class="mt-2 mb-1"
                :rules="[rules.required]"
                @keyup.enter="saveName"
                @keyup.esc="cancelEditName"
              ></v-text-field>
              <template v-slot:append>
                <div v-if="!isEditingName">
                  <v-btn
                    color="grey"
                    variant="text"
                    size="small"
                    @click="startEditName"
                    icon="mdi-pencil"
                    title="名前を編集"
                  ></v-btn>
                </div>
                <div v-else>
                   <v-btn
                     color="grey"
                     variant="text"
                     size="small"
                     @click="cancelEditName"
                     icon="mdi-close"
                     title="キャンセル"
                     class="mr-1"
                   ></v-btn>
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    @click="saveName"
                    icon="mdi-check"
                    title="保存"
                    :disabled="!editedName || editedName === userName"
                  ></v-btn>
                </div>
              </template>
            </v-list-item>

            <v-divider inset></v-divider>

            <!-- Email Section (Readonly) -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-email-outline"></v-icon>
              </template>
              <v-list-item-title>メールアドレス</v-list-item-title>
              <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
            </v-list-item>

          </v-list>
        </v-card>

        <!-- Password Change Card -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6">パスワード変更</v-card-title>
          <v-card-text>
            <v-form ref="passwordForm" @submit.prevent="changePassword">
              <v-text-field
                v-model="newPassword"
                label="新しいパスワード"
                type="password"
                variant="outlined"
                density="compact"
                class="mb-3"
                :rules="[rules.required, rules.minLength(8)]"
                autocomplete="new-password"
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                label="新しいパスワード (確認)"
                type="password"
                variant="outlined"
                density="compact"
                class="mb-3"
                :rules="[rules.required, rules.passwordMatch]"
                autocomplete="new-password"
              ></v-text-field>
              <v-btn type="submit" color="primary" block>パスワードを変更</v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Plan and Billing Card -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6">プラン・請求情報</v-card-title>
          <v-card-text>
            <!-- Current Plan -->
            <div class="plan-section">
              <div class="plan-info-row">
                <div class="plan-current">
                  <span class="plan-label">現在のプラン</span>
                  <v-chip
                    :color="currentPlan === 'Free' ? 'default' : 'grey'"
                    variant="outlined"
                    size="default"
                    class="plan-chip"
                  >
                    {{ currentPlan }}
                  </v-chip>
                </div>
                <div class="plan-actions">
                  <v-btn
                    v-if="currentPlan === 'Free'"
                    color="primary"
                    variant="outlined"
                    size="small"
                    to="/plans"
                    class="mr-2"
                  >
                    アップグレード
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    to="/plans"
                  >
                    プラン変更
                  </v-btn>
                </div>
              </div>
            </div>

            <v-divider class="my-6"></v-divider>

            <!-- Billing History -->
            <div class="billing-section">
              <h3 class="billing-title">請求履歴</h3>
              
              <!-- Loading State -->
              <div v-if="billingHistoryLoading" class="text-center py-8">
                <v-progress-circular indeterminate size="32"></v-progress-circular>
              </div>

              <!-- No Billing History -->
              <div v-else-if="!billingHistoryLoading && billingHistory.length === 0" class="empty-state">
                <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-receipt-text-off-outline</v-icon>
                <p class="text-body-2 text-grey-darken-1">請求履歴がありません</p>
              </div>

              <!-- Billing History List -->
              <div v-else>
                <v-data-table-virtual
                  :headers="billingHeaders"
                  :items="billingHistory"
                  :loading="billingHistoryLoading"
                  item-value="id"
                  no-data-text="請求履歴がありません"
                  loading-text="読み込み中..."
                  class="billing-data-table"
                  density="comfortable"
                  height="300"
                  fixed-header
                ></v-data-table-virtual>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Developer Section Card -->
        <v-card v-if="user && user.role !== 'ADMINISTRATOR'" variant="outlined">
          <v-card-title class="text-h6">開発者向け機能</v-card-title>

          <!-- Case: DEVELOPER or (USER and APPROVED) -->
          <v-card-text v-if="user.role === 'DEVELOPER' || (user.role === 'USER' && developerStatus === 'APPROVED')">
            <p class="mb-4">あなたは開発者として承認されています。</p>
            <v-btn
              color="success"
              to="/developer"
              block
              prepend-icon="mdi-apps"
              :style="{ 'text-transform': 'none' }"
            >
              開発者管理画面へ
            </v-btn>
          </v-card-text>

          <!-- Case: USER and Not Approved (UNSUBMITTED, PENDING, REJECTED) -->
          <template v-else-if="user.role === 'USER'">
              <!-- Sub-Case 1: Not Applied -->
              <v-card-text v-if="developerStatus === 'UNSUBMITTED'">
                <p class="mb-4">開発者としてアプリを公開しませんか？<br>申請を行うことで、作成したアプリを多くのユーザーに届け、収益を得るチャンスがあります。</p>
                <v-btn
                  color="secondary"
                  to="/developer/apply"
                  block
                  prepend-icon="mdi-rocket-launch-outline"
                  :style="{ 'text-transform': 'none' }"
                >
                  開発者申請を行う
                </v-btn>
              </v-card-text>

              <!-- Sub-Case 2: Rejected -->
               <v-card-text v-else-if="developerStatus === 'REJECTED'">
                 <p class="mb-4">開発者申請は承認されませんでした。<br>提出内容をご確認の上、必要に応じて修正し再度申請してください。</p>
                 <v-btn
                   color="warning"
                   to="/developer/apply"
                   block
                   prepend-icon="mdi-refresh"
                   :style="{ 'text-transform': 'none' }"
                 >
                   再度、開発者申請を行う
                 </v-btn>
               </v-card-text>

              <!-- Sub-Case 3: Pending Approval -->
              <v-card-text v-else-if="developerStatus === 'PENDING'">
                <p class="mb-4">開発者申請は現在審査中です。承認までしばらくお待ちください。</p>
                <v-progress-linear indeterminate color="secondary"></v-progress-linear>
                 <v-btn
                   color="secondary"
                   block
                   disabled
                   class="mt-4"
                   :style="{ 'text-transform': 'none' }"
                 >
                   現在、開発者申請中です
                 </v-btn>
              </v-card-text>

              <!-- Note: APPROVED case is handled above -->

          </template>

        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useNuxtApp } from '#app';
import PageTitle from '~/components/PageTitle.vue';
import { useSupabaseStorage } from '~/composables/useSupabaseStorage';
import { useGlobalModal } from '~/composables/useGlobalModal';
// import type を使用し、エラー無視コメントを削除
import type { MyProfile } from '~/types/user';

definePageMeta({ middleware: ['logged-in-access-only'] });

// --- API Client Setup ---
const { $api, payload: { user } } = useNuxtApp();

// --- Supabase Storage Setup ---
const { uploadFile, validateFile, createFilePreviewUrl, extractFilePathFromUrl, deleteFile } = useSupabaseStorage();

// --- Global Modal Setup ---
const { showSuccessSnackbar, showErrorSnackbar } = useGlobalModal();

// --- Reactive State ---
const isLoading = ref(true);

// User information
const userEmail = ref('');
const userName = ref('');
const currentPlan = ref('');
const userAvatarUrl = ref<string | null>(null); // Holds the *saved* avatar URL
const userRole = ref(''); // Added user role state
const developerStatus = ref<MyProfile['developerStatus']>('UNSUBMITTED'); // Initialize developer status

// Avatar related (upload is deferred this time)
const avatarPreviewUrl = ref<string | null>(null); // Holds the temporary preview URL
const selectedAvatarFile = ref<File | null>(null); // Holds the selected file object
const isSavingAvatar = ref(false); // Loading state for avatar save (not used)
const fileInput = ref<HTMLInputElement | null>(null);
const defaultAvatar = 'https://placehold.jp/120x120.png?text=Avatar';

// Name edit related
const isEditingName = ref(false);
const editedName = ref('');

// Password change related
const newPassword = ref('');
const confirmPassword = ref('');
const passwordForm = ref<any>(null);

// Billing related
const billingHistory = ref<any[]>([]);
const billingHistoryLoading = ref(false);

// Data table headers for billing history
const billingHeaders = [
  { title: '支払日', key: 'formattedDate', sortable: true },
  { title: '支払いID', key: 'id', sortable: false },
  { title: 'ステータス', key: 'statusText', sortable: false },
  { title: '金額', key: 'formattedAmount', sortable: true, align: 'end' as const },
];

// --- Fetch User Data ---
onMounted(async () => {
  isLoading.value = true;
  try {
    userName.value = user.name;
    userEmail.value = user.email;
    userAvatarUrl.value = user.avatarUrl;
    currentPlan.value = user.planName; // Use the plan name from API
    userRole.value = user.role;
    developerStatus.value = user.developerStatus;
    await loadBillingHistory();
  } catch (error: any) {
    showErrorSnackbar('プロフィールの読み込みに失敗しました');
    // Add additional handling for 401 Unauthorized etc.
  } finally {
    isLoading.value = false;
  }
});

// --- Methods ---

// Avatar related (save is deferred this time)
const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // ファイル検証
    const validation = validateFile(file);
    if (!validation.isValid) {
      showErrorSnackbar(validation.error || 'ファイルが無効です');
      return;
    }

    selectedAvatarFile.value = file; // Store the file
    
    try {
      // プレビューを生成
      avatarPreviewUrl.value = await createFilePreviewUrl(file);
      console.log('Selected file for preview:', file);
    } catch (error) {
      console.error('Error creating preview:', error);
      showErrorSnackbar('プレビューの生成に失敗しました');
    }
  } else {
    selectedAvatarFile.value = null;
    avatarPreviewUrl.value = null; // Clear preview if selection cancelled
  }
};

// アバター保存機能
const saveAvatar = async () => {
  if (!selectedAvatarFile.value) return;
  
  isSavingAvatar.value = true;
  
  // 削除用に現在のアバターURLを保存
  const oldAvatarUrl = userAvatarUrl.value;
  
  try {
    // Supabase Storageにアップロード
    const uploadedUrl = await uploadFile(selectedAvatarFile.value);
    
    // サーバーのユーザー情報を更新
    await $api('/me/avatar', {
      method: 'PUT',
      data: { avatarUrl: uploadedUrl }
    });
    
    // 状態を更新
    userAvatarUrl.value = uploadedUrl;
    avatarPreviewUrl.value = null;
    selectedAvatarFile.value = null;
    
    // 古い画像ファイルを削除（エラーが発生しても処理は続行）
    if (oldAvatarUrl) {
      try {
        const oldFilePath = extractFilePathFromUrl(oldAvatarUrl);
        if (oldFilePath) {
          await deleteFile(oldFilePath);
          console.log('古いアバター画像を削除しました:', oldFilePath);
        }
      } catch (deleteError) {
        console.warn('古いアバター画像の削除に失敗しました:', deleteError);
        // 削除エラーは表示しない（ユーザー体験を損なわないため）
      }
    }
    
    showSuccessSnackbar('アバターが正常に更新されました');
  } catch (error: any) {
    console.error('Failed to save avatar:', error);
    showErrorSnackbar(error.message || 'アバターの保存に失敗しました');
  } finally {
    isSavingAvatar.value = false;
  }
};

// Name edit related
const startEditName = () => {
  editedName.value = userName.value;
  isEditingName.value = true;
};

const saveName = async () => {
  if (!editedName.value) return;
  try {
    const updatedUser: Pick<MyProfile, 'name'> = await $api('/me/name', {
      method: 'PATCH',
      data: { name: editedName.value },
    });
    userName.value = updatedUser.name;
    isEditingName.value = false;
    showSuccessSnackbar('名前が正常に更新されました');
  } catch (error: any) {
    console.error('Failed to update name:', error);
    showErrorSnackbar('名前の更新に失敗しました');
    // Add more specific error handling based on the error response
  }
};

const cancelEditName = () => {
  isEditingName.value = false;
};

// Password change related
const changePassword = async () => {
  if (!passwordForm.value) return;
  const { valid } = await passwordForm.value.validate();

  if (valid) {
    try {
      await $api('/me/password', {
        method: 'PATCH',
        data: {
          newPassword: newPassword.value,
        },
      });
      newPassword.value = '';
      confirmPassword.value = '';
      passwordForm.value.reset(); // Vuetify form reset
      passwordForm.value.resetValidation();
      showSuccessSnackbar('パスワードが正常に変更されました');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      if (error.response?.status === 400) {
        showErrorSnackbar(error.response._data?.message || '入力内容を確認してください');
      } else {
        showErrorSnackbar('パスワードの変更に失敗しました');
      }
    }
  } else {
    console.log('Password form validation failed');
    showErrorSnackbar('入力内容を確認してください');
  }
};

// Billing related
const loadBillingHistory = async () => {
  billingHistoryLoading.value = true;
  try {
    const response = await $api('/me/billing-history');
    
    // データを v-data-table-virtual 用にフォーマット
    billingHistory.value = response.data.map((item: any) => ({
      ...item,
      formattedDate: formatDate(item.createdAt),
      statusText: getBillingStatusText(item.status),
      formattedAmount: `¥${item.amount.toLocaleString()}`,
    }));
  } catch (error: any) {
    console.error('Failed to load billing history:', error);
    showErrorSnackbar('請求履歴の読み込みに失敗しました');
  } finally {
    billingHistoryLoading.value = false;
  }
};

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const getBillingStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'refunded':
    case 'partial_refunded':
      return 'warning';
    case 'failed':
      return 'error';
    case 'authorized':
      return 'info';
    case 'pending':
      return 'grey';
    default:
      return 'grey';
  }
};

const getBillingStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return '支払済み';
    case 'refunded':
      return '返金済み';
    case 'partial_refunded':
      return '一部返金済み';
    case 'failed':
      return '支払失敗';
    case 'authorized':
      return '承認済み';
    case 'pending':
      return '処理中';
    default:
      return '不明';
  }
};

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || 'Required field.',
  minLength: (length: number) => (value: string) => (value && value.length >= length) || `${length} characters or more required.`,
  passwordMatch: (value: string) => value === newPassword.value || 'Passwords do not match.',
};

</script>

<style scoped>
/* Style overrides for Vuetify components if necessary */
.avatar-container {
  transition: transform 0.2s ease;
}
.avatar-container:hover {
  transform: scale(1.05);
}

/* Plan Section */
.plan-section {
  margin-bottom: 0;
}

.plan-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.plan-current {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.plan-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
}

.plan-chip {
  font-weight: 500;
}

.plan-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* Billing Section */
.billing-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  margin: 0 0 16px 0;
}

.empty-state {
  text-align: center;
  padding: 32px 0;
}

/* Billing Table */
.billing-data-table {
  overflow-x: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.billing-date-text {
  font-weight: 500;
  color: #212529;
}

.billing-id-text {
  font-family: monospace;
  color: #6c757d;
  font-size: 0.8rem;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.billing-payment-info {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.billing-payment-empty {
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.billing-status-chip {
  font-weight: 500;
  min-width: 90px;
}

.billing-amount-text {
  font-weight: 600;
  color: #212529;
}

/* Responsive Design */
@media (max-width: 768px) {
  .plan-info-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .plan-current {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .plan-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    align-self: stretch;
  }
  
  .plan-actions .v-btn {
    flex: 1;
    min-width: 0;
  }
  
  .billing-data-table {
    border: none;
    border-radius: 0;
  }
  
  .billing-date-text {
    width: 20%;
  }
  
  .billing-id-text {
    width: 40%;
  }
  
  .billing-payment-info {
    font-size: 0.7rem;
    margin-top: 4px;
  }
  
  .billing-status-chip {
    min-width: 70px;
    font-size: 0.7rem;
  }
}
</style> 
