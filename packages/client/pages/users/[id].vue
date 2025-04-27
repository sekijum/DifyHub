<template>
  <v-container>
    <!-- Page Title: Removed as it's likely handled by layout or _app.vue -->
    <!-- <PageTitle :title="pageTitle" /> -->

    <!-- Loading State -->
    <v-card v-if="loading" variant="outlined">
      <v-card-text class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-3">ユーザー情報を読み込んでいます...</p>
      </v-card-text>
    </v-card>

    <!-- Profile Card -->
    <v-card v-else-if="userProfile" variant="outlined" class="mb-6">
      <v-card-item>
        <div class="d-flex align-center">
          <v-avatar size="64" class="mr-4">
            <v-img :src="userProfile.avatarUrl" :alt="userProfile.name"></v-img>
          </v-avatar>
          <div>
            <v-card-title class="text-h5 pa-0">{{ userProfile.name }}</v-card-title>
          </div>
        </div>
      </v-card-item>
      <v-divider></v-divider>
      <v-card-text>
        <h3 class="text-subtitle-1 mb-2">自己紹介</h3>
        <p v-if="userProfile.bio">{{ userProfile.bio }}</p>
        <p v-else class="text-medium-emphasis">自己紹介はまだ設定されていません。</p>
      </v-card-text>
    </v-card>

    <!-- User Not Found Alert -->
    <v-alert v-else-if="!loading && !userProfile" type="warning" variant="outlined" class="mb-6">
      ユーザーが見つかりませんでした。
    </v-alert>

    <!-- User's Apps Section -->
    <div v-if="!loading && userProfile">
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

        <v-row v-if="sortedApps.length > 0">
            <v-col
                v-for="app in paginatedApps"
                :key="app.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
            >
                <AppCard :app="app" @title-click="goToAppDetail(app.id)" />
            </v-col>
        </v-row>
        <v-alert v-else type="info" variant="tonal">
            このユーザーはまだアプリを作成していません。
        </v-alert>

        <!-- Pagination -->
        <v-row v-if="totalPages > 1" justify="center" class="mt-4">
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import PageTitle from '~/components/PageTitle.vue'; // Removed if not needed
import AppCard from '~/components/AppCard.vue';

// Define the user profile interface
interface UserProfile {
  id: string | number;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string | null;
}

// Define the user app interface (subset of AppBase)
interface UserApp {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    likes: number;
    dislikes?: number;
    createdAt: Date; // Added for sorting by latest
    requiresSubscription: boolean;
    usageCount: number;
    isBookmarked?: boolean;
}

const route = useRoute();
const router = useRouter();
const userProfile = ref<UserProfile | null>(null);
const userApps = ref<UserApp[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = 40;
const sortOption = ref('trend'); // Default sort: 'trend' or 'latest'

// Extract user ID from route
const userId = computed(() => route.params.id as string);

// Dynamic page title (Consider if still needed or handled elsewhere)
const pageTitle = computed(() => {
  if (loading.value) {
    return 'ユーザープロフィールを読み込み中...';
  }
  return userProfile.value ? `${userProfile.value.name} のプロフィール` : 'ユーザーが見つかりません';
});

// Sorted Apps based on sortOption
const sortedApps = computed(() => {
    const appsToSort = [...userApps.value]; // Create a shallow copy to avoid mutating original
    if (sortOption.value === 'latest') {
        return appsToSort.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else { // Default to 'trend' (likes)
        return appsToSort.sort((a, b) => b.likes - a.likes);
    }
});

// Pagination computed properties based on sortedApps
const totalPages = computed(() => {
  return Math.ceil(sortedApps.value.length / itemsPerPage);
});

const paginatedApps = computed(() => {
  // Reset page if it becomes invalid after sorting/filtering
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1;
  }
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedApps.value.slice(start, end);
});

// Placeholder for fetching user data (Simulated)
const fetchUserProfile = async (id: string): Promise<UserProfile | null> => {
  console.log(`Fetching profile for user ID: ${id}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId < 1 || numericId > 10) {
    return null;
  }
  const sampleBio = `これはユーザー ${id} の自己紹介文です。ここに趣味や興味、スキルなどを記述できます。${'サンプルテキスト '.repeat(Math.floor(Math.random() * 10) + 3)}`;
  return {
    id: id,
    name: `ユーザー ${id}`,
    username: `user_${id}`,
    avatarUrl: `https://placehold.jp/150x150.png?text=User+${id}`,
    bio: numericId % 3 === 0 ? null : sampleBio,
  };
};

// Placeholder for fetching user's apps (Simulated)
const fetchUserApps = async (userId: string): Promise<UserApp[]> => {
    console.log(`Fetching apps for user ID: ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 600));

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId < 1 || numericUserId > 5) {
        return [];
    }

    const apps: UserApp[] = [];
    const totalAppsToGenerate = Math.min(400, Math.floor(Math.random() * 350) + 50);
    const now = Date.now();

    for (let i = 1; i <= totalAppsToGenerate; i++) {
        const appId = numericUserId * 1000 + i;
        const createdAt = new Date(now - Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date within the last year
        const likes = Math.floor(Math.random() * 500);
        const dislikes = Math.floor(Math.random() * likes * 0.5); // Generate dislikes
        apps.push({
            id: appId,
            name: `ユーザー ${userId} のアプリ ${i}`,
            description: `これはユーザー ${userId} が作成したアプリ ${i} の説明文です。`, // Short description
            imageUrl: `https://placehold.jp/300x200.png?text=App+${appId}`,
            likes: likes,
            dislikes: dislikes,
            createdAt: createdAt, // Assign creation date
            requiresSubscription: Math.random() < 0.1,
            usageCount: Math.floor(Math.random() * 10000),
            isBookmarked: Math.random() < 0.05,
        });
    }
    return apps;
};

// Fetch user data and apps on component mount
onMounted(async () => {
  loading.value = true;
  currentPage.value = 1;
  sortOption.value = 'trend'; // Reset sort option on load
  userApps.value = [];

  try {
      const [profileResult, appsResult] = await Promise.all([
          fetchUserProfile(userId.value),
          fetchUserApps(userId.value)
      ]);
      userProfile.value = profileResult;
      userApps.value = appsResult;
  } catch (error) {
      console.error("Failed to load user data or apps:", error);
      userProfile.value = null;
      userApps.value = [];
  } finally {
      loading.value = false;
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
