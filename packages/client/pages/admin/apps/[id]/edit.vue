<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        class="mr-2"
        size="small"
        @click="cancelEdit"
      ></v-btn>
      <PageTitle :title="`アプリステータス変更: ${editableApp.name || '...'}`" />
    </div>

    <v-row>
      <v-col cols="12" md="8">
        <v-form ref="editForm">
          <v-card variant="outlined" class="app-edit-card">
            <v-card-title class="d-flex align-center bg-light-blue-lighten-5 px-4 py-3">
              <v-icon icon="mdi-pencil-outline" class="mr-2" color="primary"></v-icon>
              <span class="text-h6">ステータス変更</span>
            </v-card-title>
            
            <v-card-text class="pt-4">
              <v-alert
                type="info"
                variant="tonal"
                border="start"
                density="compact"
                class="mb-4"
                icon="mdi-information-outline"
              >
                このページではアプリのステータスのみ変更できます。
                ステータスによっては開発者へメール通知が送信されます。
              </v-alert>
              
              <v-container>
                <v-row>
                  <!-- 現在のステータス (表示のみ) -->
                  <v-col cols="12" md="6">
                    <v-sheet class="pa-3 rounded border mb-3">
                      <div class="text-caption text-grey">現在のステータス</div>
                      <div class="d-flex align-center mt-1">
                        <v-chip
                          :color="getStatusColor(originalStatus)"
                          size="small"
                          class="mr-2"
                        >
                          {{ getStatusText(originalStatus) }}
                        </v-chip>
                        <span class="text-subtitle-1">{{ getStatusText(originalStatus) }}</span>
                      </div>
                    </v-sheet>
                  </v-col>
                  
                  <!-- 新しいステータス (変更可能) -->
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="editableApp.status"
                      :items="statusOptions"
                      item-title="title"
                      item-value="value"
                      label="新しいステータス *"
                      required
                      variant="outlined"
                      density="comfortable"
                      :rules="[rules.required]"
                      @update:model-value="handleStatusChange"
                      :disabled="isLoading || isSaving"
                    ></v-select>
                  </v-col>
                  
                  <!-- ステータス変更理由（アプリ状態に応じて表示） -->
                  <v-col cols="12" v-if="shouldShowReasonField">
                    <v-alert
                      v-if="reasonRequired"
                      type="warning"
                      variant="tonal"
                      border="start"
                      density="compact"
                      class="mb-3"
                      icon="mdi-email-alert-outline"
                    >
                      {{ reasonLabel }}は必須です。この内容は開発者にメールで通知されます。
                    </v-alert>
                    <v-alert
                      v-else
                      type="info"
                      variant="tonal"
                      border="start"
                      density="compact"
                      class="mb-3"
                      icon="mdi-email-outline"
                    >
                      入力された{{ reasonLabel }}は開発者にメールで通知されます。
                    </v-alert>
                    
                    <v-textarea
                      v-model="resultReason"
                      :label="reasonLabel"
                      rows="4"
                      variant="outlined"
                      density="comfortable"
                      :rules="reasonRequired ? [rules.required] : []"
                      :hint="reasonHint"
                      persistent-hint
                      :disabled="isLoading || isSaving"
                      counter="300"
                      maxlength="300"
                    ></v-textarea>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                @click="cancelEdit"
                :disabled="isSaving"
              >
                キャンセル
              </v-btn>
              <v-btn
                color="primary"
                variant="elevated"
                @click="saveAppStatus"
                :loading="isSaving"
                :disabled="isLoading"
              >
                ステータスを保存
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-col>
      
      <!-- アプリ情報サイドバー -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="app-info-card">
          <v-card-title class="bg-grey-lighten-4 px-4 py-3">
            <v-icon icon="mdi-information-outline" class="mr-2" color="grey-darken-1"></v-icon>
            <span>アプリ情報</span>
          </v-card-title>
          
          <v-card-text class="pa-4">
            <div class="d-flex justify-center mb-4">
              <v-img
                v-if="editableApp.thumbnailUrl"
                :src="editableApp.thumbnailUrl"
                width="200"
                :aspect-ratio="16/9"
                cover
                class="rounded-lg border"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                    <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
                  </div>
                </template>
              </v-img>
              <v-sheet
                v-else
                width="200"
                height="112"
                color="grey-lighten-3"
                class="d-flex align-center justify-center rounded-lg border"
              >
                <v-icon icon="mdi-image-outline" size="large" color="grey"></v-icon>
              </v-sheet>
            </div>
            
            <v-list density="compact" class="bg-grey-lighten-5 rounded mb-2">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-identifier" size="small" class="mr-2"></v-icon>
                </template>
                <v-list-item-title class="text-caption text-grey-darken-1">ID</v-list-item-title>
                <v-list-item-subtitle>{{ editableApp.id }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-account-outline" size="small" class="mr-2"></v-icon>
                </template>
                <v-list-item-title class="text-caption text-grey-darken-1">作成者</v-list-item-title>
                <v-list-item-subtitle>{{ editableApp.creator?.name || '不明' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-link-variant" size="small" class="mr-2"></v-icon>
                </template>
                <v-list-item-title class="text-caption text-grey-darken-1">アプリページ</v-list-item-title>
                <v-list-item-subtitle class="text-truncate">
                  <v-btn
                    v-if="editableApp.status === 'PUBLISHED'"
                    variant="text"
                    size="small"
                    color="primary"
                    density="compact"
                    :href="`${frontendUrl}/apps/${appId}`"
                    target="_blank"
                    class="pa-0 text-decoration-underline"
                    prepend-icon="mdi-open-in-new"
                  >
                    アプリページを表示
                  </v-btn>
                  <span v-else class="text-grey">
                    {{ getStatusText(editableApp.status || '') }}状態のため表示できません
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-clock-outline" size="small" class="mr-2"></v-icon>
                </template>
                <v-list-item-title class="text-caption text-grey-darken-1">作成日</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(editableApp.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <v-card-subtitle class="px-0 pt-2 pb-1">説明</v-card-subtitle>
            <div class="text-body-2 text-grey-darken-2 px-3 py-2 rounded bg-grey-lighten-5 border">
              {{ editableApp.description || '説明はありません' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const { $api, $dayjs } = useNuxtApp();
const config = useRuntimeConfig();
const frontendUrl = computed(() => config.public.frontendUrl || 'http://localhost:3000');
const appId = Number(route.params.id);

// APIから取得したアプリデータの型定義
interface App {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  appUrl: string;
  status: string; // AppStatus Enum: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PRIVATE' | 'SUSPENDED'
  isSubscriptionLimited: boolean;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
  } | null;
  creator: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  subImages?: Array<{ id: number; imageUrl: string; order: number }>;
  createdAt: string;
  updatedAt: string;
}

const editForm = ref<any>(null);
const editableApp = reactive<Partial<App>>({
    id: appId,
    name: '',
    description: '',
    status: 'DRAFT',
    thumbnailUrl: null,
    subImages: [],
    isSubscriptionLimited: false,
    appUrl: '',
    createdAt: '',
    creator: {
      id: 0,
      name: '',
      email: '',
      avatarUrl: null
    }
});

const isSaving = ref(false);
const isLoading = ref(false);
const resultReason = ref(''); // ステータス変更理由
const originalStatus = ref(''); // 元のステータス（変更前）
const snackbar = reactive({ show: false, text: '', color: 'success' });

const statusOptions = ref([
    { title: '公開', value: 'PUBLISHED' },
    { title: '下書き', value: 'DRAFT' },
    { title: 'アーカイブ', value: 'ARCHIVED' },
    { title: '非公開', value: 'PRIVATE' },
    { title: '停止中', value: 'SUSPENDED' },
]);

const rules = {
  required: (value: string) => !!value || '必須項目です。',
};

// ステータス変更理由フィールドの表示条件
const shouldShowReasonField = computed(() => {
  // 元のステータスと異なるかつ、特定のステータスに変更する場合に表示
  return editableApp.status !== originalStatus.value && 
    (editableApp.status === 'PRIVATE' || 
     editableApp.status === 'SUSPENDED' || 
     editableApp.status === 'ARCHIVED');
});

// ステータス変更理由のラベル
const reasonLabel = computed(() => {
  switch (editableApp.status) {
    case 'PRIVATE': return '非公開理由';
    case 'SUSPENDED': return '停止理由';
    case 'ARCHIVED': return 'アーカイブ理由';
    default: return 'ステータス変更理由';
  }
});

// ステータス変更理由のヒント
const reasonHint = computed(() => {
  switch (editableApp.status) {
    case 'PRIVATE': return '非公開にする理由を具体的に記載してください';
    case 'SUSPENDED': return '停止する理由を具体的に記載してください';
    case 'ARCHIVED': return 'アーカイブする理由があれば記載してください';
    default: return '';
  }
});

// ステータス変更理由が必須かどうか
const reasonRequired = computed(() => {
  return editableApp.status === 'PRIVATE' || editableApp.status === 'SUSPENDED';
});

// ステータス変更時の処理
const handleStatusChange = (newStatus: string) => {
  if (newStatus !== originalStatus.value) {
    if (newStatus === 'PUBLISHED' && (originalStatus.value === 'PRIVATE' || originalStatus.value === 'SUSPENDED')) {
      // 非公開・停止から公開への直接変更は許可しない
      snackbar.text = `${getStatusText(originalStatus.value)}から直接公開状態に変更することはできません。一度DRAFTに変更してください。`;
      snackbar.color = 'warning';
      snackbar.show = true;
      editableApp.status = originalStatus.value;
    }
  }
};

// APIからアプリデータを取得
const fetchAppData = async () => {
  isLoading.value = true;
  
  try {
    const response = await $api.get(`/admin/apps/${appId}`);
    
    if (response.data) {
      // レスポンスデータをeditableAppにコピー
      Object.assign(editableApp, response.data);
      // 初期ステータスを保存
      originalStatus.value = response.data.status;
    } else {
      throw new Error('アプリデータの形式が不正です');
    }
  } catch (error: any) {
    console.error('アプリデータ取得エラー:', error);
    snackbar.text = error.response?.data?.message || 'アプリデータの取得に失敗しました';
    snackbar.color = 'error';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/apps'), 2000);
  } finally {
    isLoading.value = false;
  }
};

// ステータスのテキスト表示を取得
const getStatusText = (status: string): string => {
  const option = statusOptions.value.find(o => o.value === status);
  return option ? option.title : status;
};

// ステータスの色を取得
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PUBLISHED': return 'success';
    case 'DRAFT': return 'warning';
    case 'ARCHIVED': return 'grey';
    case 'PRIVATE': return 'info';
    case 'SUSPENDED': return 'error';
    default: return 'grey';
  }
};

// 日付フォーマット
const formatDate = (dateString?: string) => {
  if (!dateString) return '不明';
  return $dayjs(dateString).format('YYYY/MM/DD');
};

const cancelEdit = () => {
  router.push('/admin/apps');
};

const saveAppStatus = async () => {
  if (!editForm.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) {
    console.log('フォームバリデーションエラー');
    return;
  }

  // ステータス変更理由が必要なのに入力されていない場合
  if (shouldShowReasonField.value && reasonRequired.value && !resultReason.value) {
    snackbar.text = `${reasonLabel.value}を入力してください`;
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }

  isSaving.value = true;

  try {
    const payload = {
      status: editableApp.status!,
      resultReason: resultReason.value || undefined
    };

    const response = await $api.patch(`/admin/apps/${appId}/status`, payload);

    snackbar.text = 'アプリのステータスを保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;

    setTimeout(() => router.push('/admin/apps'), 1500);

  } catch (error: any) {
    console.error("ステータス保存エラー:", error);
    snackbar.text = error.response?.data?.message || 'ステータスの保存中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
};

// ページ読み込み時にデータをフェッチ
onMounted(() => {
  fetchAppData();
});

</script>

<style scoped>
.app-edit-card, .app-info-card {
  border-radius: 8px;
  overflow: hidden;
}
.bg-light-blue-lighten-5 {
  background-color: #e3f2fd;
}
.border {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
