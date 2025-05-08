<template>
  <v-row pt-0 mt-0 px-4 pt-4>
    <!-- Loading Indicator for Notifications -->
    <v-col v-if="loading" cols="12">
      <v-progress-linear indeterminate color="primary" height="4"></v-progress-linear>
    </v-col>

    <!-- Error Alert for Notifications -->
    <v-col v-else-if="error" cols="12">
      <v-alert
        type="warning"
        variant="tonal"
        density="compact"
        border="start"
        :text="error"
      ></v-alert>
    </v-col>

    <!-- Display Notifications -->
    <v-col
      v-else-if="notifications.length > 0"
      v-for="notification in notifications"
      :key="notification.id"
      cols="12"
    >
      <v-alert
        :type="notification.level.toLowerCase() as any" 
        :title="notification.title"
        variant="tonal"
        prominent
        border="start"
        density="compact"
      >
        <span style="white-space: pre-wrap;">{{ notification.content }}</span>
        <!-- スロットを介して追加コンテンツを許可 -->
        <template v-if="$slots.append" v-slot:append>
          <slot name="append" :notification="notification"></slot>
        </template>
      </v-alert>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { NotificationItem } from '~/types/notification';

interface Props {
  notifications: NotificationItem[];
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
});
</script> 
