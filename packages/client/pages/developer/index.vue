<template>
  <v-container>
    <PageTitle title="開発者ダッシュボード" />

    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card variant="outlined">
          <v-card-item>
            <div>
              <div class="text-overline mb-1">総収益</div>
              <div class="text-h6 mb-1">{{ formatCurrency(totalEarnings) }}</div>
              <div class="text-caption">過去30日間の収益: {{ formatCurrency(recentEarnings) }}</div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined">
          <v-card-item>
            <div>
              <div class="text-overline mb-1">公開中のアプリ</div>
              <div class="text-h6 mb-1">{{ publishedAppsCount }}</div>
              <div class="text-caption">下書き: {{ draftAppsCount }}</div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined">
          <v-card-item>
            <div>
              <div class="text-overline mb-1">総利用回数</div>
              <div class="text-h6 mb-1">{{ totalUsageCount.toLocaleString() }}</div>
              <div class="text-caption">過去30日間: {{ recentUsageCount.toLocaleString() }}</div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
      <!-- Average Positive Rating Card -->
      <v-col cols="12" md="3">
        <v-card variant="outlined">
          <v-card-item>
            <div>
              <div class="text-overline mb-1">平均高評価率</div>
              <div class="text-h6 mb-1">{{ (averagePositiveRating * 100).toFixed(1) }}%</div>
              <div class="text-caption">全公開アプリの平均</div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>クイックアクション</v-card-title>
          <v-card-text>
            <v-btn color="primary" to="/developer/apps" class="mr-2" prepend-icon="mdi-apps">
              アプリ管理
            </v-btn>
            <v-btn color="secondary" to="/developer/earnings" class="mr-2" prepend-icon="mdi-currency-jpy">
              収益レポート
            </v-btn>
             <v-btn color="grey" to="/developer/settings" prepend-icon="mdi-cog-outline">
               設定
             </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

     <!-- Recent Activity (Placeholder) -->
     <v-row class="mt-4">
       <v-col cols="12">
         <v-card variant="outlined">
           <v-card-title>最近のアクティビティ</v-card-title>
           <v-list lines="one">
             <v-list-item
               v-for="activity in recentActivities"
               :key="activity.id"
               :title="activity.title"
               :subtitle="activity.time"
             >
               <template v-slot:prepend>
                 <v-icon :icon="activity.icon"></v-icon>
               </template>
             </v-list-item>
             <v-list-item v-if="!recentActivities.length">
               <v-list-item-title>最近のアクティビティはありません。</v-list-item-title>
             </v-list-item>
           </v-list>
           <v-card-actions>
            <v-btn variant="text" block>すべて表示</v-btn>
           </v-card-actions>
         </v-card>
       </v-col>
     </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'developer',
});

// --- Placeholder Data --- 
const totalEarnings = ref(125800);
const recentEarnings = ref(15200);
const publishedAppsCount = ref(5);
const draftAppsCount = ref(2);
const totalUsageCount = ref(345678);
const recentUsageCount = ref(45678);
const averagePositiveRating = ref(0.875); // Example: 87.5%

interface Activity {
  id: number;
  title: string;
  time: string;
  icon: string;
}

const recentActivities = ref<Activity[]>([
  { id: 1, title: 'アプリ「効率アップツール」が承認されました。', time: '2時間前', icon: 'mdi-check-circle-outline' },
  { id: 2, title: '収益の出金リクエストが処理されました。', time: '1日前', icon: 'mdi-cash-check' },
  { id: 3, title: 'アプリ「画像生成AI」に新しいレビューが投稿されました。', time: '3日前', icon: 'mdi-comment-text-outline' },
]);

// Helper function for currency formatting
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
};

</script>

<style scoped>
/* Add specific styles for the dashboard if needed */
.v-card-item {
  padding-bottom: 8px;
}
</style> 
  