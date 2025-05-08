<template>
  <!-- Loading Indicator -->
  <v-row v-if="loading" justify="center" class="my-8">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-row>

  <!-- Error Message -->
  <v-row v-else-if="error" justify="center" class="my-8">
    <v-col cols="12" md="8">
      <v-alert type="error" variant="tonal">
        {{ errorMessage }}
      </v-alert>
    </v-col>
  </v-row>

  <!-- App List -->
  <v-row v-else-if="apps.length > 0" pt-0 mt-0>
    <v-col
      v-for="app in apps"
      :key="app.id"
      cols="12"
      sm="6"
      md="4"
      lg="3"
    >
      <AppCard
        :app="mapAppForCard(app)"
        @title-click="$emit('app-click', app.id)"
        @creator-click="$emit('creator-click', app.developerId)"
      />
    </v-col>
  </v-row>

  <!-- No Apps Found -->
  <v-row v-else justify="center" class="my-8">
    <v-col cols="auto">
      <p>{{ emptyMessage }}</p>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AppDto } from '~/types/app';

interface MappedAppData {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likes: number;
  dislikes: number;
  usageCount: number;
  requiresSubscription: boolean;
  creatorId: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  category?: {
    id: number;
    name: string;
  } | null;
}

interface Props {
  apps: AppDto[];
  loading?: boolean;
  error?: Error | null;
  errorMessage?: string;
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  errorMessage: 'アプリの読み込み中にエラーが発生しました',
  emptyMessage: '該当するアプリが見つかりませんでした'
});

const emit = defineEmits<{
  (e: 'app-click', appId: number): void;
  (e: 'creator-click', creatorId?: number | null): void;
}>();

// アプリカードに表示するためのデータマッピング
function mapAppForCard(app: AppDto): MappedAppData {
  return {
    id: app.id,
    name: app.name,
    description: app.description || '',
    imageUrl: app.thumbnailUrl || 'https://placehold.jp/300x300.png?text=No+Image',
    likes: app.likeCount,
    dislikes: app.dislikeCount,
    usageCount: app.usageCount,
    requiresSubscription: app.isSubscriptionLimited,
    creatorId: app.developerId || null,
    creatorName: app.developerName,
    creatorAvatarUrl: null,
    category: {
      id: app.categoryId,
      name: app.categoryName
    }
  };
}
</script> 
