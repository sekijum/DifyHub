<template>
  <v-app-bar app color="primary" dark>
    <!-- モバイルでのみ表示 -->
    <v-app-bar-nav-icon
      v-if="$vuetify.display.mdAndDown"
      @click="emitToggleDrawer"
    ></v-app-bar-nav-icon>

    <v-toolbar-title style="cursor: pointer;" @click="goToHome">
      DifyHub
    </v-toolbar-title>
    <v-spacer></v-spacer>

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

// Navigate to home page
const goToHome = () => {
  router.push('/');
};

// Navigate to sign in page
const signIn = () => {
  router.push('/signin');
};

// Navigate to sign up page
const signUp = () => {
  router.push('/signup');
};
</script>

<style scoped>
/* Add any specific styles for the header here */
</style> 
