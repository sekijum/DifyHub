<template>
  <v-app-bar app color="grey-lighten-4" border>
    <!-- モバイルでのみ表示 -->
    <v-app-bar-nav-icon
      v-if="$vuetify.display.mdAndDown"
      @click="emitToggleDrawer"
    ></v-app-bar-nav-icon>

    <v-toolbar-title style="cursor: pointer;" @click="goToAdminHome">
      DifyHub <span class="font-weight-light text-grey-darken-1">Admin</span>
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <!-- Add admin specific buttons/menus here if needed -->

  </v-app-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const emit = defineEmits(['toggle-drawer']);

// Emit event to toggle the drawer in the parent layout
const emitToggleDrawer = () => {
  emit('toggle-drawer');
};

// Navigate to admin home page
const goToAdminHome = () => {
  router.push('/admin');
};

</script>

<style scoped>
/* Add any specific styles for the admin header here */
</style> 
