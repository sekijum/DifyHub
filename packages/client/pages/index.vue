<template>
  <v-container fluid pt-0 mt-0 pa-0>
    <!-- Notification Section -->
    <NotificationList
      :notifications="topNotifications"
      :loading="notificationsLoading"
      :error="notificationsError"
    />

    <!-- Filter and Search Section -->
    <v-row pt-0 mt-0 pa-4>
      <v-col cols="12" pb-0>
        <AppSearch v-model="searchQuery" label="アプリを検索..." />
      </v-col>
      <!-- Category Chips -->
      <v-col cols="12" py-0>
        <CategoryChips
          v-model="selectedCategory"
          :categories="popularCategories"
          :loading="categoriesLoading"
          :error="categoriesError"
        />
      </v-col>
    </v-row>

    <!-- Loading Indicator -->
    <v-row v-if="pending" justify="center" class="my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <!-- Error Message -->
    <v-row v-else-if="error" justify="center" class="my-8">
       <v-col cols="12" md="8">
        <v-alert type="error" variant="tonal">
          アプリの読み込み中にエラーが発生しました: {{ error.message }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- App List -->
    <AppCardList
      :apps="appsData.data"
      :loading="pending"
      :error="error"
      @app-click="goToAppDetail"
      @creator-click="goToUserProfile"
    />

    <!-- Pagination -->
    <v-row v-if="appsData.meta && appsData.meta.total > itemsPerPage" justify="center">
      <v-col cols="auto">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
        ></v-pagination>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppSearch from '~/components/AppSearch.vue';
import CategoryChips from '~/components/CategoryChips.vue';
import NotificationList from '~/components/NotificationList.vue';
import AppCardList from '~/components/AppCardList.vue';
import { usePublicApi } from '~/composables/usePublicApi';
import type { AppListResponse, CategoryDto } from '~/types/app';
import type { NotificationItem } from '~/types/notification';

const router = useRouter();
const publicApi = usePublicApi();

// --- State Refs ---
const searchQuery = ref('');
const selectedCategory = ref<string | null>('トレンド'); // デフォルトを「トレンド」に変更
const currentPage = ref(1);
const itemsPerPage = 20;

// App List State
const appsData = ref<AppListResponse>({ data: [], meta: { total: 0, page: 1, limit: 20 } });
const pending = ref(false);
const error = ref<Error | null>(null);

// Popular Categories State
const popularCategories = ref<CategoryDto[]>([]);
const categoriesLoading = ref(false);
const categoriesError = ref<Error | null>(null);

// --- Top Notification State ---
const topNotifications = ref<NotificationItem[]>([]);
const notificationsLoading = ref(false);
const notificationsError = ref<string | null>(null);

// --- API パラメータ算出 (タグフィルター削除) ---
const apiParams = computed(() => {
  const params: Record<string, any> = {
    page: currentPage.value,
    limit: itemsPerPage,
  };

  // --- Search Query ---
  if (searchQuery.value) {
    params.search = searchQuery.value;
  }

  // --- Sorting --- 
  if (selectedCategory.value === '最新') {
    params.sortBy = 'createdAt';
    params.sortOrder = 'desc';
  } else if (selectedCategory.value === 'トレンド' || selectedCategory.value) {
    // カテゴリ選択時は人気順 (usageCount)
    params.sortBy = 'usageCount';
    params.sortOrder = 'desc';
  }
  // カテゴリ未選択 (null) の場合は sortBy/sortOrder を指定しない

  // --- Category Filter ---
  if (selectedCategory.value && selectedCategory.value !== 'トレンド' && selectedCategory.value !== '最新') {
      const category = popularCategories.value.find(c => c.name === selectedCategory.value);
      if (category) {
          params.categoryId = Number(category.id);
      } else {
          console.warn(`選択されたカテゴリー「${selectedCategory.value}」が見つかりません。フィルターは無効です。`);
      }
  }

  // Removed Tag Filter logic

  return params;
});
// --------------------------------------

// Removed Tag Selection Logic
// ------------------------

// --- API データ取得関数 ---
async function fetchApps() {
  pending.value = true;
  error.value = null;
  try {
    const response = await publicApi.findAllApps(apiParams.value);
    appsData.value = response.data;
  } catch (err) {
    console.error('アプリの取得に失敗しました:', err);
    error.value = err instanceof Error ? err : new Error('アプリの取得に失敗しました');
    appsData.value = { data: [], meta: { total: 0, page: 1, limit: 20 } };
  } finally {
    pending.value = false;
  }
}

async function fetchPopularCategories() {
  categoriesLoading.value = true;
  categoriesError.value = null;
  try {
    const response = await publicApi.findAllCategories({
      sortBy: 'appCount',
      sortOrder: 'desc',
      limit: 8 // 人気カテゴリートップ8のみ
    });
    popularCategories.value = response.data;
  } catch (err) {
    console.error('カテゴリーの取得に失敗しました:', err);
    categoriesError.value = err instanceof Error ? err : new Error('カテゴリーの取得に失敗しました');
  } finally {
    categoriesLoading.value = false;
  }
}

async function fetchTopNotifications() {
  notificationsLoading.value = true;
  notificationsError.value = null;
  try {
    const response = await publicApi.findTopNotifications();
    topNotifications.value = response?.data || [];
  } catch (err) {
    console.warn('通知の取得に失敗しました - サーバー側に問題がある可能性があります');
    // エラーメッセージを表示しない - 通知がなくても続行
    notificationsError.value = null;
    topNotifications.value = [];
  } finally {
    notificationsLoading.value = false;
  }
}

// --- ページネーション計算 (変更なし) ---
const totalPages = computed(() => {
  return Math.ceil((appsData.value.meta?.total || 0) / itemsPerPage);
});
// --------------------------

// --- Watchers ---
watch(apiParams, fetchApps, { deep: true }); 
watch(popularCategories, (newCategories) => {
  // If the currently selected category (which is not '最新' or 'トレンド') 
  // is no longer in the popular list, reset selection to 'トレンド'.
  if (selectedCategory.value && selectedCategory.value !== 'トレンド' && selectedCategory.value !== '最新') {
    if (!newCategories.some(c => c.name === selectedCategory.value)) {
      console.warn(`選択されていたカテゴリー「${selectedCategory.value}」が存在しなくなりました。「トレンド」にリセットします。`);
      selectedCategory.value = 'トレンド';
    }
  }
});
// --------------

// --- Initial Data Load ---
onMounted(async () => {
    // Fetch categories, apps, and top notifications in parallel
    await Promise.all([
        fetchPopularCategories(),
        fetchTopNotifications(), // Add fetching notifications
        fetchApps()
    ]);
});
// -------------------------

// --- Navigation (変更なし) ---
const goToAppDetail = (appId: number) => {
  router.push(`/apps/${appId}`);
};

const goToUserProfile = (creatorId?: number | null) => {
  if (creatorId) {
    router.push(`/users/${creatorId}`);
  } else {
    console.warn('開発者IDがありません。');
  }
};

</script>

<style scoped>
/* Add any specific styles for the index page here */
</style>
