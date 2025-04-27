<template>
  <v-app class="main-container">
    <!-- Desktop Navigation Drawer (Permanent) -->
    <v-navigation-drawer
      v-if="!isMobile"
      app
      permanent
      
      >
      <DeveloperSidebar v-model:opened="open" />
    </v-navigation-drawer>

    <!-- Mobile Navigation Drawer (Temporary) -->
    <v-navigation-drawer
      v-if="isMobile"
      v-model="drawer"
      app
      temporary
      >
      <AdminSidebarNav v-model:opened="open" />
    </v-navigation-drawer>

    <!-- Header -->
    <DeveloperHeader @toggle-drawer="toggleDrawer" />

    <!-- Main Content -->

    <v-main><NuxtPage /></v-main>

    <!-- Footer or other layout elements -->
    <!-- <MenuModal /> -->
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHead } from '#app'; // Correct import for useHead
import { useDisplay } from 'vuetify'; // Import useDisplay
import DeveloperHeader from '~/components/DeveloperHeader.vue'; // Import AdminHeader instead of Header
import DeveloperSidebar from '~/components/DeveloperSidebar.vue';
// Removed: import { useNuxtApp } from '#app'

// Set the page title for admin layout
useHead({
  title: 'DifyHub | Admin',
  // Optional: You can use titleTemplate if you want a specific format
  // titleTemplate: (titleChunk) => {\n  //   return titleChunk ? `${titleChunk} - DifyHub Admin` : 'DifyHub Admin';\n  // }\n});
});

// Removed: const { $vuetify } = useNuxtApp()
const open = ref([]); // Add ref for v-list-group open state

const { mobile } = useDisplay(); // Use useDisplay to get mobile status

const drawer = ref(false); // Initialize drawer as closed by default

// Computed property to check if the screen is mobile size
const isMobile = computed(() => {
  console.log('Vuetify mobile ref:', mobile.value);
  return mobile.value; // Directly use the mobile ref
});

// Set initial drawer state after component is mounted (client-side)
onMounted(() => {
  console.log('Component mounted. Initial isMobile value:', isMobile.value);
  // Set open on desktop, closed on mobile based on computed prop
  if (!isMobile.value) { // Only set to true on desktop
    drawer.value = true;
    console.log('Setting drawer to true on desktop');
  } else {
    console.log('Keeping drawer closed on mobile');
  }
});

// Function to toggle the drawer state
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};
</script>

<style scoped>
.main-container {
  overflow: hidden;
}
</style>
