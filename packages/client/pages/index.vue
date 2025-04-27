<template>
  <v-container fluid pt-0 mt-0 pa-0>
    <!-- Notification Section -->
    <v-row pt-0 mt-0 px-4 pt-4>
      <!-- Developer Promotion Alert -->
      <v-col cols="12" class="pb-0">
        <v-alert
          type="success" 
          title="開発者になってアプリを公開しませんか？"
          variant="tonal"
          prominent
          border="start"
          density="compact"
        >
          作成したアプリを世界中のユーザーに届け、収益化するチャンスです。
          <template v-slot:append>
            <v-btn 
              color="success" 
              variant="outlined" 
              size="small"
              to="/developer/apply"
              class="ml-4"
              style="text-transform: none;"
            >
              開発者申請へ
            </v-btn>
          </template>
        </v-alert>
      </v-col>

      <!-- Security Announcement Alert -->
      <v-col cols="12">
        <v-alert
          type="info"
          title="セキュリティ強化のお知らせ"
          variant="tonal"
          prominent
          border="start"
          density="compact"
        >
          セキュリティ向上のため、一部の決済処理において3Dセキュア（本人認証サービス）による追加認証が必要になる場合がございます。ご理解とご協力をお願いいたします。
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
            <v-chip key="all" :value="null" filter>すべて</v-chip>
            <v-chip
               v-for="category in categories"
               :key="category"
               :value="category"
               filter
            >
               {{ category }}
            </v-chip>
         </v-chip-group>
      </v-col>
    </v-row>

    <v-row pt-0 mt-0>
      <v-col
        v-for="app in paginatedApps"
        :key="app.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <AppCard 
          :app="app" 
          @title-click="goToAppDetail(app.id)"
          :creator-name="app.creatorName" 
          :creator-avatar-url="app.creatorAvatarUrl"
          @creator-click="goToUserProfile"
          :positive-rating-rate="app.positiveRatingRate"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
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
import AppSearch from '~/components/AppSearch.vue';

interface App {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likes: number;
  category: string;
  publishedDate: Date;
  usageCount: number;
  requiresSubscription: boolean;
  creatorId?: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string;
  positiveRatingRate?: number; // 0 to 1
  dislikes?: number;
}


// カテゴリーリスト更新
const baseCategories = ['仕事効率化', 'エンタメ', '開発ツール', 'コミュニケーション', 'ユーティリティ'];
const dummyCategories = Array.from({ length: 10 }, (_, i) => `業務効率化 ${i + 1}`);
const categories = ['トレンド', '最新', ...baseCategories, ...dummyCategories];

const apps = ref<App[]>(Array.from({ length: 100 }, (_, i) => {
    const appId = i + 1;
    const publishedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const category = baseCategories[i % baseCategories.length];
    const baseDesc = `これはアプリ${appId}の説明です。カテゴリは${category}です。様々な機能があり、日々の業務を効率化します。`;
    const additionalDesc = `さらに多くの機能や使い方があり、ユーザーの多様なニーズに応えることができます。定期的なアップデートにより新機能が追加され、セキュリティも強化されています。直感的なインターフェースで、初心者から上級者まで幅広く利用可能です。`; 
    let fullDescription = baseDesc + additionalDesc;
    while (fullDescription.length < 200) { 
        fullDescription += " 追加情報。";
    }

    const description = fullDescription.length > 100
      ? fullDescription.substring(0, 100) + '...'
      : fullDescription;
    
    // Dummy creator data
    const creators = ['田中 太郎', '佐藤 花子', 'システム', '鈴木 一郎'];
    const creatorIds = [1, 2, null, 3];
    const avatars = [
        'https://randomuser.me/api/portraits/men/5.jpg',
        'https://randomuser.me/api/portraits/women/6.jpg',
        undefined,
        'https://randomuser.me/api/portraits/men/7.jpg'
    ];
    const creatorIndex = i % creators.length;
    const creatorId = creatorIds[creatorIndex];
    const creatorName = creators[creatorIndex];
    const creatorAvatarUrl = avatars[creatorIndex];

    const likes = Math.floor(Math.random() * 5000);
    const dislikes = Math.floor(Math.random() * likes * 0.5); // Add random dislikes

    return {
      id: appId,
      name: `アプリ ${appId}`,
      description: description,
      imageUrl: `https://placehold.jp/300x300.png?text=App+${appId}`,
      likes: likes,
      dislikes: dislikes,
      category: category,
      publishedDate: publishedDate,
      usageCount: Math.floor(Math.random() * 100000),
      requiresSubscription: appId % 10 === 0,
      creatorId: creatorId,
      creatorName: creatorName,
      creatorAvatarUrl: creatorAvatarUrl,
      positiveRatingRate: Math.random() * 0.6 + 0.4 // Generate random rate between 0.4 and 1.0
    }
}));

const router = useRouter();
const searchQuery = ref('');
const selectedCategory = ref<string | null>('トレンド'); // デフォルトをトレンドに変更
const currentPage = ref(1);
const itemsPerPage = 40;

// フィルタリングとソートを適用したアプリリスト
const filteredAndSortedApps = computed(() => {
  let result = apps.value;

  // 検索フィルタ
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    result = result.filter(app => 
      app.name.toLowerCase().includes(lowerCaseQuery) ||
      app.description.toLowerCase().includes(lowerCaseQuery)
    );
  }

  // カテゴリーフィルタ (トレンド/最新/すべて 以外の場合)
  if (selectedCategory.value && selectedCategory.value !== 'トレンド' && selectedCategory.value !== '最新') {
    result = result.filter((app) => app.category === selectedCategory.value);
  }

  // ソートロジック: 最新が選択されている場合のみ日付順、それ以外は人気順
  if (selectedCategory.value === '最新') {
    result.sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
  } else {
    result.sort((a, b) => b.likes - a.likes);
  }

  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredAndSortedApps.value.length / itemsPerPage);
});

const paginatedApps = computed(() => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1;
  } else if (totalPages.value === 0) {
      currentPage.value = 1;
  }

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAndSortedApps.value.slice(start, end);
});

const goToAppDetail = (appId: number) => {
  router.push(`/apps/${appId}`);
};

const goToUserProfile = (creatorId: number) => {
  router.push(`/users/${creatorId}`);
};
</script>

<style scoped>
/* Add any specific styles for the index page here */
</style>
