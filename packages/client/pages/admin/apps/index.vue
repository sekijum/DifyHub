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
                ></v-text-field>
              </v-col>
            </v-row>
  
            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredApps" 
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
  
  type SortItem = { key: string; order: 'asc' | 'desc' };
  
  // Initialize state from route query parameters
  const search = ref(route.query.q as string || '');
  const selectedStatus = ref<string | null>(route.query.status as string || null); // App status filter
  const itemsPerPage = ref(Number(route.query.limit) || 10);
  const initialSortBy: SortItem[] = route.query.sort_by
      ? [{ key: route.query.sort_by as string, order: (route.query.sort_order || 'asc') as 'asc' | 'desc' }]
      : [{ key: 'id', order: 'asc' }]; // Default sort by ID
  const sortBy = ref<SortItem[]>(initialSortBy);
  
  const loading = ref(false);
  
  type ReadonlyHeaders = VDataTable['$props']['headers'];
  
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80 },
    { title: '名前', key: 'name', align: 'start', sortable: false },
    { title: '作成者', key: 'authorName', align: 'start', sortable: false },
    { title: 'ステータス', key: 'status', align: 'center', width: 120, sortable: false },
    { title: '作成日', key: 'createdAt', align: 'start', width: 150 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];
  
  // Options for app status select
  const statusOptions = ref([
      { title: '公開', value: 'published' },
      { title: '下書き', value: 'draft' },
      { title: 'アーカイブ', value: 'archived' },
  ]);
  
  // Interface for app data
  interface App {
    id: number;
    name: string;
    authorName: string;
    description: string;
    thumbnailUrl?: string;
    subImageUrls?: string[];
    status: 'published' | 'draft' | 'archived';
    isSubscriptionOnly: boolean;
    appUrl?: string;
    createdAt: string;
  }
  
  // Generate sample app data
  const generateSampleApps = (count: number): App[] => {
    const appsList: App[] = [];
    const appNames = ['顧客管理システム', '在庫追跡ツール', 'プロジェクトボード', '請求書ジェネレータ', '社内Wiki', 'イベントカレンダー', '簡易ブログエンジン', 'タスクランナー', 'URL短縮サービス', '画像リサイザー'];
    const authors = ['管理ユーザーA', '管理ユーザーB', 'システム', '田中 太郎', '佐藤 花子'];
    const statuses: ('published' | 'draft' | 'archived')[] = ['published', 'published', 'draft', 'archived'];
  
    for (let i = 1; i <= count; i++) {
      const name = `${appNames[Math.floor(Math.random() * appNames.length)]} #${i}`;
      const authorName = authors[Math.floor(Math.random() * authors.length)];
      const description = `これは ${name} のサンプル説明文です。様々な機能を提供します。`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isSubscriptionOnly = Math.random() < 0.3;
      const randomDay = Math.floor(Math.random() * 30) + 1;
      const randomMonth = Math.floor(Math.random() * 12) + 1;
      const createdAt = `2023-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;
      const thumbnailUrl = Math.random() > 0.2 ? `https://placehold.jp/80x80.png?text=Thumb+${i}` : undefined;
      const appUrl = Math.random() < 0.7 ? `https://example.com/app/${i}` : undefined;
      
      const subImageUrls: string[] = [];
      const numSubImages = Math.floor(Math.random() * 4);
      for (let j = 0; j < numSubImages; j++) {
          if (Math.random() > 0.3) {
             subImageUrls.push(`https://placehold.jp/80x80.png?text=Sub+${i}-${j+1}`);
          }
      }
  
      appsList.push({
        id: i,
        name,
        authorName,
        description,
        thumbnailUrl,
        subImageUrls,
        status,
        isSubscriptionOnly,
        appUrl,
        createdAt,
      });
    }
    return appsList;
  };
  
  const apps = ref<App[]>(generateSampleApps(35)); // Generate 35 sample apps
  
  // Computed property to filter apps
  const filteredApps = computed(() => {
    return apps.value.filter(app => {
      const statusMatch = !selectedStatus.value || app.status === selectedStatus.value;
      const searchMatch = !search.value ||
                          app.name.toLowerCase().includes(search.value.toLowerCase()) ||
                          app.description.toLowerCase().includes(search.value.toLowerCase());
      return statusMatch && searchMatch;
    });
  });
  
  // Function to update URL query parameters
  const updateQueryParameters = () => {
    const query: Record<string, any> = {};
    if (selectedStatus.value) query.status = selectedStatus.value;
    if (itemsPerPage.value !== 10) query.limit = itemsPerPage.value;
    if (search.value) query.q = search.value;
  
    const currentSort = sortBy.value[0];
    if (currentSort && (currentSort.key !== 'id' || currentSort.order !== 'asc')) {
       query.sort_by = currentSort.key;
       query.sort_order = currentSort.order;
    }
  
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
        router.replace({ query });
    }
  };
  
  // Watch filters and sorting
  watch([selectedStatus, search, sortBy], updateQueryParameters, { deep: true });
  
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
  
  // Status display helpers
  const getStatusColor = (status: App['status']): string => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'grey';
      default: return 'grey';
    }
  };
  
  const getStatusText = (status: App['status']): string => {
      const option = statusOptions.value.find(o => o.value === status);
      return option ? option.title : status;
  };
  
  // Function to navigate to the edit page
  const goToEditPage = (app: App) => {
    router.push(`/admin/apps/${app.id}/edit`);
  };

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
  