<template>
  <v-app>
    <!-- シンプルなヘッダー -->
    <v-app-bar 
      flat 
      color="white" 
      elevation="1"
      height="64"
    >
      <div class="d-flex align-center justify-center w-100">
        <router-link to="/" class="text-decoration-none d-flex align-center">
          <v-icon 
            icon="mdi-cube-outline" 
            color="primary" 
            size="large" 
            class="me-2"
          ></v-icon>
          <span class="text-h6 font-weight-bold text-primary">DifyHub</span>
        </router-link>
      </div>
    </v-app-bar>
    
    <!-- メインコンテンツ -->
    <v-main>
      <v-container>
        <slot />
      </v-container>
    </v-main>
    
    <!-- シンプルなフッター -->
    <v-footer color="white" class="py-3">
      <v-container>
        <div class="text-center text-body-2 text-grey">
          <span>&copy; {{ new Date().getFullYear() }} DifyHub. All rights reserved.</span>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
// シンプルなレイアウトなのでスクリプトは最小限
</script>

<style scoped>
/* 必要に応じてスタイルをカスタマイズ */
</style> 
