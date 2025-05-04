<template>
    <v-container>
      <div class="d-flex justify-space-between align-center mb-4">
        <PageTitle title="アプリ管理" />
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
                  @update:model-value="debouncedFetchApps"
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
               <template v-slot:item.actions="{ item }">
                <v-icon small class="mr-2" @click="goToEditPage(item)">mdi-pencil</v-icon>
              </template>
               <template v-slot:no-data>
                  条件に一致するアプリが見つかりません。
               </template>
            </v-data-table>

            <div class="pa-4 d-flex justify-center">
              <v-pagination
                v-if="totalPages > 1"
                v-model="currentPage"
                :length="totalPages"
                rounded="circle"
                @update:model-value="fetchApps"
              ></v-pagination>
            </div>
          </v-card>
        </v-col>
      </v-row>
  
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import type { VDataTable } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  
  definePageMeta({
    layout: 'admin',
  });
  
  const router = useRouter();
  const route = useRoute();
  const { $api } = useNuxtApp();
  
  type SortItem = { key: string; order: 'asc' | 'desc' };
  
  // Initialize state from route query parameters
  const search = ref(route.query.q as string || '');
  const selectedStatus = ref<string | null>(route.query.status as string || null); // App status filter
  const itemsPerPage = ref(Number(route.query.limit) || 10);
  const currentPage = ref(Number(route.query.page) || 1);
  const initialSortBy: SortItem[] = route.query.sort_by
      ? [{ key: route.query.sort_by as string, order: (route.query.sort_order || 'asc') as 'asc' | 'desc' }]
      : [{ key: 'createdAt', order: 'desc' }]; // Default sort by createdAt desc
  const sortBy = ref<SortItem[]>(initialSortBy);
  
  const loading = ref(false);
  const apps = ref([]);
  const totalItems = ref(0);
  
  type ReadonlyHeaders = VDataTable['$props']['headers'];
  
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80 },
    { title: '名前', key: 'name', align: 'start', sortable: true },
    { title: '作成者', key: 'creator.name', align: 'start', sortable: true },
    { title: 'ステータス', key: 'status', align: 'center', width: 120, sortable: true },
    { title: '作成日', key: 'createdAt', align: 'start', width: 150, sortable: true },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];
  
  // Options for app status select
  const statusOptions = ref([
      { title: '公開', value: 'PUBLISHED' },
      { title: '下書き', value: 'DRAFT' },
      { title: 'アーカイブ', value: 'ARCHIVED' },
      { title: '非公開', value: 'PRIVATE' },
      { title: '停止中', value: 'SUSPENDED' },
  ]);

  // APIから取得したアプリデータの型定義
  interface App {
    id: number;
    name: string;
    creator: {
      id: number;
      name: string;
      email?: string;
      avatarUrl?: string | null;
    };
    description?: string;
    thumbnailUrl?: string | null;
    status: string;
    categoryId?: number | null;
    category?: {
      id: number;
      name: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
      ratings: number;
      bookmarks: number;
    };
  }
  
  // ページネーション関連の計算値
  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / itemsPerPage.value);
  });

  // API呼び出し（データフェッチ）
  const fetchApps = async () => {
    loading.value = true;
    
    try {
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

      // API呼び出し
      const { data: response } = await $api.get('/admin/apps', {
        params,
      });
      
      // レスポンス処理
      if (response) {
        apps.value = response.data;
        totalItems.value = response.total || 0;
      } else {
        showError('予期しないAPIレスポンス形式です');
        apps.value = [];
        totalItems.value = 0;
      }
      
      // URLクエリパラメータ更新
      updateQueryParameters();
    } catch (error: any) {
      showError(error.response?.data?.message || 'アプリ情報の取得に失敗しました');
      apps.value = [];
      totalItems.value = 0;
    } finally {
      loading.value = false;
    }
  };

  // 検索時のデバウンス処理
  let debounceTimeout: NodeJS.Timeout | null = null;
  const debouncedFetchApps = () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      currentPage.value = 1; // 検索時は1ページ目に戻す
      fetchApps();
    }, 300);
  };
  
  // Function to update URL query parameters
  const updateQueryParameters = () => {
    const query: Record<string, any> = {
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    
    if (selectedStatus.value) query.status = selectedStatus.value;
    if (search.value) query.q = search.value;
  
    const currentSort = sortBy.value[0];
    if (currentSort) {
       query.sort_by = currentSort.key;
       query.sort_order = currentSort.order;
    }
  
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
        router.replace({ query });
    }
  };
  
  // Watch filters and sorting
  watch([selectedStatus], () => {
    currentPage.value = 1; // ステータス変更時は1ページ目に戻す
    fetchApps();
  });
  
  // Items per page options and handler
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];
  
  const updateItemsPerPage = (value: number) => {
    itemsPerPage.value = value;
    currentPage.value = 1; // ページサイズ変更時は1ページ目に戻す
    fetchApps();
  };
  
  // Sort handler
  const updateSortBy = (newSortBy: SortItem[]) => {
    sortBy.value = newSortBy;
    fetchApps();
  };
  
  // Status display helpers
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PUBLISHED': return 'green';
      case 'DRAFT': return 'orange';
      case 'ARCHIVED': return 'grey';
      case 'PRIVATE': return 'blue';
      case 'SUSPENDED': return 'red';
      default: return 'grey';
    }
  };
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PUBLISHED': return '公開';
      case 'DRAFT': return '下書き';
      case 'ARCHIVED': return 'アーカイブ';
      case 'PRIVATE': return '非公開';
      case 'SUSPENDED': return '停止中';
      default: return status;
    }
  };
  
  // Function to navigate to the edit page
  const goToEditPage = (app: App) => {
    router.push(`/admin/apps/${app.id}/edit`);
  };

  // エラー表示ヘルパー
  const showError = (message: string) => {
    console.error(message);
    // TODO: エラー表示のUIを追加（例：スナックバー）
  };

  // ページ読み込み時にデータをフェッチ
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
  