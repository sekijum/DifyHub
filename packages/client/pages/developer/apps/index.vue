<template>
    <v-container>
        <div class="d-flex justify-space-between align-center mb-4">
        <PageTitle title="アプリ管理" />
        <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" @click="goToCreatePage">
          新規登録
        </v-btn>
      </div>
      <v-row>
        <v-col>
          <v-card variant="outlined">
  
            <!-- Filter Controls Row -->
            <v-row dense class="pa-4 pt-2">
              <v-col cols="12" sm="4" md="3">
                 <v-select
                  v-model="selectedStatus"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス"
                  density="compact"
                  outlined
                  hide-details
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="8" md="5">
                 <v-text-field
                  v-model="search"
                  append-inner-icon="mdi-magnify"
                  label="検索 (名前, 説明)"
                  single-line
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
  
            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="apps" 
              :items-per-page="itemsPerPage"
              @update:items-per-page="updateItemsPerPage($event)"
              :sort-by="sortBy"
              @update:sort-by="updateSortBy($event)"
              :multi-sort="false"
              class="elevation-0"
              density="compact"
              :loading="loading"
              loading-text="データを読み込み中..."
              :hover="true"
              items-per-page-text="表示行数"
               :items-per-page-options="itemsPerPageOptions"
            >
               <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" density="compact" label>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>
              <template v-slot:item.usageCount="{ item }">
                {{ item.usageCount?.toLocaleString() ?? 0 }}
              </template>
              <template v-slot:item.likeRatio="{ item }">
                 {{ item.likeRatio ? `${item.likeRatio}%` : '-' }}
              </template>
              <template v-slot:item.bookmarkCount="{ item }">
                {{ item.bookmarkCount?.toLocaleString() ?? 0 }}
              </template>
              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt, { format: 'YYYY/MM/DD HH:mm' }) }}
              </template>
               <template v-slot:item.actions="{ item }">
                <v-icon 
                  small 
                  class="mr-2" 
                  @click="goToEditPage(item)" 
                  :class="{ 'text-grey': isEditDeleteDisabled(item) }"
                >
                  mdi-pencil
                </v-icon>
                <v-icon 
                  small 
                  @click="openDeleteDialog(item)" 
                  :class="{ 'text-grey': isEditDeleteDisabled(item) }"
                >
                  mdi-delete
                </v-icon>
              </template>
               <template v-slot:no-data>
                  あなたが作成したアプリが見つかりません。
               </template>
            </v-data-table>
  
            <!-- Pagination -->
            <div class="d-flex justify-center pt-2 pb-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(totalApps / itemsPerPage)"
                :total-visible="7"
              ></v-pagination>
            </div>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Dialogs -->
      <ConfirmationDialog
        v-model="isDeleteDialogOpen"
        title="アプリ削除確認"
        :message="`アプリ「${appToDelete?.name}」を削除しますか？`"
        confirm-text="削除する"
        confirm-color="error"
        @confirm="confirmDeleteApp"
      />
  
      <!-- トースト通知 -->
      <v-snackbar
        v-model="toast.show"
        :color="toast.color"
        :timeout="toast.timeout"
        location="top"
      >
        {{ toast.message }}
        <template v-slot:actions>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="toast.show = false"
          ></v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useNuxtApp } from '#app';
  import type { VDataTable } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  import ConfirmationDialog from '~/components/ConfirmationDialog.vue';
  import { AppStatus } from '~/types/app';
  import type { App, PaginatedAppsResult } from '~/types/app';
  import { formatDate } from '~/plugins/dayjs';
  
  definePageMeta({
    layout: 'developer',
  });
  
  const router = useRouter();
  const route = useRoute();
  
  // トースト通知用の状態
  const toast = ref({
    show: false,
    message: '',
    color: 'success',
    timeout: 3000,
  });
  
  // 成功メッセージを表示
  const showSuccessToast = (message: string, timeout?: number) => {
    toast.value = {
      show: true,
      message,
      color: 'success',
      timeout: timeout || 3000,
    };
  };
  
  // エラーメッセージを表示
  const showErrorToast = (message: string, timeout?: number) => {
    toast.value = {
      show: true,
      message,
      color: 'error',
      timeout: timeout || 3000,
    };
  };
  
  type SortItem = { key: string; order: 'asc' | 'desc' };
  
  // ページネーション状態
  const page = ref(Number(route.query.page) || 1);
  const totalApps = ref(0);
  
  // 検索とフィルター状態
  const search = ref(route.query.q as string || '');
  const selectedStatus = ref<string | null>(route.query.status as string || null);
  const itemsPerPage = ref(Number(route.query.limit) || 10);
  const initialSortBy: SortItem[] = route.query.sort_by
      ? [{ key: route.query.sort_by as string, order: (route.query.sort_order || 'asc') as 'asc' | 'desc' }]
      : [{ key: 'createdAt', order: 'desc' }]; 
  const sortBy = ref<SortItem[]>(initialSortBy);
  
  const loading = ref(false);
  const isDeleteDialogOpen = ref(false);
  const appToDelete = ref<App | null>(null);
  
  type ReadonlyHeaders = VDataTable['$props']['headers'];
  
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80 },
    { title: '名前', key: 'name', align: 'start', sortable: false },
    { title: 'ステータス', key: 'status', align: 'center', width: 120, sortable: false },
    { title: '使用回数', key: 'usageCount', align: 'end', width: 100 },
    { title: '高評価率', key: 'likeRatio', align: 'end', width: 100, sortable: false },
    { title: 'ブックマーク数', key: 'bookmarkCount', align: 'end', width: 120, sortable: false },
    { title: '作成日', key: 'createdAt', align: 'start', width: 150 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];
  
  // ステータス選択肢
  const statusOptions = ref([
      { title: '公開', value: AppStatus.PUBLISHED },
      { title: '下書き', value: AppStatus.DRAFT },
      { title: '非公開', value: AppStatus.PRIVATE },
      { title: 'アーカイブ', value: AppStatus.ARCHIVED },
      { title: '停止中', value: AppStatus.SUSPENDED },
  ]);
  
  const apps = ref<App[]>([]);
  
  // アプリ一覧取得
  const fetchApps = async () => {
    loading.value = true;
    
    try {
      // クエリパラメータの構築
      const params = new URLSearchParams();
      params.append('page', page.value.toString());
      params.append('limit', itemsPerPage.value.toString());
      
      if (search.value) {
        params.append('search', search.value);
      }
      if (selectedStatus.value) {
        params.append('status', selectedStatus.value);
      }
      
      const currentSort = sortBy.value[0];
      if (currentSort) {
        params.append('sortBy', currentSort.key);
        params.append('sortOrder', currentSort.order);
      }
      
      const { $api } = useNuxtApp();
      const response = await $api.get<PaginatedAppsResult>('/developer/apps', { params });
      apps.value = response.data.data;
      totalApps.value = response.data.total;
    } catch (error) {
      console.error('アプリ一覧の取得に失敗しました:', error);
      showErrorToast('アプリ一覧の取得に失敗しました');
      apps.value = [];
    } finally {
      loading.value = false;
    }
  };
  
  // リスト更新関数
  const refreshList = () => {
    fetchApps();
  };
  
  // Items per page options and handler
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];
  
  const updateItemsPerPage = (value: number) => {
    itemsPerPage.value = value;
    updateQueryParameters();
  };
  
  // Sort handler
  const updateSortBy = (newSortBy: SortItem[]) => {
    sortBy.value = newSortBy;
  };
  
  // 編集・削除アイコンの無効化表示のみに使用
  const isEditDeleteDisabled = (app: App) => {
    return app.status === AppStatus.SUSPENDED;
  };
  
  // Status display helpers
  const getStatusColor = (status: string): string => {
    switch (status) {
      case AppStatus.PUBLISHED: return 'green';
      case AppStatus.DRAFT: return 'orange';
      case AppStatus.PRIVATE: return 'blue';
      case AppStatus.ARCHIVED: return 'grey-lighten-1';
      case AppStatus.SUSPENDED: return 'red';
      default: return 'grey';
    }
  };
  
  const getStatusText = (status: string): string => {
      const option = statusOptions.value.find(o => o.value === status);
      return option ? option.title : status;
  };
  
  // クエリパラメータの更新
  const updateQueryParameters = () => {
    const query: Record<string, any> = {};
    query.page = page.value;
    if (selectedStatus.value) query.status = selectedStatus.value;
    if (itemsPerPage.value !== 10) query.limit = itemsPerPage.value;
    if (search.value) query.q = search.value;
  
    const currentSort = sortBy.value[0];
    if (currentSort && (currentSort.key !== 'createdAt' || currentSort.order !== 'desc')) {
       query.sort_by = currentSort.key;
       query.sort_order = currentSort.order;
    }
  
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
        router.replace({ query });
    }
  };
  
  // 編集ページへの遷移 - すべての状態で遷移可能
  const goToEditPage = (app: App) => {
    router.push(`/developer/apps/${app.id}/edit`);
  };
  
  // Function to navigate to the create page
  const goToCreatePage = () => {
    router.push('/developer/apps/new');
  };
  
  // 削除処理 - 停止中は削除不可
  const openDeleteDialog = (app: App) => {
    if (app.status === AppStatus.SUSPENDED) {
      showErrorToast('停止中のアプリは削除できません');
      return;
    }
    appToDelete.value = app;
    isDeleteDialogOpen.value = true;
  };
  
  const confirmDeleteApp = async () => {
    if (!appToDelete.value) return;
    
    try {
      const { $api } = useNuxtApp();
      await $api.delete(`/developer/apps/${appToDelete.value.id}`);
      showSuccessToast('アプリを削除しました');
      refreshList();
    } catch (error) {
      console.error('削除エラー:', error);
      showErrorToast('アプリの削除に失敗しました');
    } finally {
      isDeleteDialogOpen.value = false;
      appToDelete.value = null;
    }
  };
  
  // データの監視とフェッチ
  watch([page, selectedStatus, search, sortBy], () => {
    updateQueryParameters();
    fetchApps();
  }, { deep: true });
  
  onMounted(() => {
    fetchApps();
  });
  
  </script>
  
  <style scoped>
  .v-data-table {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
  .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }
  </style> 
  