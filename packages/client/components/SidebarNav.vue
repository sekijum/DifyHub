<template>
  <v-list v-model:opened="internalOpen" density="compact" nav>
    <!-- User Info Section -->
    <template v-if="payload.isLoggedIn && payload.user">
      <v-list-item :title="payload.user.email">
      </v-list-item>
    </template>
    <template v-else>
        <v-list-item title="ゲスト" subtitle="サインインしてください"></v-list-item>
    </template>
    <v-divider></v-divider>

    <!-- Common Links -->
    <v-list-item prepend-icon="mdi-home-city" title="ホーム" value="home" to="/" :active="route.path === '/'"></v-list-item>

    <!-- Logged In Specific Links -->
    <template v-if="payload.isLoggedIn">
      <v-list-item prepend-icon="mdi-star-outline" title="高く評価したアプリ" value="mypage-liked" to="/mypage/liked" :active="route.path === '/mypage/liked'"></v-list-item>
      <v-list-item prepend-icon="mdi-bookmark-multiple-outline" title="ブックマーク" value="mypage-bookmarks" to="/mypage/bookmarks" :active="route.path === '/mypage/bookmarks'"></v-list-item>
      <v-list-item prepend-icon="mdi-account" title="マイページ" value="account" to="/mypage" :active="route.path === '/mypage'"></v-list-item>
    </template>
    <v-list-item prepend-icon="mdi-bell-outline" title="お知らせ" value="notifications" to="/notifications" :active="route.path.startsWith('/notifications')"></v-list-item>

    <!-- Developer/Admin Link -->
    <v-list-item
      v-if="payload.isLoggedIn && (payload.isDeveloper)"
      prepend-icon="mdi-developer-board"
      title="開発者管理画面"
      value="developer-admin"
      to="/developer"
      :active="route.path.startsWith('/developer')"
    ></v-list-item>

    <!-- Developer/Admin Link -->
    <v-list-item
      v-if="payload.isLoggedIn && (payload.isAdministrator)"
      prepend-icon="mdi-view-dashboard-outline"
      title="管理画面"
      value="admin-dashboard"
      to="/admin"
      :active="route.path.startsWith('/admin')"
    ></v-list-item>

    <v-divider class="my-2"></v-divider>

    <!-- Auth Links -->
    <template v-if="!payload.isLoggedIn">
      <v-list-item prepend-icon="mdi-login" title="サインイン" value="signin" to="/signin" :active="route.path === '/signin'"></v-list-item>
      <v-list-item prepend-icon="mdi-account-plus" title="サインアップ" value="signup" to="/signup" :active="route.path === '/signup'"></v-list-item>
    </template>
    <template v-else>
      <v-list-item prepend-icon="mdi-logout" title="サインアウト" value="signout" @click="handleSignOut"></v-list-item>
    </template>

    <!-- Service Info Section (always visible) -->
    <v-divider class="my-2"></v-divider>
    <v-list-subheader>サービス情報</v-list-subheader>
    <v-list-group value="サービス">
       <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          prepend-icon="mdi-apps"
          title="サービス"
        ></v-list-item>
      </template>
      <v-list-item prepend-icon="mdi-lightbulb-on-outline" title="機能紹介" value="features" to="/features" :active="route.path === '/features'"></v-list-item>
      <v-list-item prepend-icon="mdi-credit-card-outline" title="料金プラン" value="plans" to="/plans" :active="route.path === '/plans'"></v-list-item>
    </v-list-group>

    <!-- Support Section (always visible) -->
    <v-list-group value="サポート">
      <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          prepend-icon="mdi-face-agent"
          title="サポート"
        ></v-list-item>
      </template>
      <v-list-item prepend-icon="mdi-help-circle-outline" title="FAQ" value="help" to="/faq" :active="route.path === '/faq'"></v-list-item>
      <v-list-item prepend-icon="mdi-email-fast-outline" title="お問い合わせ" value="contact" to="/contact" :active="route.path === '/contact'"></v-list-item>
    </v-list-group>

    <!-- Other Links Section (always visible) -->
    <v-list-group value="その他">
       <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          prepend-icon="mdi-dots-horizontal-circle-outline"
          title="その他"
        ></v-list-item>
      </template>
      <v-list-item prepend-icon="mdi-file-document-outline" title="利用規約" value="terms" to="/terms" :active="route.path === '/terms'"></v-list-item>
      <v-list-item prepend-icon="mdi-shield-lock-outline" title="プライバシーポリシー" value="privacy" to="/privacy" :active="route.path === '/privacy'"></v-list-item>
      <v-list-item prepend-icon="mdi-gavel" title="特定商取引法に基づく表記" value="legal" to="/legal" :active="route.path === '/legal'"></v-list-item>
      <v-list-item prepend-icon="mdi-file-code-outline" title="開発者利用規約" value="developer-terms" to="/developer-terms" :active="route.path === '/developer-terms'"></v-list-item>
    </v-list-group>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app'; // useNuxtApp をインポート

const route = useRoute();
const { payload } = useNuxtApp(); // payload を取得

// --- Computed Properties for Display --- 
const userRoleDisplay = computed(() => {
  // ユーザーがない、またはroleがない場合は空文字を返す
  if (!payload.user) return '';
  if (!payload.user.role) return '';
  
  try {
    switch (payload.user.role) {
      case 'ADMINISTRATOR': return '管理者';
      case 'DEVELOPER': return '開発者';
      case 'USER': return 'ユーザー';
      default: return payload.user.role; // Unknown role
    }
  } catch (error) {
    console.error('Error in userRoleDisplay:', error);
    return payload.user.role || ''; // Fallback
  }
});

// --- Props and Emits for v-list open state ---
const props = defineProps<{ opened: string[] }>();
const emit = defineEmits(['update:opened']);

const internalOpen = computed({
  get: () => props.opened,
  set: (value) => emit('update:opened', value)
});

// --- Methods ---
const handleSignOut = async () => {
  const { $storage } = useNuxtApp();
  console.log('Signing out...');
  try {
    // Remove the access token from storage
    $storage.removeItem('access_token');
    
    // Redirect to the home page after sign out
    await navigateTo('/');
  } catch (error) {
    console.error('Error during sign out:', error);
    alert('サインアウト中にエラーが発生しました。');
  }
};
</script>

<style scoped>
/* Add specific styles for SidebarNav if needed */
</style> 
