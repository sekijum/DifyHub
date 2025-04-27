<template>
  <v-container>
    <PageTitle title="管理者ダッシュボード" />

    <!-- Summary Stats -->
    <v-row>
      <v-col v-for="stat in summaryStats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card variant="outlined">
          <v-card-text class="d-flex align-center">
            <v-icon :icon="stat.icon" size="large" class="mr-4" :color="stat.color"></v-icon>
            <div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption text-grey">{{ stat.title }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Quick Links -->
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>クイックリンク</v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="link in quickLinks"
              :key="link.title"
              :to="link.to"
              :prepend-icon="link.icon"
            >
              <v-list-item-title>{{ link.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Recent Activity -->
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>最近のアクティビティ</v-card-title>
          <v-list lines="two" density="compact">
            <template v-for="(activity, index) in recentActivities" :key="activity.id">
              <v-list-item :prepend-icon="activity.icon">
                <v-list-item-title>{{ activity.description }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.timestamp }}</v-list-item-subtitle>
              </v-list-item>
              <v-divider v-if="index < recentActivities.length - 1"></v-divider>
            </template>
          </v-list>
          <v-card-actions v-if="recentActivities.length === 0">
            <v-card-text class="text-center text-grey">アクティビティはありません。</v-card-text>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add more dashboard widgets here (e.g., charts) -->
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
  // middleware: ['admin-auth'] // 必要であれば管理者認証ミドルウェアを追加
});

// Define Activity Item interface
interface ActivityItem {
  id: number;
  icon: string;
  description: string;
  timestamp: string; // Using string for now, ideally Date object
}

// Dummy data for summary stats
// TODO: Fetch real data from API
const summaryStats = ref([
  { title: '総ユーザー数', value: '1,234', icon: 'mdi-account-group', color: 'primary' },
  { title: '総アプリ数', value: '56', icon: 'mdi-widgets', color: 'secondary' },
  { title: 'アクティブプラン', value: '12', icon: 'mdi-credit-card-outline', color: 'success' },
  { title: '送信済み通知', value: '8', icon: 'mdi-bell-outline', color: 'info' },
]);

// Quick links data
const quickLinks = ref([
  { title: 'ユーザー管理', to: '/admin/users', icon: 'mdi-account-cog' },
  { title: 'アプリ管理', to: '/admin/apps', icon: 'mdi-cogs' },
  { title: 'プラン管理', to: '/admin/plans', icon: 'mdi-tag-outline' },
  { title: '通知管理', to: '/admin/notifications', icon: 'mdi-bullhorn-outline' },
  { title: 'アプリ設定', to: '/admin/settings', icon: 'mdi-cog-outline' },
]);

// Dummy data for recent activities
// TODO: Fetch real data from API and implement relative time
const recentActivities = ref<ActivityItem[]>([
  { id: 1, icon: 'mdi-account-plus', description: '新規ユーザー テストユーザー が登録しました。', timestamp: '5分前' },
  { id: 2, icon: 'mdi-widgets-outline', description: 'アプリ 新しい分析ツール が作成されました。', timestamp: '1時間前' },
  { id: 3, icon: 'mdi-credit-card-sync', description: 'ユーザー demo@example.com がプロプランにアップグレードしました。', timestamp: '3時間前' },
  { id: 4, icon: 'mdi-bullhorn', description: '通知 メンテナンスのお知らせ が送信されました。', timestamp: '昨日' },
  { id: 5, icon: 'mdi-cog', description: 'アプリ設定 サイトタイトル が更新されました。', timestamp: '2日前' },
]);
</script>

<style scoped>
/* Add custom styles if needed */
</style> 
