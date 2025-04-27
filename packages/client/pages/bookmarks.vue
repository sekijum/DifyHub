<template>
  <v-container>
    <PageTitle title="ブックマーク" />

    <!-- Desktop Layout (md and up) -->
    <v-row v-if="display.mdAndUp.value && hasBookmarks">
      <!-- Left Pane: Destination List -->
      <v-col cols="12" md="3">
        <v-list density="compact" nav>
          <v-list-subheader>保存先</v-list-subheader>
          <v-list-item
            v-for="dest in Object.keys(bookmarksByDestination)"
            :key="dest"
            :value="dest"
            :title="dest"
            :active="selectedDestination === dest"
            @click="selectedDestination = dest"
            color="primary"
            variant="plain"
          >
           <template v-slot:append>
              <v-chip size="x-small">{{ bookmarksByDestination[dest]?.length ?? 0 }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-col>

      <!-- Right Pane: App List -->
      <v-col cols="12" md="9">
        <div v-if="selectedDestination">
          <h2 class="text-h6 font-weight-medium mb-3">{{ selectedDestination }}</h2>
          <v-row v-if="appsInSelectedDestination.length > 0">
            <v-col
              v-for="app in appsInSelectedDestination"
              :key="app.id"
              cols="12"
              sm="6"
              md="4"
              lg="4" 
            >
              <AppCard 
                :app="app" 
                :is-bookmarked="true" 
                @title-click="goToAppDetail(app.id)"
                @toggle-bookmark="handleToggleBookmark(app.id)" 
                :creator-name="app.creatorName" 
                :creator-avatar-url="app.creatorAvatarUrl"
                @creator-click="goToUserProfile"
              />
            </v-col>
          </v-row>
          <p v-else class="text-medium-emphasis pa-4">この保存先にはアプリがありません。</p>
        </div>
        <div v-else class="text-center text-medium-emphasis pa-10">
          <p>左のリストから保存先を選択してください。</p>
        </div>
      </v-col>
    </v-row>

    <!-- Mobile Layout (sm and down) -->
    <div v-else-if="!display.mdAndUp.value && hasBookmarks">
      <!-- Mobile: Destination List View -->
      <div v-if="viewMode === 'list'">
        <v-list density="compact" nav>
          <v-list-subheader>保存先</v-list-subheader>
          <v-list-item
            v-for="dest in Object.keys(bookmarksByDestination)"
            :key="dest"
            :value="dest"
            :title="dest"
            @click="selectDestination(dest)" 
            color="primary"
            variant="plain"
          >
           <template v-slot:append>
              <v-chip size="x-small">{{ bookmarksByDestination[dest]?.length ?? 0 }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Mobile: App List View -->
      <div v-else-if="viewMode === 'apps' && selectedDestination">
         <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="showListView" class="mb-2">
            保存先リストに戻る
          </v-btn>
         <h2 class="text-h6 font-weight-medium mb-3">{{ selectedDestination }}</h2>
         <v-row v-if="appsInSelectedDestination.length > 0">
            <v-col
              v-for="app in appsInSelectedDestination"
              :key="app.id"
              cols="12" 
              sm="6"   
            >
              <AppCard 
                :app="app" 
                :is-bookmarked="true" 
                @title-click="goToAppDetail(app.id)"
                @toggle-bookmark="handleToggleBookmark(app.id)" 
                :creator-name="app.creatorName" 
                :creator-avatar-url="app.creatorAvatarUrl"
                @creator-click="goToUserProfile"
              />
            </v-col>
          </v-row>
          <p v-else class="text-medium-emphasis pa-4">この保存先にはアプリがありません。</p>
      </div>
    </div>

    <v-row v-else justify="center">
      <v-col cols="auto" class="text-center text-medium-emphasis mt-10">
        <v-icon size="x-large" class="mb-2">mdi-bookmark-off-outline</v-icon>
        <p>ブックマークされたアプリはまだありません。</p>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import AppCard from '~/components/AppCard.vue';
import PageTitle from '~/components/PageTitle.vue';

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
  creatorName?: string; // Add creator name
  creatorAvatarUrl?: string; // Add creator avatar URL
}

// Type for bookmark data structure
interface Bookmarks {
  [destination: string]: App[];
}

// --- LocalStorage Keys ---
const BOOKMARK_DESTINATIONS_KEY = 'bookmarkDestinations';
const BOOKMARKED_APPS_KEY = 'bookmarkedApps';

// Type for data stored in localStorage
interface LocalStorageBookmarkData {
  destinations: string[];
  apps: { [appId: number]: string };
}

const router = useRouter();
const display = useDisplay(); // Get display info

// --- Reactive State --- 
const bookmarksByDestination = ref<Bookmarks>({}); 
const selectedDestination = ref<string | null>(null);
const viewMode = ref<'list' | 'apps'>('list'); // For mobile view switching

// --- Helper Functions for localStorage ---
const loadBookmarksFromStorage = (): LocalStorageBookmarkData => {
  const destinationsStr = localStorage.getItem(BOOKMARK_DESTINATIONS_KEY);
  const appsStr = localStorage.getItem(BOOKMARKED_APPS_KEY);
  let destinations = destinationsStr ? JSON.parse(destinationsStr) : ['お気に入り', '後で見る', '仕事用']; 
  const apps = appsStr ? JSON.parse(appsStr) : {};

  // --- Add Sample Destinations (for testing) ---
  const sampleDestinations: string[] = [];
  for (let i = 1; i <= 20; i++) {
      sampleDestinations.push(`サンプル保存先 ${i}`);
  }
  // Combine existing and sample, removing duplicates
  const combinedDestinations = [...new Set([...destinations, ...sampleDestinations])];
  // If the list changed, save it back
  if (combinedDestinations.length !== destinations.length || !destinationsStr) {
      console.log('Creating/updating sample bookmark destinations in localStorage...');
      localStorage.setItem(BOOKMARK_DESTINATIONS_KEY, JSON.stringify(combinedDestinations));
      destinations = combinedDestinations; // Use the updated list
  }
  // --- End Sample Destinations --- 

  return { destinations, apps };
};

const saveBookmarkedAppsToStorage = (apps: { [appId: number]: string }) => {
  localStorage.setItem(BOOKMARKED_APPS_KEY, JSON.stringify(apps));
};

// Function to fetch app details (simplified dummy version)
const fetchAppDetails = (appId: number): Omit<App, 'isBookmarked'> | null => {
    // In a real app, fetch from API or shared store. Here, just return dummy data.
    if (appId > 0 && appId <= 300) { // Adjust range based on potential IDs
        // Dummy creator data
        const creators = ['山本 大輔', '中村 美咲', '運営チーム', '小林 健一'];
        const creatorIds = [7, 8, null, 9]; // Example IDs
        const avatars = [
            'https://randomuser.me/api/portraits/men/20.jpg',
            'https://randomuser.me/api/portraits/women/21.jpg',
            undefined,
            'https://randomuser.me/api/portraits/men/22.jpg'
        ];
        const creatorIndex = appId % creators.length; // Use appId for variation
        const creatorId = creatorIds[creatorIndex]; // Get ID
        const creatorName = creators[creatorIndex];
        const creatorAvatarUrl = avatars[creatorIndex];

        const likes = Math.floor(Math.random() * 5000);
        const dislikes = Math.floor(Math.random() * likes * 0.5);

        return {
            id: appId,
            name: `アプリ ${appId}`,
            description: `アプリ${appId}の説明です。さらに多くの機能や使い方があり、ユーザーの多様なニーズに応えることができます。定期的なアップデートにより新機能が追加され、セキュリティも強化されています。直感的なインターフェースで、初心者から上級者まで幅広く利用可能です。の説明です。さらに多くの機能や使い方があり、ユーザーの多様なニーズに応えることができます。定期的なアップデートにより新機能が追加され、セキュリティも強化されています。直感的なインターフェースで、初心者から上級者まで幅広く利用可能です。の説明です。さらに多くの機能や使い方があり、ユーザーの多様なニーズに応えることができます。定期的なアップデートにより新機能が追加され、セキュリティも強化されています。直感的なインターフェースで、初心者から上級者まで幅広く利用可能です。...`,
            imageUrl: `https://placehold.jp/300x300.png?text=App+${appId}`,
            likes: likes,
            dislikes: dislikes,
            usageCount: Math.floor(Math.random() * 100000),
            requiresSubscription: appId % 15 === 0,
            creatorId: creatorId, // Add creator ID
            creatorName: creatorName,
            creatorAvatarUrl: creatorAvatarUrl
        };
    }
    return null;
};

// --- Load Bookmarks --- 
const loadAndGroupBookmarks = () => {
  const { destinations, apps: storedBookmarkedApps } = loadBookmarksFromStorage();
  const grouped: Bookmarks = {};

  // Initialize destinations in grouped object
  destinations.forEach(dest => {
    grouped[dest] = [];
  });

  // Group apps by destination
  Object.entries(storedBookmarkedApps).forEach(([appIdStr, destination]) => {
    const appId = parseInt(appIdStr, 10);
    const appDetails = fetchAppDetails(appId);
    if (appDetails) {
        if (!grouped[destination]) {
            grouped[destination] = []; // Create destination if it somehow wasn't in the list
        }
        grouped[destination].push({ ...appDetails, isBookmarked: true });
    }
  });

  // Remove destinations with no apps (optional)
  // Object.keys(grouped).forEach(dest => {
  //   if (grouped[dest].length === 0) {
  //     delete grouped[dest];
  //   }
  // });

  bookmarksByDestination.value = grouped;
};

// --- Computed Property --- 
const appsInSelectedDestination = computed((): App[] => {
  if (selectedDestination.value && bookmarksByDestination.value[selectedDestination.value]) {
    return bookmarksByDestination.value[selectedDestination.value];
  }
  return [];
});

const hasBookmarks = computed(() => {
  // Check based on the loaded and grouped data
  return Object.values(bookmarksByDestination.value).some(apps => apps.length > 0);
});

// --- Event Handlers --- 
const goToAppDetail = (appId: number) => {
  router.push(`/apps/${appId}`);
};

const handleToggleBookmark = (appId: number) => {
  if (!selectedDestination.value) return; // Should not happen if an app is displayed

  const destination = selectedDestination.value;
  // Update the local display immediately
  if (bookmarksByDestination.value[destination]) {
    const appIndex = bookmarksByDestination.value[destination].findIndex(app => app.id === appId);
    if (appIndex !== -1) {
      bookmarksByDestination.value[destination].splice(appIndex, 1);
    }
  }

  // Update localStorage
  const { apps: storedApps } = loadBookmarksFromStorage();
  if (storedApps[appId]) {
    delete storedApps[appId];
    saveBookmarkedAppsToStorage(storedApps);
    console.log(`Removed app ${appId} from localStorage bookmark`);
  }
};

// Called when a destination is clicked in the list
const selectDestination = (dest: string) => {
    selectedDestination.value = dest;
    if (display.mobile.value) { // Switch view on mobile
        viewMode.value = 'apps';
    }
};

// Called by the "Back" button on mobile to show the list
const showListView = () => {
    viewMode.value = 'list';
    // Optional: Reset selectedDestination when going back?
    // selectedDestination.value = null;
};

// New handler for creator click
const goToUserProfile = (creatorId: number) => {
  if (creatorId) { // Prevent navigation if ID is null/undefined
      router.push(`/users/${creatorId}`);
  }
};

// --- Lifecycle --- 
onMounted(() => {
  loadAndGroupBookmarks();
  // Select the first destination automatically if bookmarks exist
  // Only auto-select on larger screens
  if (display.mdAndUp.value) { 
      const destinations = Object.keys(bookmarksByDestination.value);
      if (destinations.length > 0) {
          selectedDestination.value = destinations[0];
      }
  }
});

</script>

<style scoped>
/* Add specific styles if needed */
</style> 
