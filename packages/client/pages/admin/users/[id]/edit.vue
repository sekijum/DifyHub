<template>
  <v-container fluid>
    <PageTitle 
      :title="`ユーザー詳細: ${user?.name || '...'}`" 
      :back-button="true" 
      back-to="/admin/users" 
    />

    <v-alert v-if="error" type="error" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="card" />
    </v-card>

    <v-form v-if="user" @submit.prevent="updateUserStatus">
      <v-card variant="outlined" class="mb-4">
        <v-card-text>
          <v-row>
            <!-- 左側: 基本情報 -->
            <v-col cols="12" md="6">
              <h3 class="text-h6 mb-4">基本情報</h3>
              
              <v-text-field
                v-model="user.id"
                label="ID"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="user.name"
                label="名前"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="user.email"
                label="メールアドレス"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="formattedDate"
                label="登録日"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
              ></v-text-field>
            </v-col>
            
            <!-- 右側: アカウント設定 -->
            <v-col cols="12" md="6">
              <h3 class="text-h6 mb-4">アカウント設定</h3>
              
              <v-text-field
                v-model="planDisplay"
                label="プラン"
                disabled
                variant="outlined"
                bg-color="grey-lighten-4"
                hint="プランの変更は現在サポートされていません"
                persistent-hint
                class="mb-3"
              ></v-text-field>
              
              <v-select
                v-model="user.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="ステータス"
                variant="outlined"
                :disabled="saving"
                :hint="getStatusHint(user.status)"
                persistent-hint
              ></v-select>
              
              <v-alert
                v-if="hasStatusChanged"
                type="info"
                variant="tonal"
                border="start"
                density="compact"
                class="mt-3"
              >
                ステータスが変更されています。保存ボタンをクリックして変更を適用してください。
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
            :disabled="saving"
            @click="navigateToUsersList"
          >
            キャンセル
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            type="submit"
            :loading="saving"
            :disabled="!hasStatusChanged || saving"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>

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
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';
import type { UserStatusType } from '~/constants/user-status';
import { UserStatus } from '~/constants/user-status';

// ページメタデータ
definePageMeta({
  layout: 'admin',
});

// ユーザーデータの型定義
interface UserData {
  id: number;
  email: string;
  name: string;
  status: UserStatusType;
  planName: string | null;
  createdAt: string;
  avatarUrl?: string | null;
}

// スナックバーの型定義
interface SnackbarState {
  show: boolean;
  text: string;
  color: 'success' | 'error' | 'info' | 'warning';
}

// ステータスオプションの型定義
interface StatusOption {
  title: string;
  value: UserStatusType;
}

const { $api } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const userId = route.params.id as string;

// 状態管理
const user = ref<UserData | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const saving = ref<boolean>(false);
const originalStatus = ref<UserStatusType | null>(null);
const snackbar = reactive<SnackbarState>({ 
  show: false, 
  text: '', 
  color: 'success' 
});

// ステータスオプション
const statusOptions: StatusOption[] = [
  { title: 'アクティブ', value: UserStatus.ACTIVE },
  { title: '停止中', value: UserStatus.SUSPENDED },
];

// ステータスが変更されたかを確認
const hasStatusChanged = computed<boolean>(() => {
  if (!user.value || originalStatus.value === null) return false;
  return user.value.status !== originalStatus.value;
});

// 日付フォーマット
const formattedDate = computed<string>(() => {
  if (!user.value?.createdAt) return '';
  try {
    return new Date(user.value.createdAt).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return user.value.createdAt;
  }
});

// プラン表示
const planDisplay = computed<string>(() => {
  return user.value?.planName || '未設定';
});

// ステータスに応じたヒントを取得
const getStatusHint = (status: UserStatusType): string => {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'アクティブ状態ではユーザーはシステムを利用できます';
    case UserStatus.SUSPENDED:
      return '停止状態ではユーザーはログインできなくなります';
    default:
      return '';
  }
};

// ユーザー情報を取得
const fetchUserData = async (): Promise<void> => {
  loading.value = true;
  error.value = null;
  
  try {
    const { data } = await $api.get<UserData>(`/admin/users/${userId}`);
    user.value = data;
    originalStatus.value = data.status;
  } catch (err) {
    error.value = 'ユーザー情報の取得に失敗しました。';
  } finally {
    loading.value = false;
  }
};

// ユーザーステータスを更新
const updateUserStatus = async (): Promise<void> => {
  if (!hasStatusChanged.value || !user.value) return;
  
  saving.value = true;
  error.value = null;
  
  try {
    await $api.patch(`/admin/users/${userId}/status`, {
      status: user.value.status
    });
    originalStatus.value = user.value.status;
    
    showSnackbar('ユーザー情報を更新しました', 'success');
    
    // 成功したら少し待ってから一覧へ戻る
    setTimeout(() => {
      navigateToUsersList();
    }, 1500);
  } catch (err) {
    error.value = 'ユーザー情報の更新に失敗しました。';
    showSnackbar('ユーザー情報の更新に失敗しました', 'error');
  } finally {
    saving.value = false;
  }
};

// スナックバー表示
const showSnackbar = (text: string, color: SnackbarState['color']): void => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

// ユーザー一覧ページへ戻る
const navigateToUsersList = (): void => {
  router.push('/admin/users');
};

// ステータス変更時の警告監視
watch(() => user.value?.status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && newStatus === UserStatus.SUSPENDED) {
    showSnackbar('停止状態に変更すると、ユーザーはログインできなくなります', 'warning');
  }
}, { deep: true });

// コンポーネントマウント時にユーザー情報を取得
onMounted(fetchUserData);
</script>

<style scoped>
.v-text-field.v-input--disabled .v-field__input {
  color: rgba(0, 0, 0, 0.7) !important;
}
</style> 
