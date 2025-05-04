<template>
  <v-list v-model:opened="internalOpen" density="compact" nav>
    <v-list-item prepend-icon="mdi-view-dashboard-outline" title="ダッシュボード" value="admin-dashboard" to="/admin" :active="route.path === '/admin'"></v-list-item>
    
    <v-list-item prepend-icon="mdi-account-tie" title="管理者管理" value="admin-administrators" to="/admin/administrators" :active="route.path.startsWith('/admin/administrators')"></v-list-item>
    <v-list-item prepend-icon="mdi-account-check-outline" title="開発者管理" value="admin-developers" to="/admin/developers" :active="route.path.startsWith('/admin/developers')"></v-list-item>
    <v-list-item prepend-icon="mdi-account-hard-hat-outline" title="開発者申請管理" value="admin-developer-requests" to="/admin/developer-requests" :active="route.path.startsWith('/admin/developer-requests')"></v-list-item>
    <v-list-item prepend-icon="mdi-account-group-outline" title="ユーザー管理" value="admin-users" to="/admin/users" :active="route.path.startsWith('/admin/users')"></v-list-item>
    <v-list-item prepend-icon="mdi-apps" title="アプリ管理" value="admin-apps" to="/admin/apps" :active="route.path.startsWith('/admin/apps')"></v-list-item>
    <v-list-item prepend-icon="mdi-credit-card-outline" title="プラン管理" value="admin-plans" to="/admin/plans" :active="route.path.startsWith('/admin/plans')"></v-list-item>
    <v-list-item prepend-icon="mdi-bell-outline" title="お知らせ管理" value="admin-notifications" to="/admin/notifications" :active="route.path.startsWith('/admin/notifications')"></v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-subheader>設定</v-list-subheader>
    <v-list-item prepend-icon="mdi-cogs" title="アプリ全体設定" value="admin-setting" to="/admin/setting" :active="route.path.startsWith('/admin/setting')"></v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-item prepend-icon="mdi-logout" title="サインアウト" value="admin-signout" @click="handleSignOut"></v-list-item>

    <v-divider class="my-2"></v-divider>
    <v-list-item prepend-icon="mdi-arrow-left" title="サイトに戻る" value="back-to-site" to="/"></v-list-item>

  </v-list>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps<{ opened: string[] }>();
const emit = defineEmits(['update:opened']);

// Sync with parent's v-model
const internalOpen = computed({
  get: () => props.opened,
  set: (value) => emit('update:opened', value)
});

// Placeholder sign out function (adjust as needed)
const handleSignOut = () => {
  console.log('Admin Sign out clicked');
  // TODO: Implement admin sign-out logic
  alert('管理画面からサインアウトしました。');
  // Likely redirect to admin sign-in or main site
  // useRouter().push('/admin/signin'); or useRouter().push('/');
};

</script>

<style scoped>
/* Styles for AdminSidebarNav */
</style> 
