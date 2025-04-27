<template>
  <v-container v-if="app">
    <v-row>
      <!-- App Details -->
      <v-col cols="12">
         <v-card variant="outlined" class="mb-6">
          <v-card-item>
              <div class="d-flex justify-space-between align-start">
                  <div>
                      <!-- Top Section: Category and Title -->
                      <v-chip size="small" color="secondary" variant="flat" class="mb-2">{{ app.category }}</v-chip>
                      <v-card-title class="text-h4 font-weight-bold pa-0 mb-3">
                          {{ app.name }}
                      </v-card-title>

                      <!-- Developer Info - Wrapped in NuxtLink -->
                      <nuxt-link :to="`/users/${app.developerId}`" class="text-decoration-none text-high-emphasis d-inline-block mb-4">
                          <div class="d-flex align-center"> 
                            <v-avatar size="32" class="mr-2">
                              <v-img :src="app.developerAvatarUrl" :alt="`${app.developerName} Avatar`"></v-img>
                            </v-avatar>
                            <span class="text-subtitle-1 font-weight-medium">{{ app.developerName }}</span>
                          </div>
                      </nuxt-link>
                  </div>
                  <div class="d-flex align-center" style="margin-top: 4px;">
                      <!-- Bookmark Button Moved Here -->
                      <v-tooltip location="bottom" :text="isBookmarked ? 'ブックマークを編集' : 'ブックマークに追加'">
                        <template v-slot:activator="{ props: tooltipProps }">
                          <v-btn
                            v-bind="tooltipProps"
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
                          v-if="app.requiresSubscription"
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
              <!-- Like/Dislike Buttons -->
              <div class="d-flex align-center mb-3">
                   <!-- Like Button -->
                   <v-tooltip location="bottom" text="いいね！">
                      <template v-slot:activator="{ props: tooltipProps }">
                           <v-btn
                              v-bind="tooltipProps"
                              :variant="isLiked ? 'outlined' : 'text'" 
                              :color="isLiked ? 'primary' : 'on-surface-variant'"
                              @click="likeApp"
                              icon 
                              size="small"
                              class="mr-1"
                           >
                              <v-icon :icon="isLiked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                              ></v-icon>
                           </v-btn>
                      </template>
                  </v-tooltip>
                  <span class="text-body-2 mr-2 font-weight-medium">{{ formatLikes(app.likes) }}</span>

                   <!-- Dislike Button -->
                   <v-tooltip location="bottom" text="よくないね">
                      <template v-slot:activator="{ props: tooltipProps }">
                           <v-btn
                              v-bind="tooltipProps"
                              :variant="isDisliked ? 'outlined' : 'text'" 
                              :color="isDisliked ? 'primary' : 'on-surface-variant'"
                              @click="dislikeApp"
                              icon
                              size="small"
                              class="mr-1"
                           >
                              <v-icon :icon="isDisliked ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
                              ></v-icon>
                           </v-btn>
                      </template>
                  </v-tooltip>
                  <span v-if="app.dislikes > 0" class="text-caption mr-2">{{ formatLikes(app.dislikes) }}</span> 
              </div>

              <!-- Tags -->
              <div class="d-flex flex-wrap mb-4">
                   <v-chip
                     v-for="tag in app.tags"
                     :key="tag"
                     size="x-small" 
                     color="primary"
                     variant="outlined"
                     class="mr-1 mb-1"
                   >
                     {{ tag }}
                   </v-chip>
               </div>
               
               <!-- Additional Info: Dates and Usage -->
               <div class="text-caption text-medium-emphasis">
                   <span class="d-block d-sm-inline-flex align-center mb-1 mb-sm-0">
                       利用回数: {{ app.usageCount.toLocaleString() }} 回
                   </span>
                   <span class="d-none d-sm-inline mx-2">|</span> 
                   <span class="d-block d-sm-inline-flex align-center mb-1 mb-sm-0">
                       公開日: {{ formatDate(app.publishedDate) }}
                   </span>
                    <span class="d-none d-sm-inline mx-2">|</span> 
                   <span class="d-block d-sm-inline-flex align-center">
                       最終更新日: {{ formatDate(app.lastUpdatedDate) }}
                   </span>
               </div>

               <!-- Use App Button -->
               <v-btn 
                 color="primary"
                 variant="flat"
                 size="large"
                 class="mt-4" 
                 @click="useApp"
                 block 
               >
                 アプリを使う
               </v-btn>

          </v-card-item>
        </v-card>

      </v-col>

       <!-- Image Gallery with Thumbs -->
       <v-col cols="12">
          <div v-if="app.galleryImages && app.galleryImages.length > 0">
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
               <swiper-slide v-for="(image, index) in app.galleryImages" :key="`main-${index}`">
                 <v-img :src="image" aspect-ratio="16/9" cover></v-img>
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
                <swiper-slide v-for="(image, index) in app.galleryImages" :key="`thumb-${index}`">
                  <v-img :src="image" aspect-ratio="1" cover class="thumb-image"></v-img>
                </swiper-slide>
             </swiper>
          </div>
          <v-card v-else class="mb-5">
              <v-img :src="app.imageUrl" aspect-ratio="16/9" cover></v-img>
              <v-card-text>ギャラリー画像がありません。</v-card-text>
          </v-card>
       </v-col>
     </v-row>
 
      <!-- Recommended Apps -->
      <v-row v-if="allRecommendedApps.length > 0">
          <v-col cols="12">
              <h2 class="text-h5 font-weight-medium my-4">おすすめのアプリ</h2>
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
          </v-col>
      </v-row>
 
   </v-container>
    <v-container v-else class="text-center">
      <v-progress-circular indeterminate color="primary" class="my-10"></v-progress-circular>
      <p v-if="!loading">アプリが見つかりません。</p>
   </v-container>

  <!-- Use Bookmark Dialog Component -->
  <BookmarkDialog
    v-model="bookmarkDialog"
    :app-id="app?.id"
    :app-name="app?.name ?? ''"
    @bookmark-saved="handleBookmarkSaved"
    @bookmark-removed="handleBookmarkRemoved"
  />

</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

interface AppBase {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    likes: number;
    dislikes: number;
}

interface AppDetail extends AppBase {
  category: string;
  tags: string[];
  galleryImages: string[];
  publishedDate: Date;
  lastUpdatedDate: Date;
  usageCount: number;
  requiresSubscription: boolean;
  developerId: number;
  developerName: string;
  developerAvatarUrl: string;
}

type RecommendedApp = AppBase & { 
    requiresSubscription: boolean; 
    usageCount: number;
    isBookmarked?: boolean;
};

const route = useRoute();
const router = useRouter();
const app = ref<AppDetail | null>(null);
const allRecommendedApps = ref<RecommendedApp[]>([]);
const loading = ref(true);
const vuetifyTheme = useTheme();
const thumbsSwiper = ref<any>(null);
const isLiked = ref(false);
const isDisliked = ref(false);
const recommendedCurrentPage = ref(1);
const recommendedItemsPerPage = 20;

// --- LocalStorage Keys ---
const BOOKMARK_DESTINATIONS_KEY = 'bookmarkDestinations';
const BOOKMARKED_APPS_KEY = 'bookmarkedApps';

// Type for data stored in localStorage
interface LocalStorageBookmarkData {
  destinations: string[];
  apps: { [appId: number]: string };
}

// --- Bookmark State --- 
const bookmarkDialog = ref(false);
const isBookmarked = ref(false);

// --- Helper Functions for localStorage ---
const saveBookmarkedAppsToStorage = (apps: { [appId: number]: string }) => {
  localStorage.setItem(BOOKMARKED_APPS_KEY, JSON.stringify(apps));
};

// Load only the bookmarked apps map
const loadBookmarkedAppsMap = (): { [appId: number]: string } => {
    const appsStr = localStorage.getItem(BOOKMARKED_APPS_KEY);
    const apps = appsStr ? JSON.parse(appsStr) : {};
    if (!appsStr) {
        localStorage.setItem(BOOKMARKED_APPS_KEY, JSON.stringify(apps)); // Save empty if not exists
    }
    return apps;
};

const setThumbsSwiper = (swiper: any) => {
  thumbsSwiper.value = swiper;
};

// --- Data Fetching Functions ---
const generateLongDescription = (appName: string): string => {
    const baseText = `${appName}は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。は非常に便利なアプリケーションで、多くのユーザーに愛用されています。主な特徴としては、直感的なインターフェース、豊富なカスタマイズオプション、そして安定したパフォーマンスが挙げられます。このツールを使用することで、日常のタスクを効率化し、生産性を大幅に向上させることが期待できます。`;
    let longText = baseText;
    while (longText.length < 250) {
        longText += ` ${appName}に関する追加情報。更新も頻繁に行われ、新機能が定期的に追加されます。サポート体制も充実しており、安心して利用できます。`;
    }
    return longText;
};

const fetchAppDataById = (id: number): AppDetail | null => {
    if (id >= 1 && id <= 100) {
        const appName = `アプリ ${id}`;
        const categories = ['仕事効率化', 'エンタメ', '開発ツール', 'コミュニケーション', 'ユーティリティ'];
        const allTags = ['AI', 'チャット', '画像生成', 'コード', '分析', '自動化', 'テキスト', 'API連携', '業務改善'];
        const randomTags = allTags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
        
        const now = new Date();
        const publishedDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        const lastUpdatedDate = new Date(publishedDate.getTime() + Math.random() * (now.getTime() - publishedDate.getTime()));
        lastUpdatedDate.setDate(lastUpdatedDate.getDate() - Math.random() * 90); 

        const developerId = Math.floor(id / 10) + 1; 
        const developerName = `開発者 ${String.fromCharCode(65 + developerId - 1)}`; 
        const developerAvatarUrl = `https://placehold.jp/40x40.png?text=Dev${developerId}`;

        return {
            id: id,
            name: appName,
            description: generateLongDescription(appName),
            imageUrl: `https://placehold.jp/300x300.png?text=App+${id}`,
            likes: Math.floor(Math.random() * 999999) + 1000,
            dislikes: Math.floor(Math.random() * 50000),
            category: categories[Math.floor(Math.random() * categories.length)],
            tags: randomTags,
            publishedDate: publishedDate,
            lastUpdatedDate: lastUpdatedDate > publishedDate ? lastUpdatedDate : publishedDate,
            usageCount: Math.floor(Math.random() * 1000000),
            galleryImages: Array.from({ length: Math.floor(Math.random() * 6) + 5 }, (_, i) =>
                `https://placehold.jp/1280x720.png?text=Gallery+${id}-${i + 1}`
            ),
            requiresSubscription: id % 10 === 0,
            developerId: developerId,
            developerName: developerName,
            developerAvatarUrl: developerAvatarUrl
        };
    }
    return null;
};

// Fetch ALL possible recommended apps (excluding current)
const fetchAllRecommendedApps = (excludeId: number): RecommendedApp[] => {
    const recommendations: RecommendedApp[] = [];
    const possibleIds = Array.from({ length: 100 }, (_, i) => i + 1).filter(id => id !== excludeId);
    const bookmarkedApps = loadBookmarkedAppsMap(); // Load only app map

    for (const randomId of possibleIds) {
        const recData = fetchAppDataById(randomId); 
        if (recData) {
            recommendations.push({
                id: recData.id,
                name: recData.name,
                description: recData.description.substring(0, 70) + '...',
                imageUrl: recData.imageUrl,
                likes: recData.likes,
                dislikes: recData.dislikes,
                requiresSubscription: recData.requiresSubscription,
                usageCount: recData.usageCount,
                isBookmarked: !!bookmarkedApps[recData.id]
            });
        }
    }
    // Optionally shuffle recommendations
    return recommendations.sort(() => 0.5 - Math.random()); 
};

// --- Computed Properties for Recommended Apps Pagination ---
const totalRecommendedPages = computed(() => {
  return Math.ceil(allRecommendedApps.value.length / recommendedItemsPerPage);
});

const paginatedRecommendedApps = computed(() => {
  const start = (recommendedCurrentPage.value - 1) * recommendedItemsPerPage;
  const end = start + recommendedItemsPerPage;
  return allRecommendedApps.value.slice(start, end);
});

// Helper function to format large like numbers
const formatLikes = (num: number): string => {
    if (num >= 10000) {
        return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    }
    return num.toString();
};

// --- Like/Unlike Functions ---
const likeApp = () => {
    if (!app.value) return;
    const wasLiked = isLiked.value;
    const wasDisliked = isDisliked.value;

    // Toggle like off
    if (wasLiked) {
        isLiked.value = false;
        app.value.likes--;
    } else {
        // Like on
        isLiked.value = true;
        app.value.likes++;
        // If it was disliked, toggle dislike off
        if (wasDisliked) {
            isDisliked.value = false;
            app.value.dislikes--;
        }
    }
    // TODO: Add API call here to persist the like status
    console.log(`Liked: ${isLiked.value}, Disliked: ${isDisliked.value}`);
};

const dislikeApp = () => {
    if (!app.value) return;
    const wasLiked = isLiked.value;
    const wasDisliked = isDisliked.value;

    // Toggle dislike off
    if (wasDisliked) {
        isDisliked.value = false;
        app.value.dislikes--;
    } else {
        // Dislike on
        isDisliked.value = true;
        app.value.dislikes++;
        // If it was liked, toggle like off
        if (wasLiked) {
            isLiked.value = false;
            app.value.likes--;
        }
    }
    // TODO: Add API call here to persist the unlike status
    console.log(`Liked: ${isLiked.value}, Disliked: ${isDisliked.value}`);
};

// --- Navigation Function (Keep existing goToAppDetail) ---
const goToAppDetail = (appId: number) => {
    router.push(`/apps/${appId}`);
};

// --- Data Loading Logic ---
const loadAppData = (id: number) => {
    loading.value = true;
    app.value = null;
    allRecommendedApps.value = [];
    thumbsSwiper.value = null;
    isLiked.value = false;
    isDisliked.value = false;
    isBookmarked.value = false;

    setTimeout(() => {
        const fetchedApp = fetchAppDataById(id);
        app.value = fetchedApp;
        if (fetchedApp) {
            const bookmarkedAppsMap = loadBookmarkedAppsMap();
            isBookmarked.value = !!bookmarkedAppsMap[id];
            allRecommendedApps.value = fetchAllRecommendedApps(id);
        }
        loading.value = false;
    }, 300);
};

// --- Lifecycle and Watcher (Keep existing onMounted and watch) ---
onMounted(() => {
  const appId = Number(route.params.id);
  if (!isNaN(appId)) {
    loadAppData(appId);
  }
});

watch(() => route.params.id, (newId, oldId) => {
  const appId = Number(newId);
  if (!isNaN(appId) && newId !== oldId) {
    loadAppData(appId);
  }
});

// --- Add Use App Function --- 
const useApp = () => {
  if (!app.value) return;

  if (app.value.requiresSubscription) {
      // Redirect to plans page instead of alert
      console.log(`Subscription required for app: ${app.value.name} (ID: ${app.value.id}). Redirecting to /plans.`);
      router.push('/plans'); // Keep redirecting to plans in the current tab
  } else {
      console.log(`Using app: ${app.value.name} (ID: ${app.value.id})`);
      // Open the use page for this app in a new tab
      const url = router.resolve(`/apps/${app.value.id}/use`).href;
      window.open(url, '_blank'); 
  }
};

const formatDate = (date: Date): string => {
    // Simple date formatter (YYYY/MM/DD)
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
};

// --- Bookmark Methods --- 
const openBookmarkDialog = () => {
  bookmarkDialog.value = true;
};

// Handle events from the dialog
const handleBookmarkSaved = (payload: { appId: number; destination: string }) => {
  console.log('[id].vue: Received bookmark-saved', payload);
  // Update localStorage
  const storedApps = loadBookmarkedAppsMap();
  storedApps[payload.appId] = payload.destination;
  saveBookmarkedAppsToStorage(storedApps);
  // Update local state if it's the current app
  if (app.value && app.value.id === payload.appId) {
      isBookmarked.value = true;
  }
  // Update recommended apps list if needed
  const targetAppIndex = allRecommendedApps.value.findIndex(rec => rec.id === payload.appId);
  if (targetAppIndex !== -1) {
      allRecommendedApps.value[targetAppIndex].isBookmarked = true;
      // Force reactivity if direct modification doesn't work
      // allRecommendedApps.value = [...allRecommendedApps.value];
  }
};

const handleBookmarkRemoved = (payload: { appId: number }) => {
  console.log('[id].vue: Received bookmark-removed', payload);
  // Update localStorage
  const storedApps = loadBookmarkedAppsMap();
  if (storedApps[payload.appId]) {
    delete storedApps[payload.appId];
    saveBookmarkedAppsToStorage(storedApps);
  }
  // Update local state if it's the current app
  if (app.value && app.value.id === payload.appId) {
      isBookmarked.value = false;
  }
  // Update recommended apps list if needed
  const targetAppIndex = allRecommendedApps.value.findIndex(rec => rec.id === payload.appId);
  if (targetAppIndex !== -1) {
      allRecommendedApps.value[targetAppIndex].isBookmarked = false;
      // Force reactivity if direct modification doesn't work
      // allRecommendedApps.value = [...allRecommendedApps.value];
  }
};

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
