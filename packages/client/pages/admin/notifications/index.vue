<template>
    <v-container>      
      <div class="d-flex justify-space-between align-center mb-4">
        <PageTitle title="お知らせ管理" />
        <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" @click="goToCreatePage">
          新規登録
        </v-btn>
      </div>
      <v-row>
        <v-col>
          <v-card variant="outlined">
  
            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="notifications"
              items-per-page="10" 
              class="elevation-0"
              density="compact"
              :hover="true"
              items-per-page-text="表示行数"
               :items-per-page-options="itemsPerPageOptions"
               :sort-by="sortBy" 
              @update:sort-by="updateSortBy($event)" 
              :multi-sort="false" 
            >
               <template v-slot:item.content="{ item }">
                <div class="text-truncate" style="max-width: 300px;">{{ item.content }}</div>
               </template>
                <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" density="compact" label>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>
               <template v-slot:item.target="{ item }">
                  {{ getTargetText(item.target) }}
              </template>
               <template v-slot:item.publishedAt="{ item }">
                  {{ item.publishedAt || '-' }} 
              </template>
              <template v-slot:item.actions="{ item }">
                <v-icon small class="mr-2" @click="goToEditPage(item)">mdi-pencil</v-icon>
                <v-icon small @click="openDeleteDialog(item)">mdi-delete</v-icon>
              </template>
               <template v-slot:no-data>
                  登録されているお知らせがありません。
               </template>
            </v-data-table>
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
  
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import type { VDataTable } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  import ConfirmationDialog from '~/components/ConfirmationDialog.vue';
  
  definePageMeta({
    layout: 'admin',
  });
  
  const router = useRouter();
  
  // Type definitions
  type SortItem = { key: string; order: 'asc' | 'desc' };
  type ReadonlyHeaders = VDataTable['$props']['headers'];
  type NotificationStatus = 'draft' | 'published' | 'sent';
  type NotificationTarget = 'all' | 'pro_users' | 'free_users';
  
  interface Notification {
    id: number;
    title: string;
    content: string;
    target: NotificationTarget;
    status: NotificationStatus;
    publishedAt: string | null; // Null if draft or not yet sent
  }
  
  // Table Headers
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80 },
    { title: 'タイトル', key: 'title', align: 'start', sortable: false },
    { title: '内容', key: 'content', align: 'start', sortable: false, width: 300 },
    { title: '対象', key: 'target', align: 'center', sortable: false, width: 120 },
    { title: 'ステータス', key: 'status', align: 'center', sortable: false, width: 120 },
    { title: '公開/送信日時', key: 'publishedAt', align: 'start', width: 180 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];
  
  // Select Options
  const statusOptions = ref([
      { title: '下書き', value: 'draft' },
      { title: '公開 (送信待ち)', value: 'published' },
      { title: '送信済み', value: 'sent' },
  ]);
  const targetOptions = ref([
      { title: '全員', value: 'all' },
      { title: 'プロユーザー', value: 'pro_users' },
      { title: 'フリーユーザー', value: 'free_users' },
  ]);
  
  // Sample Data
  const generateSampleNotifications = (count: number): Notification[] => {
    const list: Notification[] = [];
    const titles = ['新機能リリースのお知らせ', 'メンテナンスのお知らせ', '利用規約改定', 'キャンペーン情報', '障害情報'];
    const contents = ['〇〇機能が追加されました。', 'サーバーメンテナンスを実施します。', 'プライバシーポリシーを更新しました。', '期間限定セール開催中！', '現在一部サービスが利用しづらい状況です。'];
    const statuses: NotificationStatus[] = ['draft', 'published', 'sent', 'sent', 'sent'];
    const targets: NotificationTarget[] = ['all', 'pro_users', 'free_users', 'all', 'all'];
  
    for (let i = 1; i <= count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const randomDay = Math.floor(Math.random() * 30) + 1;
      const randomMonth = Math.floor(Math.random() * 12) + 1;
      const publishedDate = `2023-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')} 10:00`;
  
      list.push({
        id: i,
        title: `${titles[Math.floor(Math.random() * titles.length)]} #${i}`,
        content: `${contents[Math.floor(Math.random() * contents.length)]} 詳細はこちらをご覧ください。URL...`,
        target: targets[Math.floor(Math.random() * targets.length)],
        status: status,
        publishedAt: (status === 'sent' || status === 'published') ? publishedDate : null,
      });
    }
    return list.sort((a, b) => b.id - a.id); // Sort by ID desc initially
  };
  
  const notifications = ref<Notification[]>(generateSampleNotifications(15));
  
  // Table State
  const sortBy = ref<SortItem[]>([{ key: 'id', order: 'desc' }]); // Default sort
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];
  const itemsPerPage = ref(itemsPerPageOptions[0].value);
  
  // Dialog States
  const isDeleteDialogOpen = ref(false);
  const notificationToDelete = ref<Notification | null>(null);
  
  // Display Helpers
  const getStatusColor = (status: NotificationStatus): string => {
    switch (status) {
      case 'published': return 'blue';
      case 'draft': return 'orange';
      case 'sent': return 'green';
      default: return 'grey';
    }
  };
  const getStatusText = (status: NotificationStatus): string => {
      return statusOptions.value.find(o => o.value === status)?.title || status;
  };
  const getTargetText = (target: NotificationTarget): string => {
      return targetOptions.value.find(o => o.value === target)?.title || target;
  };
  
  // Table Event Handlers
  const updateSortBy = (newSortBy: SortItem[]) => {
    sortBy.value = newSortBy;
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
  
  const confirmDeleteNotification = () => {
    if (notificationToDelete.value) {
      console.log('Deleting notification:', notificationToDelete.value);
      notifications.value = notifications.value.filter(n => n.id !== notificationToDelete.value!.id);
      notificationToDelete.value = null;
    }
    isDeleteDialogOpen.value = false;
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
  