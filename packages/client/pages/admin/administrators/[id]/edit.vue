<template>
  <v-container fluid>
    <PageTitle 
      :title="`管理者詳細: ${administrator.name || '...'}`" 
      :back-button="true" 
      back-to="/admin/administrators" 
    />

    <v-alert v-if="error" type="error" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <v-card v-if="isLoading" class="pa-4">
      <v-skeleton-loader type="card" />
    </v-card>

    <v-form v-if="!isLoading" ref="editForm" @submit.prevent="saveAdministrator">
      <v-card variant="outlined" class="mb-4">
        <v-card-text>
          <v-row>
            <!-- 左側: 基本情報 -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="administrator.id"
                label="ID"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="administrator.name"
                label="名前 *"
                required
                variant="outlined"
                :rules="[rules.required]"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="administrator.email"
                label="メールアドレス *"
                required
                type="email"
                variant="outlined"
                :rules="[rules.required, rules.emailFormat]"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="formattedCreatedAt"
                label="登録日"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
              ></v-text-field>
            </v-col>
            
            <!-- 右側: パスワード設定 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="administrator.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="ステータス *"
                required
                variant="outlined"
                :rules="[rules.required]"
                :disabled="isSaving || currentUserId === administrator.id"
                :hint="getStatusHint(administrator.status)"
                persistent-hint
                class="mb-5"
              >
                <template v-slot:prepend>
                  <v-tooltip v-if="currentUserId === administrator.id" location="top" text="自分自身のステータスは変更できません">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" color="warning" size="small" class="me-2">
                        mdi-information-outline
                      </v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-select>
              
              <v-switch
                v-model="changePassword"
                color="primary"
                hide-details
                label="パスワードを変更する"
                class="mb-3"
              ></v-switch>
              
              <v-text-field
                v-if="changePassword"
                v-model="newPassword"
                label="新しいパスワード *"
                type="password"
                variant="outlined"
                :rules="changePassword ? [rules.required, rules.minLength(8)] : []"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-if="changePassword"
                v-model="confirmPassword"
                label="パスワード（確認） *"
                type="password"
                variant="outlined"
                :rules="changePassword ? [rules.required, rules.passwordMatch] : []"
              ></v-text-field>
              
              <v-alert
                v-if="hasChanges"
                type="info"
                variant="tonal"
                border="start"
                density="compact"
                class="mt-3"
              >
                情報が変更されています。保存ボタンをクリックして変更を適用してください。
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            color="grey"
            class="me-4"
            :disabled="isSaving"
            @click="cancelEdit"
          >
            キャンセル
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            type="submit"
            :loading="isSaving"
            :disabled="!hasChanges || isSaving"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>

    <!-- スナックバー -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';
import { UserStatus } from '~/constants/user-status';
import type { UserStatusType } from '~/constants/user-status';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const { $api, payload } = useNuxtApp();
const administratorId = Number(route.params.id);

// 現在ログイン中のユーザーID
const currentUserId = ref(payload?.user?.id);

// Type definition for Administrator
interface Administrator {
  id: number;
  name: string;
  email: string;
  status: UserStatusType;
  createdAt: string;
}

// --- Form and State ---
const editForm = ref<any>(null);
const administrator = reactive<Partial<Administrator>>({});
const originalData = ref<Partial<Administrator>>({});
const isSaving = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const changePassword = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');

const snackbar = reactive({ 
  show: false, 
  text: '', 
  color: 'success' 
});

// 変更があるかどうかをチェック
const hasChanges = computed(() => {
  if (!originalData.value) return false;
  
  // 基本情報または状態に変更がある場合
  const basicInfoChanged = 
    administrator.name !== originalData.value.name ||
    administrator.email !== originalData.value.email ||
    administrator.status !== originalData.value.status;
    
  // パスワード変更の場合
  const passwordChanged = changePassword.value && newPassword.value.length > 0;
  
  return basicInfoChanged || passwordChanged;
});

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  emailFormat: (value: string) => /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください。',
  minLength: (length: number) => (value: string) => (value && value.length >= length) || `${length}文字以上で入力してください。`,
  passwordMatch: (value: string) => value === newPassword.value || 'パスワードが一致しません。',
};

// ステータスオプション
const statusOptions = [
  { title: '有効', value: UserStatus.ACTIVE },
  { title: '停止中', value: UserStatus.SUSPENDED },
];

// 登録日のフォーマット
const formattedCreatedAt = computed(() => {
  if (!administrator.createdAt) return '';
  try {
    return new Date(administrator.createdAt).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return administrator.createdAt;
  }
});

// ステータスに応じたヒントを取得
const getStatusHint = (status: UserStatusType | undefined): string => {
  if (!status) return '';
  
  switch (status) {
    case UserStatus.ACTIVE:
      return 'アクティブ状態では管理者はシステムを利用できます';
    case UserStatus.SUSPENDED:
      return '停止状態では管理者はログインできなくなります';
    default:
      return '';
  }
};

// ヘルパー関数
const showError = (message: string): void => {
  snackbar.text = message;
  snackbar.color = 'error';
  snackbar.show = true;
};

const showSuccess = (message: string): void => {
  snackbar.text = message;
  snackbar.color = 'success';
  snackbar.show = true;
};

// --- Fetch Administrator Data ---
const fetchAdministrator = async (): Promise<void> => {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await $api.get(`/admin/administrators/${administratorId}`);
    if (data) {
      // データを管理者オブジェクトにコピー
      Object.assign(administrator, data);
      
      // 元のデータを保存（変更検出用）
      originalData.value = { ...data };
    } else {
      showError('管理者データの取得に失敗しました');
      router.push('/admin/administrators');
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '管理者データの取得に失敗しました';
    showError(errorMessage);
    error.value = errorMessage;
    setTimeout(() => router.push('/admin/administrators'), 1500);
  } finally {
    isLoading.value = false;
  }
};

// --- Actions ---
const cancelEdit = (): void => {
  router.push('/admin/administrators');
};

const saveAdministrator = async (): Promise<void> => {
  if (!editForm.value) return;
  
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  isSaving.value = true;

  // 更新データ準備
  const updateData: Record<string, any> = {
    name: administrator.name,
    email: administrator.email,
    status: administrator.status,
  };

  // パスワード変更が有効な場合
  if (changePassword.value && newPassword.value) {
    updateData.password = newPassword.value;
  }

  try {
    await $api.patch(`/admin/administrators/${administratorId}`, updateData);
    
    showSuccess('管理者情報を更新しました');
    
    // 元のデータを更新（パスワードは除く）
    originalData.value = { 
      ...originalData.value,
      name: administrator.name,
      email: administrator.email,
      status: administrator.status
    };
    
    // パスワードフィールドをリセット
    if (changePassword.value) {
      changePassword.value = false;
      newPassword.value = '';
      confirmPassword.value = '';
    }
    
    setTimeout(() => router.push('/admin/administrators'), 1500);
  } catch (error: any) {
    showError(error.response?.data?.message || '管理者情報の更新に失敗しました');
  } finally {
    isSaving.value = false;
  }
};

// ステータス変更時の警告監視
watch(() => administrator.status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && newStatus === UserStatus.SUSPENDED) {
    showSnackbar('停止状態に変更すると、管理者はログインできなくなります', 'warning');
  }
});

// スナックバー表示
const showSnackbar = (text: string, color: 'success' | 'error' | 'info' | 'warning'): void => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

// 初期データ取得
onMounted(() => {
  if (isNaN(administratorId)) {
    showError('無効な管理者IDです');
    router.push('/admin/administrators');
    return;
  }
  
  fetchAdministrator();
});
</script>

<style scoped>
.v-text-field.v-input--disabled .v-field__input {
  color: rgba(0, 0, 0, 0.7) !important;
}
</style> 
