<template>
  <v-container fluid pt-0 mt-0 pa-0>
    <!-- Notification Section -->
    <v-row pt-0 mt-0 px-4 pt-4>

      <!-- Loading Indicator for Notifications -->
      <v-col v-if="notificationsLoading" cols="12">
        <v-progress-linear indeterminate color="primary" height="4"></v-progress-linear>
      </v-col>

      <!-- Error Alert for Notifications -->
      <v-col v-else-if="notificationsError" cols="12">
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          border="start"
          :text="notificationsError"
        ></v-alert>
      </v-col>

      <!-- Display Top Notifications -->
      <v-col
        v-else-if="topNotifications.length > 0"
        v-for="notification in topNotifications"
        :key="notification.id"
        cols="12"
      >
        <v-alert
          :type="notification.level.toLowerCase() as any" 
          :title="notification.title"
          variant="tonal"
          prominent
          border="start"
          density="compact"
        >
          <span style="white-space: pre-wrap;">{{ notification.content }}</span>
           <!-- Optional: Add a link to the full notifications page -->
           <!--
           <template v-slot:append>
             <v-btn size="small" variant="text" to="/notifications">詳細</v-btn>
           </template>
           -->
        </v-alert>
      </v-col>
    </v-row>

    <!-- Filter and Search Section -->
    <v-row pt-0 mt-0 pa-4>
      <v-col cols="12" pb-0>
        <AppSearch v-model="searchQuery" label="アプリを検索..." />
      </v-col>
      <!-- Category Chips -->
      <v-col cols="12" py-0>
         <v-chip-group
            v-model="selectedCategory"
            column
            mandatory
            active-class="text-primary"
            class="ma-0"
         >
            <!-- 手動で追加 -->
            <v-chip key="latest" value="最新" filter>最新</v-chip>
            <v-chip key="trending" value="トレンド" filter>トレンド</v-chip>
             <!-- <v-chip key="all" :value="null" filter>すべて</v-chip> --> <!-- 「すべて」は一旦削除 -->
            <!-- APIから取得したカテゴリ -->
             <v-chip
                v-for="category in popularCategories"
                :key="category.id"
                :value="category.name"
                filter
             >
                {{ category.name }} ({{ category.appCount }})
             </v-chip>
         </v-chip-group>
         <!-- カテゴリ読み込みエラー表示 -->
          <v-alert v-if="categoriesError" type="warning" density="compact" variant="text" class="mt-1 pa-0">
              人気カテゴリの読み込みに失敗しました。
          </v-alert>
      </v-col>

       <!-- Removed Popular Tags Section -->
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
    <v-row v-else-if="appsData && appsData.data.length > 0" pt-0 mt-0>
      <v-col
        v-for="app in appsData.data"
        :key="app.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <AppCard
          :app="{
            id: app.id,
            name: app.name,
            description: app.description || '',
            imageUrl: app.thumbnailUrl || 'https://placehold.jp/300x300.png?text=No+Image',
            likes: app.likesCount,
            dislikes: app.dislikesCount,
            usageCount: app.usageCount,
            requiresSubscription: app.isSubscriptionLimited,
            creatorId: app.creatorId || null,
            creatorName: app.creatorName,
            creatorAvatarUrl: app.creatorAvatarUrl ?? null,
            category: app.category
          }"
          @title-click="goToAppDetail(app.id)"
          @creator-click="goToUserProfile"
        />
      </v-col>
    </v-row>

    <!-- No Apps Found -->
     <v-row v-else justify="center" class="my-8">
      <v-col cols="auto">
        <p>該当するアプリが見つかりませんでした。</p>
      </v-col>
    </v-row>


    <!-- Pagination -->
    <v-row v-if="appsData && appsData.total > itemsPerPage" justify="center">
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
import { useNuxtApp } from '#app';
import AppCard from '~/components/AppCard.vue';
import AppSearch from '~/components/AppSearch.vue';

// --- API DTO Types (Align with backend DTO) ---
interface AppDto {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  usageCount: number;
  createdAt: string; 
  categoryId: number | null;
  category?: { id: number; name: string } | null; // ★ Add category object
  isSubscriptionLimited: boolean; 
  creatorId?: number | null;
  creatorName?: string; 
  creatorAvatarUrl?: string | null; 
  likesCount: number; // ★ Add likesCount
  dislikesCount: number; // ★ Add dislikesCount
}

interface AppListResponse {
  data: AppDto[];
  total: number;
}

interface CategoryDto {
  id: number;
  name: string;
  appCount?: number;
}

// Notification Item Type (from notifications.vue or shared types)
// TODO: Consider moving this to a shared types file
interface NotificationItem {
  id: number;
  title: string;
  content: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'info' | 'success' | 'warning' | 'error';
  startAt: string;
  endAt: string | null;
  isVisibleOnTop?: boolean;
}
// --------------------

const router = useRouter();
const { $api } = useNuxtApp();

// --- State Refs ---
const searchQuery = ref('');
const selectedCategory = ref<string | null>('トレンド'); // デフォルトを「トレンド」に変更
const currentPage = ref(1);
const itemsPerPage = 20;

// App List State
const appsData = ref<AppListResponse>({ data: [], total: 0 });
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

// Removed Popular Tags State
// -----------------

// --- API パラメータ算出 (タグフィルター削除) ---
const apiParams = computed(() => {
  const params: Record<string, any> = {
    page: currentPage.value,
    limit: itemsPerPage,
  };

  // --- Search Query ---
  if (searchQuery.value) {
    params.name = searchQuery.value;
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
          params.categoryId = category.id;
      } else {
          console.warn(`Selected category '${selectedCategory.value}' not found. Filtering disabled.`);
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
    const response = await $api.get<AppListResponse>('/apps', { // /api プレフィックス確認
      params: apiParams.value
    });
    appsData.value = response.data;
  } catch (err) {
    console.error('Failed to fetch apps:', err);
    error.value = err instanceof Error ? err : new Error('Failed to fetch apps');
    appsData.value = { data: [], total: 0 };
  } finally {
    pending.value = false;
  }
}

async function fetchPopularCategories() {
  categoriesLoading.value = true;
  categoriesError.value = null;
  try {
    const response = await $api.get<CategoryDto[]>('/categories'); // /api プレフィックス確認
    popularCategories.value = response.data;
  } catch (err) {
    console.error('Failed to fetch popular categories:', err);
    categoriesError.value = err instanceof Error ? err : new Error('Failed to fetch popular categories');
  } finally {
    categoriesLoading.value = false;
  }
}

// --- Fetch Top Notifications --- (New Function)
async function fetchTopNotifications() {
  notificationsLoading.value = true;
  notificationsError.value = null;
  try {
    // Fetch up to 2 notifications marked for top display, sorted by start date desc
    const response = await $api.get<{ data: NotificationItem[] }>('/notifications', {
      params: {
        isVisibleOnTop: true,
        limit: 2,
        sortBy: 'startAt', // Assuming API supports sorting
        sortOrder: 'desc'
      }
    });
    topNotifications.value = response.data.data || []; // Adjust based on actual API response structure
  } catch (err) {
    console.error('Failed to fetch top notifications:', err);
    notificationsError.value = 'お知らせの読み込みに失敗しました。';
    topNotifications.value = []; // Clear any potentially stale data
  } finally {
    notificationsLoading.value = false;
  }
}

// --- ページネーション計算 (変更なし) ---
const totalPages = computed(() => {
  return Math.ceil(appsData.value.total / itemsPerPage);
});
// --------------------------

// --- Watchers ---
watch(apiParams, fetchApps, { deep: true, immediate: false }); 
watch(popularCategories, (newCategories) => {
  // If the currently selected category (which is not '最新' or 'トレンド') 
  // is no longer in the popular list, reset selection to 'トレンド'.
  if (selectedCategory.value && selectedCategory.value !== 'トレンド' && selectedCategory.value !== '最新') {
    if (!newCategories.some(c => c.name === selectedCategory.value)) {
      console.warn(`Previously selected category '${selectedCategory.value}' no longer exists. Resetting to 'トレンド'.`);
      selectedCategory.value = 'トレンド'; // Reset to 'トレンド'
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
        // Removed fetchPopularTags(),
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
     console.warn('Creator ID not available for navigation.');
  }
};
// -----------------

// --- 削除: ダミーデータ生成ロジック (省略) ---

</script>

<style scoped>
/* Add any specific styles for the index page here */
</style>
