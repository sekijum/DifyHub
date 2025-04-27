<template>
  <v-list v-model:opened="internalOpen" density="compact" nav>
    <v-list-item 
      :title="userEmail" 
    >
      <template v-slot:subtitle>
        <v-chip color="blue" size="small" class="mr-1 my-1" variant="flat">{{ userRoleDisplay }}</v-chip>
        <v-chip color="green" size="small" class="my-1" variant="flat">{{ userPlanDisplay }}</v-chip>
      </template>
    </v-list-item>
    <v-divider></v-divider>

    <v-list-item prepend-icon="mdi-home-city" title="ホーム" value="home" to="/" :active="route.path === '/'"></v-list-item>
    <v-list-item prepend-icon="mdi-star-outline" title="高く評価したアプリ" value="liked" to="/liked" :active="route.path === '/liked'"></v-list-item>
    <v-list-item prepend-icon="mdi-bookmark-multiple-outline" title="ブックマーク" value="bookmarks" to="/bookmarks" :active="route.path === '/bookmarks'"></v-list-item>
    <v-list-item prepend-icon="mdi-account" title="マイページ" value="account" to="/mypage" :active="route.path.startsWith('/mypage')"></v-list-item>

    <!-- Add Notifications Link -->
    <v-list-item prepend-icon="mdi-bell-outline" title="お知らせ" value="notifications" to="/notifications" :active="route.path.startsWith('/notifications')"></v-list-item>

    <!-- Add Developer Admin Link -->
    <v-list-item prepend-icon="mdi-developer-board" title="開発者管理画面" value="developer-admin" to="/developer" :active="route.path.startsWith('/developer')"></v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-item prepend-icon="mdi-login" title="サインイン" value="signin" to="/signin" :active="route.path === '/signin'"></v-list-item>
    <v-list-item prepend-icon="mdi-account-plus" title="サインアップ" value="signup" to="/signup" :active="route.path === '/signup'"></v-list-item>
    <v-list-item prepend-icon="mdi-logout" title="サインアウト" value="signout" @click="handleSignOut"></v-list-item>

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
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// --- State for User Info --- 
const userEmail = ref('user@example.com'); // Placeholder
const userRoleDisplay = ref('開発者');    // Placeholder (e.g., '一般ユーザー', '開発者')
const userPlanDisplay = ref('Free');  // Placeholder (e.g., 'Free', 'Pro')

// --- Simulate fetching user info --- 
// In a real app, fetch this data after login or on component mount
onMounted(() => {
  console.log('SidebarNav: Simulating fetch user role and plan...');
  // Replace with actual data fetching logic
  // userEmail.value = fetchedUserData.email;
  // userRoleDisplay.value = fetchedUserData.isDeveloper ? '開発者' : '一般ユーザー';
  // userPlanDisplay.value = fetchedUserData.planName; // Should be 'Free' or 'Pro'
});

const props = defineProps<{ opened: string[] }>();
const emit = defineEmits(['update:opened']);

const internalOpen = computed({
  get: () => props.opened,
  set: (value) => emit('update:opened', value)
});

const handleSignOut = () => {
  console.log('Sign out clicked');
  alert('サインアウトしました。');
};
</script>

<style scoped>
/* Add specific styles for SidebarNav if needed */
</style> 
