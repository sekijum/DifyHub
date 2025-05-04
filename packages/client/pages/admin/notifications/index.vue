<template>
    <v-container>      
      <div class="d-flex justify-space-between align-center mb-4">
        <PageTitle title="お知らせ管理" />
        <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" @click="goToCreatePage">
          新規登録
        </v-btn>
      </div>

      <!-- 検索フィルター -->
      <v-card class="mb-4" variant="outlined">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="filters.search"
                label="検索"
                placeholder="タイトル・内容で検索"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                hide-details
                @update:model-value="debouncedSearch"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="filters.level"
                :items="levelOptions"
                item-title="title"
                item-value="value"
                label="レベル"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                @update:model-value="resetPage"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="filters.isActive"
                :items="activeOptions"
                item-title="title"
                item-value="value"
                label="公開状態"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                @update:model-value="resetPage"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="3">
              <v-btn 
                block
                color="secondary" 
                @click="resetFilters"
                variant="outlined"
                density="compact"
              >
                フィルターリセット
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col>
          <v-card variant="outlined">
            <!-- Data Table -->
            <v-data-table-server
              :headers="headers"
              :items="notifications"
              :loading="loading"
              :items-length="totalItems"
              v-model:page="page"
              v-model:sort-by="sortBy"
              v-model:items-per-page="itemsPerPage"
              class="elevation-0"
              density="compact"
              hover
              items-per-page-text="表示行数"
              :items-per-page-options="itemsPerPageOptions"
              loading-text="データを読み込み中..."
              no-data-text="お知らせが見つかりません"
              @update:options="handleOptionsChange"
              fixed-header
            >
              <!-- IDとタイトル -->
              <template v-slot:item.title="{ item }">
                <div class="d-flex align-center">
                  <div class="font-weight-medium">{{ item.title }}</div>
                </div>
              </template>
              
              <!-- 内容 -->
              <template v-slot:item.content="{ item }">
                <div class="text-truncate" style="max-width: 300px;" :title="item.content">
                  {{ item.content }}
                </div>
              </template>
              
              <!-- レベル -->
              <template v-slot:item.level="{ item }">
                <v-chip :color="getStatusColor(item.level)" density="compact" label size="small">
                  {{ getStatusText(item.level) }}
                </v-chip>
              </template>
              
              <!-- 公開状態 -->
              <template v-slot:item.isActive="{ item }">
                <v-tooltip :text="getActiveTooltip(item)" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon 
                      v-bind="props"
                      :color="isActive(item) ? 'success' : 'grey'"
                      :icon="isActive(item) ? 'mdi-check-circle' : 'mdi-timer-outline'"
                      size="small"
                    ></v-icon>
                  </template>
                </v-tooltip>
              </template>
              
              <!-- トップ表示 -->
              <template v-slot:item.isVisibleOnTop="{ item }">
                <v-tooltip text="トップページに表示" v-if="item.isVisibleOnTop" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" color="primary" icon="mdi-star" size="small"></v-icon>
                  </template>
                </v-tooltip>
                <v-icon v-else color="grey" icon="mdi-star-outline" size="small"></v-icon>
              </template>
              
              <!-- 期間 -->
              <template v-slot:item.period="{ item }">
                <div class="text-caption">
                  {{ formatDateTime(item.startAt) }}
                  <template v-if="item.endAt">
                    <br>〜 {{ formatDateTime(item.endAt) }}
                  </template>
                  <template v-else>
                    <br>〜 無期限
                  </template>
                </div>
              </template>
              
              <!-- アクション -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end">
                  <v-tooltip text="編集" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        variant="text"
                        density="comfortable"
                        size="small"
                        @click="goToEditPage(item)"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  
                  <v-tooltip text="削除" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        variant="text"
                        density="comfortable"
                        size="small"
                        color="error"
                        @click="openDeleteDialog(item)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </div>
              </template>
              
              <!-- ローディング表示 -->
              <template v-slot:loading>
                <v-skeleton-loader type="table-row@6"></v-skeleton-loader>
              </template>
            </v-data-table-server>
          </v-card>
        </v-col>
      </v-row>

      <!-- Dialogs -->
      <ConfirmationDialog
        v-model="isDeleteDialogOpen"
        title="お知らせ削除確認"
        :message="`お知らせ「${notificationToDelete?.title}」を削除しますか？`"
        confirm-text="削除する"
        confirm-color="error"
        @confirm="confirmDeleteNotification"
      />

      <!-- Snackbar -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
        </template>
      </v-snackbar>

    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, watch, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useNuxtApp } from 'nuxt/app';
  import type { VDataTableServer } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  import ConfirmationDialog from '~/components/ConfirmationDialog.vue';

  // 型定義（useNotificationApiから移行）
  export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

  export interface Notification {
    id: number;
    title: string;
    content: string;
    level: NotificationLevel;
    startAt: string;
    endAt: string | null;
    isVisibleOnTop: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export interface NotificationQuery {
    page?: number;
    limit?: number;
    search?: string;
    level?: NotificationLevel;
    isVisibleOnTop?: boolean;
    isActive?: boolean;
    activeAfter?: string;
    activeBefore?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }

  export interface PaginatedResult<T> {
    data: T[];
    total: number;
  }

  definePageMeta({
    layout: 'admin',
  });
  
  const router = useRouter();
  const route = useRoute();
  const { $api } = useNuxtApp();
  
  // ローディングとエラー状態
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Type definitions
  type SortItem = { key: string; order: 'asc' | 'desc' };
  type ReadonlyHeaders = VDataTableServer['$props']['headers'];
  
  // ルートクエリからの初期値取得
  const getInitialPage = () => {
    const pageQuery = route.query.page;
    return pageQuery ? Number(pageQuery) : 1;
  };

  const getInitialItemsPerPage = () => {
    const limitQuery = route.query.limit;
    return limitQuery ? Number(limitQuery) : 10;
  };

  const getInitialSortBy = (): SortItem[] => {
    const sortByQuery = route.query.sortBy as string;
    const sortOrderQuery = (route.query.sortOrder as 'asc' | 'desc') || 'desc';
    
    if (sortByQuery) {
      return [{ key: sortByQuery, order: sortOrderQuery }];
    }
    
    return [{ key: 'createdAt', order: 'desc' }];
  };
  
  // Table State
  const notifications = ref<Notification[]>([]);
  const totalItems = ref(0);
  const page = ref(getInitialPage());
  const itemsPerPage = ref(getInitialItemsPerPage());
  const sortBy = ref<SortItem[]>(getInitialSortBy());
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];
  
  // Filters
  const filters = reactive({
    search: route.query.search as string || '',
    level: route.query.level as (NotificationLevel | null) || null,
    isActive: route.query.isActive ? (route.query.isActive === 'true') : null,
  });
  
  // Dialog States
  const isDeleteDialogOpen = ref(false);
  const notificationToDelete = ref<Notification | null>(null);
  const snackbar = reactive({ show: false, text: '', color: 'success' });
  
  // Options
  const levelOptions = [
    { title: '一般お知らせ (青)', value: 'INFO' },
    { title: '完了・成功 (緑)', value: 'SUCCESS' },
    { title: '注意・警告 (黄)', value: 'WARNING' },
    { title: '重要・エラー (赤)', value: 'ERROR' },
  ];
  
  const activeOptions = [
    { title: '現在公開中', value: true },
    { title: '非公開/期間外', value: false },
  ];
  
  // Table Headers
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 70, sortable: true },
    { title: 'タイトル', key: 'title', align: 'start', sortable: true },
    { title: '内容', key: 'content', align: 'start', sortable: false, width: 250 },
    { title: 'レベル', key: 'level', align: 'center', sortable: true, width: 100 },
    { title: '公開', key: 'isActive', align: 'center', sortable: true, width: 70 },
    { title: 'トップ', key: 'isVisibleOnTop', align: 'center', sortable: true, width: 70 },
    { title: '期間', key: 'period', align: 'start', sortable: false, width: 180 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];
  
  // Display Helpers
  const getStatusColor = (level: NotificationLevel): string => {
    switch (level) {
      case 'INFO': return 'blue';
      case 'SUCCESS': return 'green';
      case 'WARNING': return 'orange';
      case 'ERROR': return 'red';
      default: return 'grey';
    }
  };
  
  const getStatusText = (level: NotificationLevel): string => {
    const option = levelOptions.find(o => o.value === level);
    return option ? option.title.split(' ')[0] : level;
  };
  
  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    return `${y}-${m}-${d} ${h}:${min}`;
  };
  
  // CRUD Actions
  const goToEditPage = (notification: Notification) => {
    router.push(`/admin/notifications/${notification.id}/edit`);
  };
  
  const goToCreatePage = () => {
    router.push('/admin/notifications/new');
  };
  
  const openDeleteDialog = (notification: Notification) => {
    notificationToDelete.value = notification;
    isDeleteDialogOpen.value = true;
  };
  
  const confirmDeleteNotification = async () => {
    if (!notificationToDelete.value) return;
    const id = notificationToDelete.value.id;
    
    loading.value = true;
    error.value = null;
    
    try {
      await $api.delete(`/admin/notifications/${id}`);
      snackbar.text = 'お知らせを削除しました。';
      snackbar.color = 'success';
      // 現在のページのデータを再取得
      fetchNotifications();
    } catch (err: any) {
      error.value = err.response?.data?.message || `お知らせID ${id} の削除中にエラーが発生しました`;
      snackbar.text = error.value || '削除中にエラーが発生しました';
      snackbar.color = 'error';
      console.error(`お知らせ削除エラー (ID: ${id}):`, err);
    } finally {
      loading.value = false;
      snackbar.show = true;
      isDeleteDialogOpen.value = false;
      notificationToDelete.value = null;
    }
  };
  
  // URLクエリパラメータ更新関数
  const updateQueryParameters = (params: Record<string, any>): void => {
    const query: Record<string, any> = {};
    
    // 現在のページが1以外なら追加
    if (params.page && params.page !== 1) {
      query.page = params.page;
    }
    
    // 表示件数が10以外なら追加
    if (params.limit && params.limit !== 10) {
      query.limit = params.limit;
    }
    
    // 検索条件があれば追加
    if (params.search) query.search = params.search;
    if (params.level) query.level = params.level;
    if (params.isActive !== null && params.isActive !== undefined) {
      query.isActive = params.isActive.toString();
    }
    
    // ソート条件がデフォルト以外なら追加
    if (params.sortBy && (params.sortBy !== 'createdAt' || params.sortOrder !== 'desc')) {
      query.sortBy = params.sortBy;
      query.sortOrder = params.sortOrder;
    }

    // 現在のクエリと異なる場合のみ更新
    const currentQueryString = JSON.stringify(route.query);
    const newQueryString = JSON.stringify(query);
    if (newQueryString !== currentQueryString) {
      router.replace({ query });
    }
  };
  
  // Data Fetching
  const fetchNotifications = async () => {
    const sortItem = sortBy.value[0] || { key: 'createdAt', order: 'desc' };
    
    const query = {
      page: page.value,
      limit: itemsPerPage.value,
      search: filters.search || undefined,
      level: filters.level || undefined,
      isActive: filters.isActive !== null ? filters.isActive : undefined,
      sortBy: sortItem.key,
      sortOrder: sortItem.order,
    };
    
    console.log('Fetch params:', query); // デバッグ用ログ
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $api.get('/admin/notifications', { params: query });
      console.log('Response data:', response.data); // デバッグ用ログ
      
      // データが配列でない場合の保護
      if (Array.isArray(response.data.data)) {
        notifications.value = response.data.data;
      } else {
        notifications.value = [];
        console.error('返却データが配列ではありません:', response.data);
      }
      
      // 合計アイテム数の設定
      if (typeof response.data.total === 'number') {
        totalItems.value = response.data.total;
      } else {
        totalItems.value = 0;
        console.error('合計数が数値ではありません:', response.data);
      }
      
      // URLクエリパラメータを更新
      updateQueryParameters(query);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'お知らせの取得中にエラーが発生しました';
      console.error('お知らせ取得エラー:', err);
      notifications.value = [];
      totalItems.value = 0;
      
      // エラーメッセージを表示
      snackbar.text = error.value || 'お知らせの取得中にエラーが発生しました';
      snackbar.color = 'error';
      snackbar.show = true;
    } finally {
      loading.value = false;
    }
  };
  
  // オプションが変更されたときの処理
  const handleOptionsChange = (options: any) => {
    console.log('Options changed:', options);
    
    // ページ変更
    if (options.page !== page.value) {
      page.value = options.page;
    }
    
    // 表示件数変更
    if (options.itemsPerPage !== itemsPerPage.value) {
      itemsPerPage.value = options.itemsPerPage;
      page.value = 1; // ページをリセット
    }
    
    // ソート変更
    if (options.sortBy && options.sortBy.length > 0) {
      const newSortKey = options.sortBy[0].key;
      const newSortOrder = options.sortBy[0].order;
      const currentSort = sortBy.value[0] || { key: 'createdAt', order: 'desc' };
      
      if (!currentSort || newSortKey !== currentSort.key || newSortOrder !== currentSort.order) {
        sortBy.value = options.sortBy;
        page.value = 1; // ソート変更時はページをリセット
      }
    }
    
    // データを取得
    fetchNotifications();
  };
  
  // ページをリセットして検索
  const resetPage = () => {
    page.value = 1;
    fetchNotifications();
  };
  
  // Search Debounce
  let searchTimeout: NodeJS.Timeout | null = null;
  const debouncedSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      page.value = 1; // 検索時は1ページ目に戻す
      fetchNotifications();
    }, 500);
  };
  
  // Reset Filters
  const resetFilters = () => {
    filters.search = '';
    filters.level = null;
    filters.isActive = null;
    page.value = 1; // フィルタリセット時は1ページ目に戻す
    fetchNotifications();
  };
  
  // Lifecycle Hooks
  onMounted(() => {
    console.log('Component mounted, fetching notifications...'); // デバッグ用ログ
    fetchNotifications();
  });
  
  // 現在日時
  const now = new Date();

  // お知らせが現在公開中かどうかを判定する
  const isActive = (notification: Notification): boolean => {
    try {
      const startAt = new Date(notification.startAt);
      // 開始日時が未来の場合は非公開
      if (startAt > now) {
        return false;
      }
      
      // 終了日時がない場合は公開中
      if (!notification.endAt) {
        return true;
      }
      
      // 終了日時がある場合は比較
      const endAt = new Date(notification.endAt);
      return endAt >= now;
    } catch (e) {
      return false;
    }
  };

  // お知らせの公開状態に関するツールチップテキストを取得
  const getActiveTooltip = (notification: Notification): string => {
    try {
      const startAt = new Date(notification.startAt);
      
      // 開始日時が未来の場合
      if (startAt > now) {
        return `${formatDateTime(notification.startAt)}から公開予定`;
      }
      
      // 終了日時がない場合
      if (!notification.endAt) {
        return '現在公開中（無期限）';
      }
      
      // 終了日時がある場合
      const endAt = new Date(notification.endAt);
      if (endAt >= now) {
        return `現在公開中（${formatDateTime(notification.endAt)}まで）`;
      } else {
        return `公開期間終了（${formatDateTime(notification.endAt)}）`;
      }
    } catch (e) {
      return '状態不明';
    }
  };
  
  </script>
  
  <style scoped>
  .v-data-table-server {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
  .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }
  .v-data-table-server :deep(.v-data-table__td) {
    padding-top: 8px;
    padding-bottom: 8px;
    white-space: nowrap;
  }
  .v-data-table-server :deep(.v-data-table__th) {
    white-space: nowrap;
  }
  .v-data-table-server :deep(.v-data-table__tr:hover > .v-data-table__td) {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
  </style> 
  