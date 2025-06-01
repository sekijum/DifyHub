<template>
  <v-container v-if="app && !loading && !error">
    <v-row>
      <!-- App Details -->
      <v-col cols="12">
         <v-card variant="outlined" class="mb-6">
          <v-card-item>
              <div class="d-flex justify-space-between align-start">
                  <div>
                      <!-- Top Section: Category and Title -->
                      <v-chip v-if="app.category" size="small" color="secondary" variant="flat" class="mb-2">{{ app.category.name }}</v-chip>
                      <v-chip
                          v-if="app.isSubscriptionLimited"
                          size="small"
                          color="warning"
                          variant="flat"
                          class="font-weight-medium mb-2 ml-2" 
                      >
                          サブスクリプション限定
                      </v-chip>
                      <v-card-title class="text-h4 font-weight-bold pa-0 mb-3">
                          {{ app.name }}
                      </v-card-title>

                      <!-- Developer Info - Use top-level properties -->
                      <!-- ★ v-if uses app.creatorName -->
                      <nuxt-link v-if="app.creatorName" :to="`/users/${app.creatorId}`" class="text-decoration-none text-high-emphasis d-inline-block mb-4">
                          <div class="d-flex align-center">
                            <v-avatar size="32" class="mr-2">
                              <!-- ★ Use app.creatorAvatarUrl with fallback -->
                              <v-img :src="app.creatorAvatarUrl || 'https://placehold.jp/40x40.png?text=No+Avatar'" :alt="`${app.creatorName} Avatar`"></v-img>
                            </v-avatar>
                            <!-- ★ Display app.creatorName -->
                            <span class="text-subtitle-1 font-weight-medium">{{ app.creatorName }}</span>
                          </div>
                      </nuxt-link>
                      <!-- ★ Fallback still uses creatorId if name is missing -->
                      <div v-else-if="app.creatorId" class="d-inline-block mb-4">
                          <div class="d-flex align-center">
                              <v-avatar size="32" class="mr-2">
                                  <v-img src="https://placehold.jp/40x40.png?text=No+Avatar" :alt="`開発者 ${app.creatorId} Avatar`"></v-img>
                              </v-avatar>
                              <span class="text-subtitle-1 font-weight-medium">開発者 {{ app.creatorId }}</span>
                          </div>
                      </div>
                  </div>
                  <div class="d-flex align-center" style="margin-top: 4px;">
                      <!-- Bookmark Button (Always visible) -->
                      <v-tooltip location="bottom" :text="isBookmarked ? 'ブックマークを編集' : 'ブックマークに追加'">
                        <template v-slot:activator="{ props: tooltipProps }">
                          <v-btn
                            v-bind="tooltipProps"
                            :loading="bookmarkLoading" 
                            :color="isBookmarked ? 'primary' : 'on-surface-variant'"
                            icon
                            size="small"
                            @click="openBookmarkDialog" 
                            class="mr-2"
                          >
                            <v-icon :icon="isBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline'"></v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <!-- Subscription Label -->
                      <v-chip
                          v-if="app.isSubscriptionLimited"
                          size="small"
                          color="warning"
                          variant="flat"
                          class="font-weight-medium"
                      >
                          サブスクリプション限定
                      </v-chip>
                  </div>
              </div>

              <!-- Description -->
              <v-card-text class="pa-0 mb-4">
                  <div class="text-body-1">{{ app.description }}</div>
              </v-card-text>

              <v-divider class="mb-4"></v-divider>

              <!-- Meta Info Area Below Description -->
              <!-- Like/Dislike Buttons (Always visible) -->
              <div class="d-flex align-center mb-3">
                   <!-- Like Button -->
                   <v-tooltip location="bottom" text="高評価">
                      <template v-slot:activator="{ props: tooltipProps }">
                           <v-btn
                              v-bind="tooltipProps"
                              :loading="ratingLoading"
                              :variant="isLiked ? 'outlined' : 'text'"
                              :color="isLiked ? 'primary' : 'on-surface-variant'"
                              @click="likeApp" 
                              icon 
                              size="small"
                              class="mr-1 like-dislike-btn" 
                           >
                              <v-icon :icon="isLiked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                              ></v-icon>
                           </v-btn>
                      </template>
                  </v-tooltip>
                  <span class="text-body-2 mr-2 font-weight-medium">{{ formatLikes(app.likeCount) }}</span>

                   <!-- Dislike Button -->
                   <v-tooltip location="bottom" text="低評価">
                      <template v-slot:activator="{ props: tooltipProps }">
                           <v-btn
                              v-bind="tooltipProps"
                              :loading="ratingLoading"
                              :variant="isDisliked ? 'outlined' : 'text'"
                              :color="isDisliked ? 'primary' : 'on-surface-variant'"
                              @click="dislikeApp" 
                              icon
                              size="small"
                              class="mr-1 like-dislike-btn" 
                           >
                              <v-icon :icon="isDisliked ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
                              ></v-icon>
                           </v-btn>
                      </template>
                  </v-tooltip>
                  <span class="text-caption mr-2">{{ formatLikes(app.dislikeCount) }}</span> 
              </div>

              <!-- Tags -->
              <div class="d-flex flex-wrap mb-4" v-if="app.tags && app.tags.length > 0">
                   <v-chip
                     v-for="tag in app.tags"
                     :key="tag.id"
                     size="x-small" 
                     color="primary"
                     variant="outlined"
                     class="mr-1 mb-1"
                   >
                     {{ tag.name }}
                   </v-chip>
               </div>
               
               <!-- Additional Info: Dates and Usage -->
               <div class="text-caption text-medium-emphasis">
                   <span class="d-block d-sm-inline-flex align-center mb-1 mb-sm-0">
                       利用回数: {{ app.usageCount.toLocaleString() }} 回
                   </span>
                   <span class="d-none d-sm-inline mx-2">|</span> 
                   <span class="d-block d-sm-inline-flex align-center mb-1 mb-sm-0">
                       公開日: {{ formatDate(app.createdAt) }}
                   </span>
                    <span class="d-none d-sm-inline mx-2">|</span> 
                   <span class="d-block d-sm-inline-flex align-center">
                       最終更新日: {{ formatDate(app.updatedAt) }}
                   </span>
               </div>

               <!-- Use App Button -->
               <v-btn 
                 :loading="useAppLoading"
                 :disabled="isUseAppButtonDisabled" 
                 color="primary"
                 variant="flat"
                 size="large"
                 class="mt-4" 
                 @click="useApp" 
                 block 
               >
                 アプリを使う
               </v-btn>
               <!-- Subscription required message -->
               <v-alert
                 v-if="isDisabledDueToSubscription"
                 type="warning"
                 density="compact"
                 variant="tonal"
                 class="mt-2"
                 border="start"
               >
                 このアプリを使用するには、有料プランへの登録が必要です。
                 <nuxt-link to="/plans" class="text-decoration-underline font-weight-medium ml-2">プランを確認</nuxt-link>
               </v-alert>
               <!-- API error message -->
               <v-alert v-if="useAppError && !isDisabledDueToSubscription" type="error" density="compact" class="mt-2">{{ useAppError }}</v-alert>

          </v-card-item>
        </v-card>

      </v-col>

       <!-- Image Gallery with Thumbs -->
       <v-col cols="12">
          <div v-if="app.subImages && app.subImages.length > 0">
             <h2 class="text-h5 font-weight-medium mb-4">ギャラリー</h2>
             <!-- Main Swiper -->
             <swiper
               :style="{
                 '--swiper-navigation-color': vuetifyTheme.current.value.colors.primary,
                 '--swiper-pagination-color': vuetifyTheme.current.value.colors.primary,
               }"
               :modules="[FreeMode, Navigation, Thumbs]"
               :space-between="10"
               :navigation="true"
               :thumbs="{ swiper: thumbsSwiper }"
               class="gallery-swiper-main mb-3"
             >
               <swiper-slide v-for="(image, index) in app.subImages" :key="`main-${index}`">
                 <v-img :src="image.imageUrl" aspect-ratio="16/9" cover></v-img>
               </swiper-slide>
             </swiper>
 
             <!-- Thumbs Swiper -->
             <swiper
               @swiper="setThumbsSwiper"
               :modules="[FreeMode, Navigation, Thumbs]"
               :space-between="10"
               :slides-per-view="4" 
               :breakpoints="{
                   480: { slidesPerView: 5 }, 
                   768: { slidesPerView: 6 },
                   960: { slidesPerView: 7 },
                   1280: { slidesPerView: 8 }
               }"
               :watch-slides-progress="true"
               :free-mode="true"
               class="gallery-swiper-thumbs"
             >
                <swiper-slide v-for="(image, index) in app.subImages" :key="`thumb-${index}`">
                  <v-img :src="image.imageUrl" aspect-ratio="1" cover class="thumb-image"></v-img>
                </swiper-slide>
             </swiper>
          </div>
          <v-card v-else class="mb-5">
              <v-img :src="app.thumbnailUrl || 'https://placehold.jp/300x300.png?text=No+Image'" aspect-ratio="16/9" cover></v-img>
              <v-card-text>ギャラリー画像がありません。</v-card-text>
          </v-card>
       </v-col>
     </v-row>
 
      <!-- Recommended Apps -->
      <v-row>
          <v-col cols="12">
              <h2 class="text-h5 font-weight-medium my-4">おすすめのアプリ</h2>
              
              <!-- Recommended Loading -->
              <v-row v-if="recommendedLoading" justify="center">
                  <v-progress-circular indeterminate color="primary" class="my-4"></v-progress-circular>
              </v-row>

              <!-- Recommended Error -->
              <v-row v-else-if="recommendedError">
                  <v-col cols="12">
                      <v-alert type="warning" density="compact" variant="tonal">
                          おすすめアプリの読み込みに失敗しました: {{ recommendedError.message }}
                      </v-alert>
                  </v-col>
              </v-row>

              <!-- Recommended Apps List & Pagination -->
              <template v-else-if="allRecommendedApps.length">
                  <v-row>
                      <v-col
                          v-for="recApp in paginatedRecommendedApps" 
                          :key="recApp.id"
                          cols="12"
                          sm="6"
                          md="4"
                          lg="3"
                          xl="2" 
                      >
                          <!-- ★ Pass mapped RecommendedApp to AppCard -->
                          <AppCard :app="recApp" @title-click="goToAppDetail(recApp.id)" />
                      </v-col>
                  </v-row>
                  <v-row justify="center" class="mt-4">
                     <v-col cols="auto">
                         <v-pagination
                             v-model="recommendedCurrentPage"
                             :length="totalRecommendedPages"
                             :total-visible="7"
                         ></v-pagination>
                     </v-col>
                  </v-row>
              </template>
              
              <!-- No Recommendations Found -->
              <v-row v-else>
                  <v-col cols="12">
                      <p class="text-medium-emphasis text-center pa-4">関連するおすすめアプリは見つかりませんでした。</p>
                  </v-col>
              </v-row>
          </v-col>
      </v-row>
 
   </v-container>
    <v-container v-else-if="loading" class="text-center">
      <v-progress-circular indeterminate color="primary" class="my-10"></v-progress-circular>
    </v-container>
    <v-container v-else class="text-center">
        <v-alert v-if="error" type="error" class="my-10">
            アプリ情報の読み込みに失敗しました: {{ error.message }}
        </v-alert>
        <p v-else-if="!app && !loading">アプリデータが見つかりませんでした。</p>
   </v-container>

  <!-- Bookmark Dialog Component -->
  <BookmarkDialog
    v-if="app" 
    v-model="bookmarkDialog"
    :app-id="app.id" 
    :app-name="app.name ?? ''"
    @update:bookmarked-status="handleBookmarkStatusUpdate" 
  />

  <!-- Snackbar for login required messages -->
  <v-snackbar
    v-model="snackbarVisible"
    :timeout="4000" 
    :color="snackbarColor"
    location="bottom center" 
  >
    {{ snackbarMessage }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="snackbarVisible = false"
      >
        閉じる
      </v-btn>
    </template>
  </v-snackbar>

</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import AppCard from '~/components/AppCard.vue';
import BookmarkDialog from '~/components/BookmarkDialog.vue';
import { useTheme } from 'vuetify';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

// --- Type Definitions ---
interface CategoryInfo { id: number; name: string; }
interface TagInfo { id: number; name: string; }
interface SubImageInfo { id: number; imageUrl: string; }

interface UserSubscription {
  id: number;
  status: string;
  plan: string;
  priceMonthly: number | null;
}

interface UserPayload {
  userId: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
  subscription?: UserSubscription | null;
  planName: string;
}

interface AppDetail {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  appUrl: string;
  creatorId: number;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  status: string;
  categoryId: number | null;
  isSubscriptionLimited: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  category?: CategoryInfo | null;
  tags: TagInfo[];
  subImages: SubImageInfo[];
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  likeCount: number;
  dislikeCount: number;
}

// ★ Define AppDto as returned by the API (matches server/dto/app.dto.ts)
interface ApiAppDto {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  appUrl: string; // Assuming this is part of AppDto
  isSubscriptionLimited: boolean;
  usageCount: number;
  createdAt: string;
  category?: { id: number; name: string } | null;
  creatorId?: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  likeCount: number;
  dislikeCount: number;
}

// ★ Define RecommendedApp matching AppCard props
interface RecommendedApp {
    id: number;
    name: string;
    description: string; 
    imageUrl: string; 
    likeCount: number; 
    dislikeCount: number; 
    requiresSubscription: boolean;
    usageCount: number;
    category?: { id: number; name: string } | null;
    creatorId?: number | null;
    creatorName?: string;
    creatorAvatarUrl?: string | null;
}

// ★ Define API response for recommended apps
interface RecommendedAppListResponse {
  data: ApiAppDto[]; // ★ Change 'apps' to 'data'
  total: number;
}
// ----------------------------------------

const route = useRoute();
const router = useRouter();
const { $api, payload } = useNuxtApp();
const loggedInUser = computed<UserPayload | null>(() => payload.user as UserPayload | null);

const app = ref<AppDetail | null>(null);
const allRecommendedApps = ref<RecommendedApp[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);
const recommendedLoading = ref(false);
const recommendedError = ref<Error | null>(null);
const vuetifyTheme = useTheme();
const thumbsSwiper = ref<any>(null);

// --- Interaction States (Single declaration block) ---
const isLiked = ref(false);
const isDisliked = ref(false);
const isBookmarked = ref(false); 
const bookmarkDialog = ref(false);
const useAppLoading = ref(false);
const useAppError = ref<string | null>(null);
const bookmarkLoading = ref(false);
const ratingLoading = ref(false);
// --------------------------

// --- Pagination State (Single declaration block) ---
const recommendedCurrentPage = ref(1);
const recommendedItemsPerPage = 20;
// --------------------------------------------------

const setThumbsSwiper = (swiper: any) => {
  thumbsSwiper.value = swiper;
};

// --- Data Fetching Function ---
async function loadAppData(id: number) {
    loading.value = true;
    error.value = null;
    app.value = null;
    allRecommendedApps.value = [];
    thumbsSwiper.value = null;
    try {
        const response = await $api.get<AppDetail>(`/apps/${id}`);
        app.value = response.data;
        isBookmarked.value = app.value.isBookmarked ?? false;
        isLiked.value = app.value.isLiked ?? false;
        isDisliked.value = app.value.isDisliked ?? false;
        
        if (app.value) {
          const categoryId = app.value.category?.id;
          const tagIds = app.value.tags?.map(tag => tag.id);
          fetchAndSetRecommendedApps(app.value.id, categoryId, tagIds);
        } else {
          console.warn('App data is null after fetch, skipping recommendations.');
        }
    } catch (err: any) {
        console.error('Failed to fetch app data:', err);
        error.value = new Error(err.response?.data?.message || err.message || 'アプリ情報の取得に失敗しました。');
        if (err.response?.status === 404) {
           error.value = new Error('アプリが見つかりません。');
        }
    } finally {
        loading.value = false;
    }
};

// ★ New function to fetch and set recommended apps
async function fetchAndSetRecommendedApps(currentAppId: number, categoryId?: number, inputTagIds?: number[]) {
  recommendedLoading.value = true;
  recommendedError.value = null;
  recommendedCurrentPage.value = 1; // Reset pagination

  // ★ Ensure tagIdsToSend is always an array
  const tagIdsToSend: number[] = Array.isArray(inputTagIds) ? inputTagIds : [];

  const params: Record<string, any> = {
      limit: 100, 
      ...(categoryId && { categoryId: categoryId }),
      // ★ Always include tagIds key, even if empty initially
      tagIds: tagIdsToSend, 
  };

  try {
    console.log(`Fetching recommended apps for ${currentAppId} with params:`, params); // Log params before serialization
    const response = await $api.get<RecommendedAppListResponse>(`/apps/${currentAppId}/recommended`, {
        params: params,
        paramsSerializer: {
          indexes: null, // tagIds[0], tagIds[1] ではなく tagIds, tagIds の形式で送信
        }
    });
    console.log('Recommended apps response:', response.data);

    if (response.data && Array.isArray(response.data.data)) { 
      allRecommendedApps.value = response.data.data.map((apiApp: ApiAppDto): RecommendedApp => ({
          id: apiApp.id,
          name: apiApp.name,
          description: apiApp.description ?? '', 
          imageUrl: apiApp.thumbnailUrl ?? 'https://placehold.jp/300x300.png?text=No+Image', 
          likeCount: apiApp.likeCount, 
          dislikeCount: apiApp.dislikeCount,
          requiresSubscription: apiApp.isSubscriptionLimited,
          usageCount: apiApp.usageCount,
          category: apiApp.category, 
          creatorId: apiApp.creatorId,
          creatorName: apiApp.creatorName,
          creatorAvatarUrl: apiApp.creatorAvatarUrl,
      }));
    } else {
      console.warn('Recommended apps data received, but response.data.data is missing or not an array:', response.data);
      allRecommendedApps.value = []; 
    }

  } catch (err: any) {
    console.error('Failed to fetch recommended apps:', err);
    recommendedError.value = new Error(err.response?.data?.message || err.message || 'おすすめアプリの取得に失敗しました。');
    allRecommendedApps.value = []; 
  } finally {
    recommendedLoading.value = false;
  }
}

// --- Computed Properties for Pagination ---
const totalRecommendedPages = computed(() => {
  return Math.ceil(allRecommendedApps.value.length / recommendedItemsPerPage);
});
const paginatedRecommendedApps = computed(() => {
  const start = (recommendedCurrentPage.value - 1) * recommendedItemsPerPage;
  const end = start + recommendedItemsPerPage;
  return allRecommendedApps.value.slice(start, end);
});
// ------------------------------------------

// --- Helper Functions ---
const formatLikes = (num: number): string => {
  if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  return num.toString();
};
const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}/${month}/${day}`;
    } catch (e) { console.error('Error formatting date:', dateString, e); return 'N/A'; }
};

// --- Snackbar State ---
const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('info'); // 'success', 'error', 'info', 'warning'

// --- Helper Functions ---
const showSnackbar = (message: string, color: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbarVisible.value = true;
};

// --- Computed Properties ---
const userHasPaidSubscription = computed(() => {
  // Check if user is logged in, has a subscription, and the plan name is not 'free'
  return !!loggedInUser.value && loggedInUser.value.planName !== 'free';
});

// ★ Update isUseAppButtonDisabled: Remove login check
const isUseAppButtonDisabled = computed(() => {
  if (useAppLoading.value) return true; // Disabled when loading
  if (app.value?.isSubscriptionLimited && !userHasPaidSubscription.value) {
    return true; // Disabled if app requires subscription and user doesn't have a paid one
  }
  return false; // Enabled otherwise
});

// ★ Add back isDisabledDueToSubscription computed property
const isDisabledDueToSubscription = computed(() => {
  // Only true if the app requires subscription, the user IS logged in, but doesn't have a paid plan
  return !!(app.value?.isSubscriptionLimited && payload.isLoggedIn && !userHasPaidSubscription.value);
});

// --- Action Functions (Add login checks) ---
const likeApp = async () => {
  // ★ Check login status first
  if (!payload.isLoggedIn) {
    showSnackbar('評価機能を利用するにはサインインが必要です。', 'warning');
    return;
  }
  if (!app.value || ratingLoading.value) { return; }
  ratingLoading.value = true;
  const previousState = { isLiked: isLiked.value, isDisliked: isDisliked.value, likes: app.value.likeCount, dislikes: app.value.dislikeCount };
  const apiPayload = { type: 'LIKE' };
  try {
    const newState = !previousState.isLiked;
    isLiked.value = newState;
    app.value.likeCount += newState ? 1 : -1;
    if (newState && previousState.isDisliked) { isDisliked.value = false; app.value.dislikeCount--; }
    await $api.post(`/me/ratings/apps/${app.value.id}`, apiPayload);
  } catch (err) { console.error("Like/Unlike API call failed:", err); if(app.value) { isLiked.value = previousState.isLiked; isDisliked.value = previousState.isDisliked; app.value.likeCount = previousState.likes; app.value.dislikeCount = previousState.dislikes; } }
  finally { ratingLoading.value = false; }
};

const dislikeApp = async () => {
  // ★ Check login status first
  if (!payload.isLoggedIn) {
    showSnackbar('評価機能を利用するにはサインインが必要です。', 'warning');
    return;
  }
  if (!app.value || ratingLoading.value) { return; }
  ratingLoading.value = true;
  const previousState = { isLiked: isLiked.value, isDisliked: isDisliked.value, likes: app.value.likeCount, dislikes: app.value.dislikeCount };
  const apiPayload = { type: 'DISLIKE' };
  try {
    const newState = !previousState.isDisliked;
    isDisliked.value = newState;
    app.value.dislikeCount += newState ? 1 : -1;
    if (newState && previousState.isLiked) { isLiked.value = false; app.value.likeCount--; }
    await $api.post(`/me/ratings/apps/${app.value.id}`, apiPayload);
  } catch (err) { console.error("Dislike/Un-dislike API call failed:", err); if(app.value) { isLiked.value = previousState.isLiked; isDisliked.value = previousState.isDisliked; app.value.likeCount = previousState.likes; app.value.dislikeCount = previousState.dislikes; } }
  finally { ratingLoading.value = false; }
};

const useApp = async () => {
  // ★ Check login status first
  if (!payload.isLoggedIn) {
    showSnackbar('アプリを利用するにはサインインが必要です。', 'warning');
    return;
  }
  if (!app.value || useAppLoading.value) return;
  // Check for subscription again here before proceeding, even though button might be enabled
  // This handles edge cases where state might change between render and click
  if (app.value.isSubscriptionLimited && !userHasPaidSubscription.value) {
    // This case should ideally be handled by the disabled state, but double-check
    showSnackbar('このアプリを使用するには、有料プランへの登録が必要です。', 'warning');
    // Optionally link to plans page from here too if needed, or rely on the v-alert
    return; 
  }
  useAppLoading.value = true; useAppError.value = null;
  try {
    await $api.post(`/apps/${app.value.id}/use`);
    app.value.usageCount++;
    
    const targetUrl = router.resolve(`/apps/${app.value.id}/use`).href;
    window.open(targetUrl, '_blank');
  } catch (err: any) {
    console.error('Failed to use app:', err);
    if (err.response?.status === 403) { useAppError.value = err.response?.data?.message || 'このアプリを使用するには有料プランへの登録が必要です。'; }
    else { useAppError.value = err.response?.data?.message || 'アプリの利用処理中にエラーが発生しました。'; }
  } finally { useAppLoading.value = false; }
};

// --- Navigation ---
const goToAppDetail = (appId: number) => { router.push(`/apps/${appId}`); };

// --- Lifecycle & Watcher ---
onMounted(() => {
  const appId = Number(route.params.id);
  if (!isNaN(appId)) loadAppData(appId);
  else { loading.value = false; error.value = new Error('無効なアプリIDです。'); }
});
watch(() => route.params.id, (newId, oldId) => {
  const appId = Number(newId);
  if (!isNaN(appId) && newId !== oldId) {
      loadAppData(appId); // This calls the updated fetch function
  }
  else if (isNaN(appId)) { 
      loading.value = false; 
      error.value = new Error('無効なアプリIDです。'); 
      app.value = null; 
      allRecommendedApps.value = []; 
  }
});

// --- Bookmark Dialog Handling (Add login check) ---
const openBookmarkDialog = () => {
  // ★ Check login status first
  if (!payload.isLoggedIn) {
    showSnackbar('ブックマーク機能を利用するにはサインインが必要です。', 'warning');
    return;
  }
  if (!app.value) { console.warn('Cannot open bookmark dialog: App not loaded.'); return; }
  bookmarkDialog.value = true;
};
const handleBookmarkStatusUpdate = (newStatus: boolean) => { isBookmarked.value = newStatus; };
// -------------------------------

console.log(loggedInUser.value);

</script>

<style scoped>
/* Remove previous swiper styles if they exist */

.gallery-swiper-main {
  width: 100%;
  /* height: 80%; */ /* Adjust as needed */
}

.gallery-swiper-thumbs {
  width: 100%;
  height: 100px; /* Adjust thumbnail height */
  box-sizing: border-box;
  padding: 10px 0;
}

.gallery-swiper-thumbs .swiper-slide {
  width: 25%;
  height: 100%;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.gallery-swiper-thumbs .swiper-slide-thumb-active {
  opacity: 1;
}

.thumb-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Style navigation buttons using deep selector if needed */
:deep(.gallery-swiper-main .swiper-button-prev),
:deep(.gallery-swiper-main .swiper-button-next) {
  /* color: rgb(var(--v-theme-primary)); Use CSS var */
  /* background-color: rgba(0, 0, 0, 0.3); */
  /* padding: 15px 10px; */
  /* border-radius: 50%; */
  /* transition: background-color 0.3s ease; */
}
/* :deep(.gallery-swiper-main .swiper-button-prev:hover), */
/* :deep(.gallery-swiper-main .swiper-button-next:hover) { */
/*   background-color: rgba(0, 0, 0, 0.5); */
/* } */

/* Keep other styles */
.v-card-title.text-h4 {
    line-height: 1.3;
}

.v-card-text {
    line-height: 1.6;
}

/* Ensure button icons are not overly large */
:deep(.v-btn--icon .v-icon) {
   font-size: 1.25rem; /* Adjust icon size within buttons */
}

/* Tweak button padding/size slightly */
.like-dislike-btn {
   min-width: 36px !important; /* Ensure buttons have some min width */
}

:deep(.v-btn--icon .v-icon) {
   font-size: 1.2rem; /* Slightly smaller icons */
}
</style> 
