<template>
  <v-card class="d-flex flex-column fill-height">
    <div style="position: relative;" class="flex-grow-0">
      <!-- Rating Bar (Using positiveRatingRate) -->
      <v-progress-linear
        v-if="positiveRatingRate !== null" 
        :model-value="positiveRatingRate * 100" 
        :max="100" 
        color="blue" 
        height="3"
        rounded
        bg-color="red-darken-2" 
        bg-opacity="1" 
        style="position: absolute; top: 0; left: 0; width: 100%; z-index: 1;"
      ></v-progress-linear>
      <v-img
        :src="app.imageUrl"
        height="150px"
        cover
        @click="emitTitleClick"
        style="cursor: pointer;"
      ></v-img>
      <v-chip
        v-if="app.requiresSubscription"
        size="x-small"
        color="warning"
        variant="flat"
        class="font-weight-medium"
        style="position: absolute; top: 8px; right: 4px;"
      >
        サブスクリプション限定
      </v-chip>
    </div>
    <div class="pa-2 d-flex flex-column flex-grow-1" style="position: relative;">
        <!-- ★ Category Chip -->
        <v-chip 
          v-if="app.category?.name"
          size="x-small"
          color="secondary"
          variant="tonal"
          class="mb-1 mr-1 align-self-start" 
          style="max-width: 90%;" 
        >
          <span class="text-truncate">{{ app.category.name }}</span>
        </v-chip>
        <v-card-title
          @click="emitTitleClick"
          style="cursor: pointer; padding: 0; line-height: 1.3; padding-right: 30px;"
          class="text-subtitle-1 font-weight-bold text-truncate mb-1 flex-grow-0"
        >
          {{ app.name }}
        </v-card-title>
        <div class="d-flex align-center mb-1 flex-grow-0">
            <span class="text-caption">利用回数: {{ app.usageCount?.toLocaleString() ?? 0 }}</span>
        </div>

        <!-- Creator Info -->
        <div 
          v-if="app.creatorName && app.creatorId"
          class="d-flex align-center mt-1 mb-1 flex-grow-0"
          @click="emitCreatorClick"
          style="cursor: pointer;"
        >
          <v-avatar size="20" class="mr-1">
            <v-img v-if="app.creatorAvatarUrl" :src="app.creatorAvatarUrl">
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5" size="16"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <v-icon v-else size="small">mdi-account-circle</v-icon>
          </v-avatar>
          <span class="text-caption text-truncate">{{ app.creatorName }}</span>
        </div>

        <v-card-text class="pa-0 pt-1 flex-grow-1" style="line-height: 1.4;">
            {{ truncatedDescription }}
        </v-card-text>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';

interface App {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likes: number;
  dislikes?: number;
  usageCount: number;
  requiresSubscription: boolean;
  creatorId?: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  category?: { id: number; name: string } | null;
}

const props = defineProps({
  app: {
    type: Object as PropType<App>,
    required: true,
  },
});

const emit = defineEmits(['title-click', 'creator-click']);

const emitTitleClick = () => {
  emit('title-click');
};

const emitCreatorClick = () => {
  if (props.app.creatorId) {
    emit('creator-click', props.app.creatorId);
  }
};

const truncatedDescription = computed(() => {
  const desc = props.app.description;
  if (desc && desc.length > 150) {
    return desc.substring(0, 150) + '...';
  }
  return desc;
});

// ★ Add computed property for positive rating rate
const positiveRatingRate = computed<number | null>(() => {
  const likes = props.app.likes;
  const dislikes = props.app.dislikes ?? 0; // Default dislikes to 0 if undefined

  // Ensure both are valid numbers
  if (typeof likes !== 'number' || typeof dislikes !== 'number') {
    return null; // Cannot calculate if values are not numbers
  }

  const total = likes + dislikes;
  if (total === 0) {
    return null; // Avoid division by zero and show nothing if no ratings
  }
  
  return likes / total; // Returns value between 0 and 1
});

</script>

<style scoped>
</style> 
