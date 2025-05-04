<template>
  <v-container>
    <!-- Page Title: Removed as it's likely handled by layout or _app.vue -->
    <!-- <PageTitle :title="pageTitle" /> -->

    <!-- Loading State for Profile -->
    <v-card v-if="dataLoading" variant="outlined" class="mb-6">
      <v-card-text class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-3">ユーザー情報を読み込んでいます...</p>
      </v-card-text>
    </v-card>

    <!-- Profile Card -->
    <v-card v-else-if="userProfile" variant="outlined" class="mb-6">
      <v-card-item>
        <div class="d-flex align-center">
          <v-avatar size="64" class="mr-4" :image="userProfile.avatarUrl || undefined">
            <!-- Fallback Icon -->
            <v-icon v-if="!userProfile.avatarUrl" size="x-large">mdi-account-circle</v-icon>
          </v-avatar>
          <div>
            <v-card-title class="text-h5 pa-0">{{ userProfile.name }}</v-card-title>
            <!-- Optional: Display Email or Role -->
            <v-card-subtitle class="pa-0 mt-1">{{ userProfile.email }}</v-card-subtitle>
          </div>
        </div>
      </v-card-item>
      <!-- 自己紹介セクションのコメントを解除 -->
      <v-divider></v-divider>
      <v-card-text>
        <h3 class="text-subtitle-1 mb-2">自己紹介</h3>
        <p v-if="userProfile.bio">{{ userProfile.bio }}</p>
        <p v-else class="text-medium-emphasis">自己紹介はまだ設定されていません。</p>
      </v-card-text>
    </v-card>

    <!-- User Not Found / Profile Error Alert -->
    <v-alert v-else-if="dataError" type="warning" variant="outlined" class="mb-6">
      {{ dataError }}
    </v-alert>

    <!-- User's Apps Section -->
    <div v-if="userProfile"> <!-- Show apps section only if profile loaded successfully -->
        <!-- App Search Input -->
        <v-row class="mb-n2">
            <v-col cols="12">
                 <AppSearch v-model="appSearchQuery" label="作成したアプリを検索..." />
            </v-col>
        </v-row>

        <div class="d-flex justify-space-between align-center mb-4">
             <h2 class="text-h5 font-weight-medium">作成したアプリ</h2>
             <!-- Sorting Chips -->
             <v-chip-group
                 v-model="sortOption"
                 mandatory
                 active-class="text-primary"
             >
                 <v-chip value="trend" size="small">トレンド</v-chip>
                 <v-chip value="latest" size="small">最新順</v-chip>
             </v-chip-group>
        </div>

        <!-- Apps Loading Indicator -->
        <v-row v-if="dataLoading" justify="center"> <!-- Use combined loading state -->
            <v-col cols="auto">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </v-col>
        </v-row>

        <!-- Apps Error Alert -->
        <v-alert v-else-if="dataError && !userProfile" type="error" variant="tonal" class="mb-4"> <!-- Show app error only if profile loaded but apps failed -->
            {{ dataError }}
        </v-alert>

        <!-- Apps List -->
        <v-row v-else-if="appsData.data.length > 0">
            <v-col
                v-for="app in appsData.data"
                :key="app.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
            >
                <AppCard :app="{
                    id: app.id,
                    name: app.name,
                    description: app.description || '',
                    imageUrl: app.thumbnailUrl || 'https://placehold.jp/300x300.png?text=No+Image',
                    likes: app.likesCount,
                    dislikes: app.dislikesCount,
                    usageCount: app.usageCount,
                    requiresSubscription: app.isSubscriptionLimited,
                    creatorId: app.creatorId,
                    creatorName: app.creatorName, // Ensure these are available in AppDto if needed
                    creatorAvatarUrl: app.creatorAvatarUrl,
                    // カテゴリ情報を AppCard に渡す
                    category: app.category
                }" @title-click="goToAppDetail(app.id)" />
            </v-col>
        </v-row>

        <!-- No Apps Message -->
        <v-alert v-else-if="!dataLoading" type="info" variant="tonal"> <!-- Show only when not loading -->
            このユーザーはまだアプリを作成していません。
        </v-alert>

        <!-- Pagination -->
        <v-row v-if="totalPages > 1 && !dataLoading" justify="center" class="mt-4"> <!-- Hide pagination while loading -->
           <v-col cols="auto">
               <v-pagination
                   v-model="currentPage"
                   :length="totalPages"
                   :total-visible="7"
               ></v-pagination>
           </v-col>
        </v-row>
    </div>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
// import PageTitle from '~/components/PageTitle.vue'; // Removed if not needed
import AppCard from '~/components/AppCard.vue';
import AppSearch from '~/components/AppSearch.vue'; // AppSearch をインポート
import { debounce } from 'lodash-es'; // debounce をインポート

// Define the user profile interface based on API response
interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  role: string; // Assuming Role is returned as string
  planName: string;
  bio?: string | null; // bio をオプショナルで追加
}

// Define the App DTO interface (align with API response & AppCard)
// Consider sharing this with index.vue
interface AppDto {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  usageCount: number;
  createdAt: string; // API returns string
  categoryId?: number | null;
  category?: { id: number; name: string } | null;
  isSubscriptionLimited: boolean;
  creatorId?: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  likesCount: number;
  dislikesCount: number;
}

interface AppListResponse {
  data: AppDto[];
  total: number;
}

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp(); // $api を取得

const userProfile = ref<UserProfile | null>(null);
const appsData = ref<AppListResponse>({ data: [], total: 0 });

const dataLoading = ref(true); // 統合されたローディング状態
const dataError = ref<string | null>(null); // 統合されたエラー状態

const currentPage = ref(1);
const itemsPerPage = 12;
const sortOption = ref('trend');
const appSearchQuery = ref('');

const userId = computed(() => Number(route.params.id));

// Dynamic page title
const pageTitle = computed(() => {
  if (dataLoading.value) {
    return 'ユーザー情報を読み込み中...';
  }
  return userProfile.value ? `${userProfile.value.name} のプロフィール` : 'ユーザーが見つかりません';
});

// --- API Parameter Calculation (変更なし) ---
const apiParams = computed(() => {
  const params: Record<string, any> = {
    // creatorId は不要 (パスパラメータで指定するため)
    page: currentPage.value,
    limit: itemsPerPage,
  };
  if (sortOption.value === 'latest') {
    params.sortBy = 'createdAt';
    params.sortOrder = 'desc';
  } else {
    params.sortBy = 'usageCount';
    params.sortOrder = 'desc';
  }
  if (appSearchQuery.value) {
    params.appName = appSearchQuery.value;
  }
  return params;
});

// --- Total Pages Calculation (変更なし) ---
const totalPages = computed(() => {
  return Math.ceil(appsData.value.total / itemsPerPage);
});

// Fetch combined user profile and apps data from API
const fetchUserData = async () => {
  if (isNaN(userId.value)) {
      dataError.value = '無効なユーザーIDです。';
      dataLoading.value = false;
      userProfile.value = null;
      appsData.value = { data: [], total: 0 };
      return;
  }

  dataLoading.value = true;
  dataError.value = null;
  console.log(`Fetching data for user ID: ${userId.value}, Params:`, apiParams.value);

  try {
    // /users/:id を呼び出し、アプリ取得用のクエリパラメータを渡す
    const response = await $api.get<{ // レスポンス全体の型を定義 (仮)
        id: number;
        email: string;
        name: string;
        avatarUrl: string | null;
        createdAt: string;
        updatedAt: string;
        role: string;
        planName: string;
        apps: AppListResponse; // ネストされたアプリ情報
    }>(`/users/${userId.value}`, {
      params: apiParams.value // ページネーション、ソート、検索パラメータ
    });

    // レスポンスからユーザー情報とアプリ情報を分割して設定
    const { apps, ...profile } = response.data;
    userProfile.value = profile;
    appsData.value = apps;

    // Ensure currentPage is valid after fetching
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
    }

  } catch (err: any) {
    console.error(`Failed to fetch data for user ID ${userId.value}:`, err);
    dataError.value = 'データの読み込みに失敗しました。';
    if (err.response?.status === 404) {
        dataError.value = 'ユーザーが見つかりませんでした。';
    }
    userProfile.value = null;
    appsData.value = { data: [], total: 0 };
  } finally {
    dataLoading.value = false;
  }
};

// Debounced version of fetchUserData for search input
const debouncedFetchUserData = debounce(() => {
    currentPage.value = 1; // 検索時は1ページ目に戻す
    fetchUserData();
}, 300); // 300ms のデバウンス

// Fetch initial data on component mount
onMounted(() => {
  fetchUserData(); // Initial data fetch
});

// Watch for changes in parameters (page, sort) and refetch data
watch([currentPage, sortOption], () => {
    // 検索クエリがある状態でページやソートが変わっても再検索はしないように
    fetchUserData();
});

// Watch for search query changes (debounced)
watch(appSearchQuery, debouncedFetchUserData);

// Watch for userId changes (if the route could change without remounting)
watch(userId, (newId) => {
    if (!isNaN(newId)) {
        currentPage.value = 1;
        sortOption.value = 'trend';
        appSearchQuery.value = '';
        fetchUserData(); // Fetch data for the new user ID
    } else {
        dataError.value = '無効なユーザーIDです。';
        userProfile.value = null;
        appsData.value = { data: [], total: 0 };
    }
});

// Navigation function for AppCard
const goToAppDetail = (appId: number) => {
    router.push(`/apps/${appId}`);
};

</script>

<style scoped>
/* Add specific styles if needed */
.v-avatar {
  border: 1px solid rgba(0,0,0,0.1);
}
</style> 
