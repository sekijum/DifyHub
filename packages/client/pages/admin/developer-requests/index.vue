<template>
  <v-container fluid>
    <PageTitle title="開発者申請管理" />
    
    <!-- シンプル化したフィルター -->
    <v-row dense class="mb-2">
      <v-col cols="12" sm="5" md="4">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="検索 (名前, メールアドレス)"
          density="comfortable"
          variant="outlined"
          hide-details
          class="mt-2"
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- データテーブル -->
    <v-card variant="outlined">
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:sort-by="sortBy"
        v-model:page="page"
        :headers="headers"
        :items="developerRequests"
        :items-length="totalItems"
        :loading="isLoading"
        class="elevation-0 developer-requests-table"
        density="comfortable"
        hover
        items-per-page-text="表示行数"
        :items-per-page-options="itemsPerPageOptions"
        loading-text="データを読み込み中..."
        no-data-text="条件に一致する申請が見つかりません"
        must-sort
        fixed-header
        height="calc(100vh - 220px)"
        @update:options="fetchDeveloperRequests"
      >
        <!-- 名前 -->
        <template v-slot:item.name="{ item }">
          <div class="text-no-wrap font-weight-medium">{{ item.user.name }}</div>
        </template>

        <!-- メールアドレス -->
        <template v-slot:item.email="{ item }">
          <div class="text-no-wrap text-medium-emphasis">{{ item.user.email }}</div>
        </template>

        <!-- 申請理由（長い場合は切り捨て） -->
        <template v-slot:item.reason="{ item }">
          <div class="text-truncate" style="max-width: 250px;" :title="item.reason">
            {{ item.reason }}
          </div>
        </template>

        <!-- ポートフォリオURL -->
        <template v-slot:item.portfolioUrl="{ item }">
          <a 
            v-if="item.portfolioUrl" 
            :href="item.portfolioUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-decoration-none"
          >
            <v-btn size="small" variant="text" color="primary" class="text-capitalize pa-1">
              <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
              リンク
            </v-btn>
          </a>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- ステータス -->
        <template v-slot:item.status="{ item }">
          <v-chip
            color="blue"
            size="small"
            class="text-caption"
            variant="flat"
          >
            未対応
          </v-chip>
        </template>

        <!-- 申請日時 -->
        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <!-- アクション -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-center">
            <v-btn 
              icon 
              variant="text" 
              density="comfortable" 
              color="primary"
              @click="openDetailDialog(item)"
              :disabled="isActionDisabled"
            >
              <v-icon>mdi-eye-outline</v-icon>
              <v-tooltip activator="parent" location="top">詳細を表示</v-tooltip>
            </v-btn>
          </div>
        </template>

        <!-- ローディング -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@6" />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 詳細ダイアログ -->
    <v-dialog v-model="isDetailDialogOpen" max-width="700">
      <v-card v-if="selectedRequest" class="developer-detail-dialog">
        <v-toolbar color="primary" dark>
          <v-toolbar-title>開発者申請詳細</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="isDetailDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <!-- ステータスバッジ -->
          <div class="d-flex justify-end mb-4">
            <v-chip
              color="blue"
              size="small"
              class="text-caption"
              variant="flat"
            >
              未対応
            </v-chip>
          </div>

          <v-row>
            <!-- 左側：申請者情報 -->
            <v-col cols="12" md="6">
              <v-card variant="flat" class="pa-3 mb-4 border rounded">
                <v-card-title class="px-0 py-1 text-subtitle-1">
                  <v-icon size="small" class="mr-2">mdi-account</v-icon>申請者情報
                </v-card-title>
                <v-divider class="mb-3"></v-divider>
                
                <div class="d-flex py-1">
                  <div class="text-subtitle-2 font-weight-medium" style="width: 100px;">名前</div>
                  <div>{{ selectedRequest.user.name }}</div>
                </div>
                
                <div class="d-flex py-1">
                  <div class="text-subtitle-2 font-weight-medium" style="width: 100px;">メール</div>
                  <div>{{ selectedRequest.user.email }}</div>
                </div>
                
                <div class="d-flex py-1">
                  <div class="text-subtitle-2 font-weight-medium" style="width: 100px;">申請日時</div>
                  <div>{{ formatDate(selectedRequest.createdAt, true) }}</div>
                </div>
              </v-card>
            </v-col>
            
            <!-- 右側：申請詳細 -->
            <v-col cols="12" md="6">
              <v-card variant="flat" class="pa-3 mb-4 border rounded">
                <v-card-title class="px-0 py-1 text-subtitle-1">
                  <v-icon size="small" class="mr-2">mdi-file-document</v-icon>申請内容
                </v-card-title>
                <v-divider class="mb-3"></v-divider>
                
                <div class="mb-2">
                  <div class="text-subtitle-2 font-weight-medium mb-1">申請理由</div>
                  <div style="white-space: pre-line;" class="pa-2 bg-grey-lighten-4 rounded">{{ selectedRequest.reason }}</div>
                </div>
                
                <div v-if="selectedRequest.portfolioUrl">
                  <div class="text-subtitle-2 font-weight-medium mb-1">ポートフォリオ</div>
                  <div class="pa-2">
                    <a :href="selectedRequest.portfolioUrl" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
                      {{ selectedRequest.portfolioUrl }}
                    </a>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- 却下理由入力欄（却下時のみ表示） -->
          <v-expand-transition>
            <div v-if="showRejectionReasonInput">
              <v-card variant="flat" class="pa-3 mb-4 border rounded" :class="{'border-error': status === 'REJECTED', 'border-success': status === 'APPROVED'}">
                <v-card-title class="px-0 py-1 text-subtitle-1" :class="{'text-error': status === 'REJECTED', 'text-success': status === 'APPROVED'}">
                  <v-icon size="small" class="mr-2" :color="status === 'REJECTED' ? 'error' : 'success'">
                    {{ status === 'REJECTED' ? 'mdi-close-circle' : 'mdi-check-circle' }}
                  </v-icon>
                  {{ status === 'REJECTED' ? '却下理由' : '承認理由' }}
                </v-card-title>
                <v-divider class="mb-3"></v-divider>
                
                <v-textarea
                  v-model="resultReason"
                  :label="status === 'REJECTED' ? '却下理由を入力してください' : '承認理由を入力してください'"
                  hint="申請者に送信されるメールに含まれます"
                  persistent-hint
                  variant="outlined"
                  rows="3"
                  counter="200"
                  maxlength="200"
                  density="comfortable"
                  autofocus
                ></v-textarea>
              </v-card>
            </div>
          </v-expand-transition>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <!-- PENDING状態の場合のみアクションボタンを表示 -->
          <template v-if="selectedRequest.status === 'PENDING'">
            <v-btn
              v-if="!showRejectForm"
              color="success"
              variant="elevated"
              prepend-icon="mdi-check-circle"
              :loading="isActionInProgress"
              :disabled="isActionInProgress"
              @click="confirmAction('APPROVED')"
            >
              承認する
              <v-tooltip activator="parent" location="top">メールで承認通知が送信されます</v-tooltip>
            </v-btn>
            <v-btn
              v-if="!showRejectForm"
              color="error"
              variant="elevated"
              class="ml-3"
              prepend-icon="mdi-close-circle"
              :loading="isActionInProgress"
              :disabled="isActionInProgress"
              @click="showRejectForm = true; showRejectionReasonInput = true; status = 'REJECTED'"
            >
              却下する
            </v-btn>
          </template>
          
          <!-- 却下フォーム表示時の確定ボタン -->
          <template v-if="showRejectForm">
            <v-btn
              color="error"
              variant="elevated"
              :loading="isActionInProgress"
              :disabled="isActionInProgress"
              @click="confirmAction('REJECTED')"
            >
              却下を確定
              <v-tooltip activator="parent" location="top">メールで却下通知が送信されます</v-tooltip>
            </v-btn>
            <v-btn
              color="default"
              variant="text"
              class="ml-3"
              @click="showRejectForm = false; showRejectionReasonInput = false"
            >
              キャンセル
            </v-btn>
          </template>
          
          <!-- 承認/却下済みの場合は閉じるボタンのみ -->
          <v-btn
            v-if="selectedRequest.status !== 'PENDING' || (!showRejectForm && selectedRequest.status === 'PENDING')"
            color="primary"
            variant="text"
            @click="isDetailDialogOpen = false"
          >
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 結果通知用スナックバー -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          閉じる
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import PageTitle from '~/components/PageTitle.vue';
import { useNuxtApp } from '#app';

definePageMeta({
  layout: 'admin',
});

// 型定義
interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface DeveloperRequest {
  id: number;
  userId: number;
  user: User;
  reason: string;
  portfolioUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

type SortItem = { key: string; order: 'asc' | 'desc' };

// APIクライアント
const { $api } = useNuxtApp();

// 状態管理
const developerRequests = ref<DeveloperRequest[]>([]);
const isLoading = ref(false);
const isActionInProgress = ref(false);
const isDetailDialogOpen = ref(false);
const selectedRequest = ref<DeveloperRequest | null>(null);
const page = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [
  { value: 10, title: '10件' },
  { value: 20, title: '20件' },
  { value: 50, title: '50件' },
];
const totalItems = ref(0);
const search = ref('');
const showRejectForm = ref(false);
const showRejectionReasonInput = ref(false);
const resultReason = ref('');
const isActionDisabled = ref(false);
const status = ref<'APPROVED' | 'REJECTED'>('REJECTED');
const sortBy = ref<SortItem[]>([{ key: 'createdAt', order: 'desc' }]);

// スナックバー
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// テーブルヘッダー
const headers = [
  { title: '名前', key: 'name', sortable: false },
  { title: 'メールアドレス', key: 'email', sortable: false },
  { title: '申請理由', key: 'reason', sortable: false },
  { title: 'ポートフォリオ', key: 'portfolioUrl', sortable: false },
  { title: '申請日時', key: 'createdAt', align: 'start' as const, width: 150, sortable: true },
  { title: 'アクション', key: 'actions', sortable: false, align: 'center' as const, width: 100 },
];

// 日付フォーマット
const formatDate = (dateString: string, showTime = false) => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: showTime ? '2-digit' : undefined,
    minute: showTime ? '2-digit' : undefined,
  });
  return formatter.format(date);
};

// アイテム数の更新
const updateItemsPerPage = (value: number) => {
  itemsPerPage.value = value;
  page.value = 1;
  fetchDeveloperRequests();
};

// 開発者申請一覧を取得
const fetchDeveloperRequests = async (options?: any) => {
  isLoading.value = true;
  try {
    // optionsから値を取得
    if (options) {
      page.value = options.page;
      itemsPerPage.value = options.itemsPerPage;
      if (options.sortBy && options.sortBy.length > 0) {
        sortBy.value = options.sortBy;
      }
    }

    const params = {
      page: page.value,
      limit: itemsPerPage.value,
      search: search.value || undefined,
      status: 'PENDING', // 常にPENDINGステータスの申請のみ取得
      sortBy: sortBy.value.length > 0 ? sortBy.value[0].key : 'createdAt',
      sortOrder: sortBy.value.length > 0 ? sortBy.value[0].order : 'desc',
    };

    const response = await $api.get('/admin/developer-requests', { params });
    developerRequests.value = response.data.data;
    totalItems.value = response.data.total;
  } catch (error) {
    console.error('開発者申請の取得に失敗しました', error);
    showSnackbar('開発者申請の取得に失敗しました', 'error');
  } finally {
    isLoading.value = false;
  }
};

// 詳細ダイアログを開く
const openDetailDialog = async (request: DeveloperRequest) => {
  isActionDisabled.value = true;
  try {
    // 詳細情報を取得
    const response = await $api.get(`/admin/developer-requests/${request.id}`);
    selectedRequest.value = response.data;
    isDetailDialogOpen.value = true;
    // リセット
    showRejectForm.value = false;
    showRejectionReasonInput.value = false;
    resultReason.value = '';
  } catch (error) {
    console.error('開発者申請詳細の取得に失敗しました', error);
    showSnackbar('開発者申請詳細の取得に失敗しました', 'error');
  } finally {
    isActionDisabled.value = false;
  }
};

// 承認/却下アクションの確認
const confirmAction = async (actionStatus: 'APPROVED' | 'REJECTED') => {
  if (!selectedRequest.value) return;
  
  // ステータスを更新
  status.value = actionStatus;
  
  // 承認時に理由入力ダイアログを表示
  if (actionStatus === 'APPROVED' && !showRejectionReasonInput.value) {
    showRejectionReasonInput.value = true;
    return;
  }
  
  isActionInProgress.value = true;
  try {
    const payload = {
      status: actionStatus,
      // 申請結果の理由を送信
      ...(resultReason.value ? { resultReason: resultReason.value } : {})
    };
    
    await $api.patch(`/admin/developer-requests/${selectedRequest.value.id}/status`, payload);
    
    // UIを更新
    if (selectedRequest.value) {
      selectedRequest.value.status = actionStatus;
    }
    
    // 成功メッセージ
    const message = actionStatus === 'APPROVED' 
      ? '開発者申請を承認しました' 
      : '開発者申請を却下しました';
    
    showSnackbar(message, 'success');
    
    // リスト再取得
    await fetchDeveloperRequests();
    
    // ダイアログを閉じる（アクションが完了した場合）
    isDetailDialogOpen.value = false;
  } catch (error) {
    console.error('開発者申請の更新に失敗しました', error);
    showSnackbar('開発者申請の更新に失敗しました', 'error');
  } finally {
    isActionInProgress.value = false;
    showRejectForm.value = false;
    showRejectionReasonInput.value = false;
  }
};

// スナックバー表示
const showSnackbar = (text: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  };
};

// 検索・ステータス変更時のウォッチャー
watch([search], () => {
  page.value = 1; // ページをリセット
  fetchDeveloperRequests();
}, { deep: true });

// 初期データ取得
onMounted(() => {
  fetchDeveloperRequests();
});
</script>

<style scoped>
.developer-requests-table :deep(th) {
  white-space: nowrap;
  font-weight: 600 !important;
}

.developer-requests-table :deep(tr) {
  cursor: pointer;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.developer-detail-dialog {
  .border {
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
  }
  
  .border-error {
    border: 1px solid rgb(var(--v-theme-error)) !important;
  }
}
</style> 
