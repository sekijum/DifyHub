<template>
  <v-container fluid class="pa-0">
    <PageTitle title="高く評価したアプリ" />

    <!-- Controls: Filter and Search Section (Layout strictly from index.vue) -->
      <!-- Row structure mimicking index.vue's outer row for search/chips -->
      <v-row pt-0 mt-0 pa-4>
        <!-- Search Bar Column (mimics index.vue col structure) -->
        <v-col cols="12" pb-0> <!-- Mimic index.vue's pb-0 -->
          <AppSearch
            v-model="searchQuery" 
            label="高く評価したアプリを検索..." 
            density="compact" 
            hide-details
            clearable
          />
        </v-col>
        <!-- Sort Chips Column (mimics index.vue col structure) -->
        <v-col cols="12" py-0> <!-- Mimic index.vue's py-0 -->
         <v-chip-group
            v-model="sortBy"
            mandatory
            active-class="text-primary"
            class="ma-0"
         >
            <!-- Use the specific chips from liked.vue -->
            <v-chip key="createdAt" value="createdAt" filter size="small">最新</v-chip>
            <v-chip key="usageCount" value="usageCount" filter size="small">トレンド</v-chip>
         </v-chip-group>
        </v-col>
      </v-row>

    <!-- Loading Skeletons -->
    <v-row v-if="isLoading" class="pa-2">
      <v-col
        v-for="n in itemsPerPage"
        :key="n"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="pa-2"
      >
        <v-skeleton-loader type="card-avatar, article, actions"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- Error Message -->
    <v-row v-if="!isLoading && errorMessage" class="pa-4">
        <v-col cols="12">
            <v-alert type="error" density="compact" prominent border="start" icon="mdi-alert-circle-outline">
              {{ errorMessage }}
            </v-alert>
        </v-col>
    </v-row>

    <!-- App List -->
    <v-row v-if="!isLoading && !errorMessage && apps.length > 0" class="pa-2">
      <v-col
        v-for="app in apps"
        :key="app.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="pa-2 d-flex"
      >
        <AppCard
          :app="mapApiAppToCardApp(app)"
          :is-bookmarked="false"
          @title-click="goToAppDetail(app.id)"
          @toggle-bookmark="handleToggleBookmark"
          @creator-click="goToUserProfile"
          class="flex-grow-1"
        />
      </v-col>
    </v-row>

    <!-- No Results Message -->
    <v-row v-else-if="!isLoading && !errorMessage && apps.length === 0" justify="center" class="py-10 px-4">
      <v-col cols="auto" class="text-center text-medium-emphasis">
        <v-icon size="x-large" class="mb-2">{{ searchQuery ? 'mdi-cloud-search-outline' : 'mdi-star-off-outline' }}</v-icon>
        <p>{{ searchQuery ? '検索条件に一致するアプリはありません。' : '高く評価したアプリはまだありません。' }}</p>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-row v-if="!isLoading && totalPages > 1" justify="center" class="my-4">
      <v-col cols="auto">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="compact"
        ></v-pagination>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import AppCard from '~/components/AppCard.vue';
import PageTitle from '~/components/PageTitle.vue';
import AppSearch from '~/components/AppSearch.vue';

// APIレスポンスの型 (サーバーのAppモデルに対応)
interface ApiApp {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  appUrl: string;
  creatorId: number;
  status: string; // AppStatus Enum
  categoryId: number | null;
  category?: { id: number; name: string } | null;
  isSubscriptionLimited: boolean;
  usageCount: number;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  // Creator情報を追加（直接プロパティとして）
  creatorName: string;
  creatorAvatarUrl: string | null;
  // 評価情報を追加
  likesCount: number;
  dislikesCount: number;
}

// AppCard が期待する App 型 (AppCard.vue の定義に合わせる)
interface CardApp {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likeCount: number; // APIのlikesCountからマッピング
  dislikeCount: number; // APIのdislikesCountからマッピング
  usageCount: number;
  requiresSubscription: boolean;
  category?: { id: number; name: string } | null;
  creatorId?: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
}

const router = useRouter();
const { $api } = useNuxtApp();

// --- State --- 
const apps = ref<ApiApp[]>([]); // APIから取得したアプリリスト
const totalApps = ref(0); // 総件数
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 12; // 3 or 4 columns grid (12 is divisible by 3 & 4)
const sortBy = ref<'createdAt' | 'usageCount'>('createdAt'); // 並び替え状態を追加 (デフォルトは最新)
let searchTimeout: NodeJS.Timeout | null = null; // For debounce

// --- Computed Properties ---
const totalPages = computed(() => {
  // Avoid division by zero
  if (itemsPerPage <= 0) return 0;
  return Math.ceil(totalApps.value / itemsPerPage);
});

// --- API Data Fetching --- 
const fetchLikedApps = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  // Clear previous results while loading new ones for better UX
  // apps.value = []; 
  // totalApps.value = 0;

  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      sortBy: sortBy.value,
      sortOrder: 'desc',
      name: searchQuery.value || undefined,
    };

    const response = await $api.get<{ data: ApiApp[]; total: number }>('/me/apps/liked', {
        params: params
    });

    console.log('response', response);
    apps.value = response.data.data;
    totalApps.value = response.data.total;

    // Ensure currentPage is valid after fetching
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value; 
        // Fetch again if page changed, common when last item on a page is removed
        // This might be needed depending on how unliking/filtering interacts
        // await fetchLikedApps(); // Be cautious of infinite loops
    }

  } catch (error: any) {
    console.error('Failed to fetch liked apps:', error);
    errorMessage.value = '高く評価したアプリの読み込みに失敗しました。再読み込みしてください。';
    apps.value = []; // Clear data on error
    totalApps.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// --- Debounced Search Fetch --- 
const debouncedFetch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    // Reset to page 1 when search query changes
    if (currentPage.value !== 1) {
      currentPage.value = 1;
    } else {
      // If already on page 1, trigger fetch directly
      fetchLikedApps();
    }
  }, 300); // 300ms delay
};

// --- Watchers for Pagination, Search, and Sort --- 
watch(currentPage, (newPage, oldPage) => {
  // Fetch only if page actually changed to avoid redundant calls
  if (newPage !== oldPage) {
    fetchLikedApps();
  }
});

watch(sortBy, () => {
  // Reset to page 1 when sort changes
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    fetchLikedApps();
  }
});

// Use the debounced function for search query changes
watch(searchQuery, debouncedFetch);

// --- Initial Data Load ---
onMounted(() => {
  fetchLikedApps();
});

// --- Data Mapping --- 
// APIレスポンスをAppCardが期待する形式に変換
const mapApiAppToCardApp = (apiApp: ApiApp): CardApp => ({
  id: apiApp.id,
  name: apiApp.name,
  description: apiApp.description ?? '', // nullの場合は空文字
  imageUrl: apiApp.thumbnailUrl || '/img/placeholder.png', // nullの場合はプレースホルダー画像
  likeCount: apiApp.likesCount || 0,
  dislikeCount: apiApp.dislikesCount || 0,
  usageCount: apiApp.usageCount,
  requiresSubscription: apiApp.isSubscriptionLimited, // isSubscriptionLimited をマッピング
  category: apiApp.category, // ★ Add category mapping
  creatorId: apiApp.creatorId,
  creatorName: apiApp.creatorName,
  creatorAvatarUrl: apiApp.creatorAvatarUrl,
});

// --- Navigation --- 
const goToAppDetail = (appId: number) => {
  router.push(`/apps/${appId}`);
};

// --- Event Handlers --- 
const handleToggleBookmark = (appId: number) => {
  console.warn('Unliking from Liked page is not implemented yet.');
  // TODO: Implement API call to dislike/unlike
  // Need to call $api.post(`/me/ratings/apps/${appId}`, { type: 'LIKE' });
  // After success, refetch or remove locally:
  // fetchLikedApps(); 
};

const goToUserProfile = (creatorId: number) => {
  // Implement the logic to go to user profile
  console.log(`Going to user profile with ID: ${creatorId}`);
};

</script>

<style scoped>
/* You can add specific styles here if needed */
.v-sheet {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12); /* Optional divider */
}
</style>
