<template>
    <v-container fluid>
        <PageTitle title="管理者管理" />
        
        <!-- シンプル化したフィルター -->
        <v-row dense class="mb-2">
          <v-col cols="12" sm="3" md="2">
            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="ステータス"
              density="comfortable"
              variant="outlined"
              clearable
              hide-details
              class="mt-2"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="5" md="4">
            <v-text-field
              v-model="search"
              append-inner-icon="mdi-magnify"
              label="検索 (名前, メール)"
              density="comfortable"
              variant="outlined"
              clearable
              hide-details
              @click:clear="search = ''"
              class="mt-2"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="4" md="3" class="d-flex justify-end align-center">
            <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" to="/admin/administrators/new" class="mt-2">
              新規登録
            </v-btn>
          </v-col>
        </v-row>
      
        <!-- 管理者テーブル -->
        <v-card variant="outlined">
          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            v-model:sort-by="sortBy"
            v-model:page="currentPage"
            :headers="headers"
            :items="administrators"
            :items-length="totalItems"
            :loading="loading"
            class="elevation-0"
            density="comfortable"
            hover
            items-per-page-text="表示行数"
            :items-per-page-options="itemsPerPageOptions"
            loading-text="データを読み込み中..."
            no-data-text="条件に一致する管理者が見つかりません"
            must-sort
            fixed-header
            height="calc(100vh - 220px)"
          >
            <!-- ID列のカスタマイズ -->
            <template v-slot:item.id="{ item }">
              <span class="text-body-2 font-weight-medium text-no-wrap">{{ item.id }}</span>
            </template>
            
            <!-- 名前列のカスタマイズ -->
            <template v-slot:item.name="{ item }">
              <span class="text-no-wrap">{{ item.name }}</span>
            </template>
            
            <!-- メールアドレス列のカスタマイズ -->
            <template v-slot:item.email="{ item }">
              <span class="text-no-wrap">{{ item.email }}</span>
            </template>

            <!-- ステータス列のカスタマイズ -->
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                label
                class="text-no-wrap"
              >
                {{ getStatusText(item.status) }}
              </v-chip>
            </template>

            <!-- 登録日列のカスタマイズ -->
            <template v-slot:item.createdAt="{ item }">
              <span class="text-no-wrap">{{ formatDate(item.createdAt) }}</span>
            </template>

            <!-- アクション列のカスタマイズ -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex justify-end">
                <v-tooltip location="top" text="編集">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="goToEditPage(item)"
                      class="mr-1"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                
                <v-tooltip location="top" :text="item.id === currentUserId ? '自分自身は削除できません' : '削除'">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="handleDeleteAdmin(item)"
                      :disabled="item.id === currentUserId"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
            
            <!-- ローディング表示のカスタマイズ -->
            <template v-slot:loading>
              <v-skeleton-loader type="table-row@6"></v-skeleton-loader>
            </template>
          </v-data-table-server>
        </v-card>
  
      <!-- エラー通知用スナックバー -->
      <v-snackbar
        v-model="showSnackbar"
        :color="snackbarColor"
        :timeout="3000"
        location="top"
      >
        {{ snackbarText }}
        <template v-slot:actions>
          <v-btn
            variant="text"
            @click="showSnackbar = false"
          >
            閉じる
          </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import type { VDataTableServer } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  import { UserStatus } from '~/constants/user-status';
  import type { UserStatusType } from '~/constants/user-status';
  import { useGlobalModal } from '~/composables/useGlobalModal';
  
  definePageMeta({
    layout: 'admin',
  });
  
  const router = useRouter();
  const route = useRoute();
  const { $api, payload } = useNuxtApp();
  const { confirmDelete } = useGlobalModal();
  
  // --- Types and Interfaces ---
  type SortItem = { key: string; order: 'asc' | 'desc' };

  // 管理者データの型定義
  interface Administrator {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
    status: UserStatusType;
    createdAt: string;
  }
  
  // ページネーション結果型
  interface PaginatedAdministratorsResult {
    data: Administrator[];
    total: number;
  }
  
  // --- State Initialization ---
  const administrators = ref<Administrator[]>([]);
  const totalItems = ref<number>(0);
  const loading = ref<boolean>(false);
  const search = ref<string>(route.query.search as string || '');
  const selectedStatus = ref<UserStatusType | null>(route.query.status as UserStatusType || null);
  const currentPage = ref<number>(Number(route.query.page) || 1);
  const itemsPerPage = ref<number>(Number(route.query.limit) || 10);
  const initialSortBy: SortItem[] = route.query.sortBy
      ? [{ key: route.query.sortBy as string, order: (route.query.sortOrder || 'desc') as 'asc' | 'desc' }]
      : [{ key: 'createdAt', order: 'desc' }];
  const sortBy = ref<SortItem[]>(initialSortBy);
  
  // 現在ログイン中のユーザーID
  const currentUserId = ref(payload.user.id);
  
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];
  
  // スナックバー状態
  const showSnackbar = ref<boolean>(false);
  const snackbarText = ref<string>('');
  const snackbarColor = ref<string>('success');
  
  // --- Data Table Headers ---
  type ReadonlyHeaders = VDataTableServer['$props']['headers'];
  
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80, sortable: true },
    { title: '名前', key: 'name', align: 'start', width: 150, sortable: true },
    { title: 'メールアドレス', key: 'email', align: 'start', width: 240, sortable: true },
    { title: 'ステータス', key: 'status', align: 'center', width: 100, sortable: true },
    { title: '登録日', key: 'createdAt', align: 'start', width: 180, sortable: true },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];
  
  // --- Filter Options ---
  const statusOptions = [
      { title: '有効', value: UserStatus.ACTIVE },
      { title: '停止中', value: UserStatus.SUSPENDED },
  ];
  
  // --- Data Fetching ---
  const fetchAdministrators = async (): Promise<void> => {
    loading.value = true;
    
    // APIリクエストパラメータ構築
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: itemsPerPage.value,
    };
    
    // 検索条件があれば追加
    if (search.value) params.search = search.value;
    if (selectedStatus.value) params.status = selectedStatus.value;
    
    // ソート条件があれば追加
    if (sortBy.value.length > 0 && sortBy.value[0].key) {
      params.sortBy = sortBy.value[0].key;
      params.sortOrder = sortBy.value[0].order;
    }

    try {
      // API呼び出し
      const { data: response } = await $api.get<PaginatedAdministratorsResult>('/admin/administrators', {
        params,
      });
      
      // レスポンス処理
      if (response) {
        administrators.value = response.data;
        totalItems.value = response.total || 0;
      } else {
        showError('予期しないAPIレスポース形式です');
        administrators.value = [];
        totalItems.value = 0;
      }
      
      // URLクエリパラメータ更新
      updateQueryParameters(params);
    } catch (error: any) {
      showError(error.response?.data?.message || '管理者情報の取得に失敗しました');
      administrators.value = [];
      totalItems.value = 0;
    } finally {
      loading.value = false;
    }
  };

  // URLクエリパラメータ更新関数
  const updateQueryParameters = (fetchedParams: Record<string, any>): void => {
    const query: Record<string, any> = {};
    
    // 現在のページが1以外なら追加
    if (fetchedParams.page && fetchedParams.page !== 1) {
      query.page = fetchedParams.page;
    }
    
    // 表示件数が10以外なら追加
    if (fetchedParams.limit && fetchedParams.limit !== 10) {
      query.limit = fetchedParams.limit;
    }
    
    // 検索条件があれば追加
    if (fetchedParams.search) query.search = fetchedParams.search;
    if (fetchedParams.status) query.status = fetchedParams.status;
    
    // ソート条件がデフォルト以外なら追加
    if (fetchedParams.sortBy && (fetchedParams.sortBy !== 'createdAt' || fetchedParams.sortOrder !== 'desc')) {
      query.sortBy = fetchedParams.sortBy;
      query.sortOrder = fetchedParams.sortOrder;
    }

    // 現在のクエリと異なる場合のみ更新
    const currentQueryString = JSON.stringify(route.query);
    const newQueryString = JSON.stringify(query);
    if (newQueryString !== currentQueryString) {
      router.replace({ query });
    }
  };
  
  // --- Display Helpers ---
  const getStatusText = (status: UserStatusType): string => {
    switch (status) {
      case UserStatus.ACTIVE: return '有効';
      case UserStatus.SUSPENDED: return '停止中';
      default: return '未設定';
    }
  };
  
  const getStatusColor = (status: UserStatusType): string => {
    switch (status) {
      case UserStatus.ACTIVE: return 'success';
      case UserStatus.SUSPENDED: return 'error';
      default: return 'grey';
    }
  };
  
  // 日付フォーマット用ヘルパー関数
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleString('ja-JP', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // エラー表示用ヘルパー関数
  const showError = (message: string): void => {
    snackbarText.value = message;
    snackbarColor.value = 'error';
    showSnackbar.value = true;
  };

  // 成功表示用ヘルパー関数
  const showSuccess = (message: string): void => {
    snackbarText.value = message;
    snackbarColor.value = 'success';
    showSnackbar.value = true;
  };
  
  // --- Actions ---
  const goToEditPage = (admin: Administrator): void => {
    router.push(`/admin/administrators/${admin.id}/edit`);
  };
  
  // --- Delete Actions ---
  const handleDeleteAdmin = async (admin: Administrator): Promise<void> => {
    const confirmed = await confirmDelete(admin.name, '管理者');
    
    if (!confirmed) return;
    
    try {
      await $api.delete(`/admin/administrators/${admin.id}`);
      showSuccess(`管理者「${admin.name}」を削除しました`);
      fetchAdministrators();
    } catch (error: any) {
      showError(error.response?.data?.message || '管理者の削除に失敗しました');
    }
  };
  
  // 検索条件変更時のデバウンス処理
  let searchTimeout: NodeJS.Timeout | null = null;
  watch(search, () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      currentPage.value = 1; // 1ページ目に戻す
      fetchAdministrators();
    }, 500);
  });

  // フィルター条件変更時の処理
  watch([selectedStatus, itemsPerPage, sortBy], (newValues, oldValues) => {
    // 条件変更時は1ページ目に戻す
    const statusChanged = newValues[0] !== oldValues[0];
    const itemsPerPageChanged = newValues[1] !== oldValues[1];
    const sortByChanged = JSON.stringify(newValues[2]) !== JSON.stringify(oldValues[2]);

    if (currentPage.value !== 1 && (statusChanged || itemsPerPageChanged || sortByChanged)) {
      currentPage.value = 1;
    }
    
    fetchAdministrators();
  }, { deep: true });

  // ページ変更時の処理
  watch(currentPage, () => {
    fetchAdministrators();
  });
  
  // 初期データ取得
  onMounted(() => {
    fetchAdministrators();
  });

  </script>
  
  <style scoped>
  .v-data-table-server {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }

  .text-no-wrap {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: inline-block;
  }

  .v-data-table :deep(.v-data-table__td) {
    padding-top: 8px;
    padding-bottom: 8px;
    white-space: nowrap;
  }

  .v-data-table :deep(.v-data-table__th) {
    white-space: nowrap;
  }

  .v-data-table :deep(.v-data-table__tr:hover > .v-data-table__td) {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
  </style> 
  