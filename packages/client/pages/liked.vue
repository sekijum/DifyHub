<template>
  <v-container fluid pt-0 mt-0 pa-0>
    <PageTitle title="高く評価したアプリ" />

    <!-- Search Bar with vertical margin -->
    <v-row class="my-4 px-4">
      <AppSearch v-model="searchQuery" label="高く評価したアプリを検索..." />
    </v-row>

    <v-row v-if="paginatedLikedApps.length > 0" pt-0 mt-0 pa-4>
      <v-col
        v-for="app in paginatedLikedApps"
        :key="app.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <AppCard 
          :app="app" 
          :is-bookmarked="app.isBookmarked" 
          @title-click="goToAppDetail(app.id)"
          @toggle-bookmark="handleToggleBookmark"
          :creator-name="app.creatorName" 
          :creator-avatar-url="app.creatorAvatarUrl"
          @creator-click="goToUserProfile"
        />
      </v-col>
    </v-row>

    <v-row v-else justify="center">
      <v-col cols="auto" class="text-center text-medium-emphasis mt-10">
        <v-icon size="x-large" class="mb-2">mdi-star-off-outline</v-icon>
        <p>高く評価したアプリはまだありません。</p>
      </v-col>
    </v-row>

    <v-row v-if="totalPages > 1" justify="center" class="mt-4">
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppCard from '~/components/AppCard.vue';
import PageTitle from '~/components/PageTitle.vue';
import AppSearch from '~/components/AppSearch.vue';

// Define the App interface (consistent with AppCard)
interface App {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likes: number;
  dislikes?: number;
  usageCount: number;
  requiresSubscription: boolean;
  isBookmarked: boolean;
  creatorId?: number | null; // Add creator ID (allow null)
  creatorName?: string;
  creatorAvatarUrl?: string;
}

const router = useRouter();

// --- Generate 300 Dummy Liked Apps --- 
const allLikedApps = ref<App[]>(Array.from({ length: 300 }, (_, i) => {
  const appId = i + 1; // Use a simple counter for unique ID
  // Dummy creator data (similar to index.vue)
  const creators = ['渡辺 健', '伊藤 さくら', 'ゲストユーザー', '加藤 浩司'];
  const creatorIds = [4, 5, null, 6]; // Example IDs
  const avatars = [
      'https://randomuser.me/api/portraits/men/10.jpg',
      'https://randomuser.me/api/portraits/women/11.jpg',
      undefined,
      'https://randomuser.me/api/portraits/men/12.jpg'
  ];
  const creatorIndex = i % creators.length;
  const creatorId = creatorIds[creatorIndex]; // Get ID
  const creatorName = creators[creatorIndex];
  const creatorAvatarUrl = avatars[creatorIndex];

  const likes = Math.floor(Math.random() * 5000);
  const dislikes = Math.floor(Math.random() * likes * 0.5);

  return {
    id: appId,
    name: `いいねしたアプリ ${appId}`,
    description: `これはいいねしたアプリ${appId}の説明です。様々な機能があります。`,
    imageUrl: `https://placehold.jp/300x300.png?text=Liked+${appId}`,
    likes: likes,
    dislikes: dislikes,
    usageCount: Math.floor(Math.random() * 100000), // Keep random usage count
    requiresSubscription: appId % 15 === 0, // Make subscription less frequent
    isBookmarked: true,
    creatorId: creatorId, // Add creator ID
    creatorName: creatorName,
    creatorAvatarUrl: creatorAvatarUrl
  };
}));

// --- Search State --- 
const searchQuery = ref('');

// --- Filtering Logic --- 
const filteredLikedApps = computed(() => {
  if (!searchQuery.value) {
    return allLikedApps.value;
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return allLikedApps.value.filter(app => 
    app.name.toLowerCase().includes(lowerCaseQuery) ||
    app.description.toLowerCase().includes(lowerCaseQuery)
  );
});

// --- Pagination Logic (using filteredLikedApps) --- 
const currentPage = ref(1);
const itemsPerPage = 40;

const totalPages = computed(() => {
  // Use filtered list length for total pages
  return Math.ceil(filteredLikedApps.value.length / itemsPerPage);
});

const paginatedLikedApps = computed(() => {
  // Reset currentPage if it becomes invalid based on filtered results
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1;
  } else if (totalPages.value === 0) {
      currentPage.value = 1;
  }

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  // Paginate the filtered list
  return filteredLikedApps.value.slice(start, end);
});

// --- Navigation --- 
const goToAppDetail = (appId: number) => {
  router.push(`/apps/${appId}`);
};

// New handler for creator click
const goToUserProfile = (creatorId: number) => {
  // Ensure creatorId is not null before navigating
  if (creatorId) {
      router.push(`/users/${creatorId}`);
  }
};

const handleToggleBookmark = (appId: number) => {
  const appIndex = allLikedApps.value.findIndex(app => app.id === appId);
  if (appIndex !== -1) {
    // Option 1: Just update the local state (app disappears if unbookmarked & page re-filters)
    // allLikedApps.value[appIndex].isBookmarked = !allLikedApps.value[appIndex].isBookmarked;
    
    // Option 2: Remove from the 'liked' list immediately when unbookmarked
    if (allLikedApps.value[appIndex].isBookmarked) { 
      console.log(`Removing app ${appId} from liked list (unbookmarking)`);
      allLikedApps.value.splice(appIndex, 1);
      // In a real app, you'd call the API to remove the bookmark/like
    } else {
        // This case shouldn't happen if only bookmarked items are shown,
        // but as a fallback, toggle it back on if needed.
        // allLikedApps.value[appIndex].isBookmarked = true;
        console.log(`Toggled bookmark for app ${appId}, new status: true`);
    }

    // TODO: Add API call here to persist bookmark status
  }
};

</script>

<style scoped>
/* Add specific styles if needed */
</style> 
