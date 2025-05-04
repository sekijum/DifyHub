<template>
  <v-container>
    <PageTitle title="お知らせ" />

    <v-row>
      <v-col cols="12">
        <!-- Loading Indicator for Initial Load -->
        <div v-if="initialLoading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <!-- API Error Message -->
        <v-alert v-else-if="apiError" type="error" variant="outlined" class="mb-4">
          {{ apiError }}
        </v-alert>

        <!-- Notification List -->
        <template v-else-if="displayedNotifications.length > 0">
          <v-card
            v-for="item in displayedNotifications"
            :key="item.id"
            :class="['mb-4', 'notification-card', `border-${item.level.toLowerCase()}`]"
            variant="outlined"
          >
            <v-card-title class="pb-1 d-flex flex-column align-start flex-sm-row justify-sm-space-between align-sm-center">
              <span class="text-body-1 font-weight-medium">{{ item.title }}</span>
              <v-chip label size="small" variant="tonal" class="mt-1 mt-sm-0 ms-sm-2 flex-shrink-0">
                {{ formatDate(item.startAt) }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pt-1 text-body-2 text-medium-emphasis">
              <div style="white-space: pre-wrap;">{{ item.content }}</div>
            </v-card-text>
          </v-card>

          <!-- Loading Indicator for More Items -->
          <div v-if="isLoadingMore" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <!-- All Loaded Message -->
          <div v-if="allItemsLoaded && !isLoadingMore" class="text-center text-medium-emphasis pa-4">
            すべてのお知らせを読み込みました。
          </div>
        </template>

        <!-- No Notifications Message -->
        <v-card v-else-if="noNotifications" variant="outlined">
          <v-card-text class="text-center text-medium-emphasis">
            現在表示できるお知らせはありません。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useNuxtApp } from '#app'; // useNuxtApp をインポート
import PageTitle from '~/components/PageTitle.vue';

// Define the layout for this page
definePageMeta({
  layout: 'default', // Adjust layout name if needed (e.g., 'app')
});

// Interface for a notification item
interface NotificationItem {
  id: number;
  title: string;
  content: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'info' | 'success' | 'warning' | 'error'; // 大文字・小文字許容
  startAt: string; // ISO 8601 format or YYYY-MM-DD HH:MM
  endAt: string | null;   // null許容に変更
  isVisibleOnTop?: boolean; // 追加フィールド（任意）
  createdAt?: string;      // 追加フィールド（任意）
  updatedAt?: string;      // 追加フィールド（任意）
}

// APIレスポンスの型 (実際のAPI仕様に合わせる)
interface NotificationApiResponse {
  data: NotificationItem[]; // プロパティ名を data に変更
  total: number;          // プロパティ名を total に変更
}

// --- NuxtAppの取得 ---
const { $api } = useNuxtApp(); // $api を取得

// --- Infinite Scroll State ---
const displayedNotifications = ref<NotificationItem[]>([]);
const currentPage = ref(1);
const pageSize = 10; // Number of items to load per page
const isLoadingMore = ref(false);
const totalNotificationsCount = ref(0); // APIから取得する総アイテム数
const initialLoading = ref(true); // 初回読み込み中フラグ
const apiError = ref<string | null>(null); // APIエラーメッセージ

// --- Computed property for Infinite Scroll ---
const allItemsLoaded = computed(() => {
  // 表示されているアイテム数が、APIから取得した総数以上になったら true
  // かつ、初回読み込みが完了していること
  return !initialLoading.value && displayedNotifications.value.length >= totalNotificationsCount.value;
});

// お知らせが一件もない状態か判定するComputed Property
const noNotifications = computed(() => {
    // 初回読み込み完了後、ローディング中でなく、表示件数が0で、APIエラーもない場合
    return !initialLoading.value && !isLoadingMore.value && displayedNotifications.value.length === 0 && !apiError.value;
});


// --- Load More Logic ---
const loadMoreNotifications = async () => {
  // ローディング中、全件読み込み済みは処理しない
  if (isLoadingMore.value || allItemsLoaded.value) return;

  isLoadingMore.value = true;
  apiError.value = null; // 新しい読み込みを開始する際にエラーをリセット
  console.log(`[Infinite Scroll] Loading page ${currentPage.value}`);

  try {
    // $api を使用して通知を取得 (エンドポイントは仮 '/notifications')
    // TODO: 実際のAPIエンドポイントとレスポンス形式に合わせて調整してください
    const response = await $api.get<NotificationApiResponse>('/notifications', {
      params: {
        page: currentPage.value,
        pageSize: pageSize,
        // 必要に応じてソート順などのパラメータを追加 (例: startAtの降順)
        // sortBy: 'startAt',
        // sortOrder: 'desc',
      }
    });

    // 実際のAPIレスポンス構造に合わせてアクセス方法を調整
    const items = response.data.data || [];
    const totalCount = response.data.total || 0;

    if (items.length > 0) {
      // 新しいアイテムを既存のリストに追加
      // API側でソートされている想定。クライアント側ソートが必要ならここで実施
      displayedNotifications.value = [...displayedNotifications.value, ...items];
      currentPage.value++; // 次のページ番号へ進める
    }
    totalNotificationsCount.value = totalCount; // 総件数を更新

  } catch (error) {
    console.error('Error loading notifications:', error);
    apiError.value = 'お知らせの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。';
    // ここでユーザーにエラーを通知する処理を追加できます（例: Snackbar表示）
  } finally {
    isLoadingMore.value = false;
    // 最初の読み込みが完了したことを示すフラグを設定
    if (initialLoading.value) {
        initialLoading.value = false;
    }
    console.log(`[Infinite Scroll] Loaded page ${currentPage.value - 1}. Total items: ${displayedNotifications.value.length} / ${totalNotificationsCount.value}`);
  }
};

// --- Scroll Event Handler ---
const handleScroll = () => {
  // 初回ロード中はスクロールイベントでの追加読み込みを抑制
  if (initialLoading.value) return;

  // Check if scrolled to near bottom
  const threshold = 200; // Pixels from bottom
  const bottomOfWindow = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;

  // ウィンドウの底近くまでスクロールされ、ローディング中でなく、全件読み込み済みでない場合
  if (bottomOfWindow && !isLoadingMore.value && !allItemsLoaded.value) {
    loadMoreNotifications();
  }
};

// Helper function to format date (display only date part)
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        // getTime() が NaN を返すかチェックして無効な日付を判定
        if (isNaN(date.getTime())) return '日付不明';
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        // Date オブジェクトの生成自体でエラーが発生した場合も考慮
        return '日付不明';
    }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // Remove sample data sorting
  // sampleNotifications.value.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  // Load initial data from API
  loadMoreNotifications();
  // Attach scroll listener
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  // Remove scroll listener
  window.removeEventListener('scroll', handleScroll);
});

</script>

<style scoped>
/* Add styles if needed */
.notification-card {
  border-left-width: 4px;
  border-left-style: solid;
}

/* Define border colors based on notification level using CSS variables for theme colors */
.border-info {
  border-left-color: rgb(var(--v-theme-info));
}
.border-success {
  border-left-color: rgb(var(--v-theme-success));
}
.border-warning {
  border-left-color: rgb(var(--v-theme-warning));
}
.border-error {
  border-left-color: rgb(var(--v-theme-error));
}
</style> 
