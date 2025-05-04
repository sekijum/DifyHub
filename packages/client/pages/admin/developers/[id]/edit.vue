<template>
  <v-container fluid>
    <PageTitle 
      :title="`開発者詳細: ${developer.name || '...'}`" 
      :back-button="true" 
      back-to="/admin/developers" 
    />

    <v-alert v-if="error" type="error" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <v-card v-if="isLoading" class="pa-4">
      <v-skeleton-loader type="card" />
    </v-card>

    <v-form v-if="!isLoading" ref="editForm" @submit.prevent="saveDeveloper">
      <v-card variant="outlined" class="mb-4">
        <v-card-text>
          <v-row>
            <!-- 左側: 基本情報 -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="developer.id"
                label="ID"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="developer.name"
                label="名前 *"
                required
                variant="outlined"
                :rules="[rules.required]"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="developer.email"
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
            
            <!-- 右側: アカウント設定 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="developer.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="ステータス *"
                required
                variant="outlined"
                :rules="[rules.required]"
                :disabled="isSaving"
                :hint="getStatusHint(developer.status)"
                persistent-hint
                class="mb-5"
              ></v-select>

              <div v-if="developer._count" class="mt-5 mb-5">
                <h3 class="text-subtitle-1 mb-2">アプリ情報</h3>
                <div class="text-body-2">公開アプリ数: {{ developer._count.createdApps || 0 }}</div>
              </div>
              
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
const { $api } = useNuxtApp();
const developerId = Number(route.params.id);

// Type definition for Developer
interface Developer {
  id: number;
  name: string;
  email: string;
  status: UserStatusType;
  createdAt: string;
  _count?: {
    createdApps: number;
  };
}

// --- Form and State ---
const editForm = ref<any>(null);
const developer = reactive<Partial<Developer>>({});
const originalData = ref<Partial<Developer>>({});
const isSaving = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);

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
    developer.name !== originalData.value.name ||
    developer.email !== originalData.value.email ||
    developer.status !== originalData.value.status;
  
  return basicInfoChanged;
});

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  emailFormat: (value: string) => /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください。',
};

// ステータスオプション
const statusOptions = [
  { title: '有効', value: UserStatus.ACTIVE },
  { title: '停止中', value: UserStatus.SUSPENDED },
];

// 登録日のフォーマット
const formattedCreatedAt = computed(() => {
  if (!developer.createdAt) return '';
  try {
    return new Date(developer.createdAt).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return developer.createdAt;
  }
});

// ステータスに応じたヒントを取得
const getStatusHint = (status: UserStatusType | undefined): string => {
  if (!status) return '';
  
  switch (status) {
    case UserStatus.ACTIVE:
      return 'アクティブ状態では開発者はアプリの開発・公開ができます';
    case UserStatus.SUSPENDED:
      return '停止状態では開発者は新規アプリの公開ができなくなります';
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

// --- Fetch Developer Data ---
const fetchDeveloper = async (): Promise<void> => {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await $api.get(`/admin/developers/${developerId}`);
    if (data) {
      // データを開発者オブジェクトにコピー
      Object.assign(developer, data);
      
      // 元のデータを保存（変更検出用）
      originalData.value = { ...data };
    } else {
      showError('開発者データの取得に失敗しました');
      router.push('/admin/developers');
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '開発者データの取得に失敗しました';
    showError(errorMessage);
    error.value = errorMessage;
    setTimeout(() => router.push('/admin/developers'), 1500);
  } finally {
    isLoading.value = false;
  }
};

// --- Actions ---
const cancelEdit = (): void => {
  router.push('/admin/developers');
};

const saveDeveloper = async (): Promise<void> => {
  if (!editForm.value) return;
  
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  isSaving.value = true;

  // 更新データ準備
  const updateData: Record<string, any> = {
    name: developer.name,
    email: developer.email,
    status: developer.status,
  };

  try {
    await $api.patch(`/admin/developers/${developerId}/status`, {
      status: developer.status
    });
    
    showSuccess('開発者情報を更新しました');
    
    // 元のデータを更新
    originalData.value = { 
      ...originalData.value,
      name: developer.name,
      email: developer.email,
      status: developer.status
    };
    
    setTimeout(() => router.push('/admin/developers'), 1500);
  } catch (error: any) {
    showError(error.response?.data?.message || '開発者情報の更新に失敗しました');
  } finally {
    isSaving.value = false;
  }
};

// ステータス変更時の警告監視
watch(() => developer.status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && newStatus === UserStatus.SUSPENDED) {
    showSnackbar('停止状態に変更すると、開発者はアプリの公開ができなくなります', 'warning');
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
  if (isNaN(developerId)) {
    showError('無効な開発者IDです');
    router.push('/admin/developers');
    return;
  }
  
  fetchDeveloper();
});
</script>

<style scoped>
.v-text-field.v-input--disabled .v-field__input {
  color: rgba(0, 0, 0, 0.7) !important;
}
</style> 
