<template>
  <v-list v-model:opened="internalOpen" density="compact" nav>
    <v-list-item prepend-icon="mdi-view-dashboard-outline" title="ダッシュボード" value="admin-dashboard" to="/developer" :active="route.path === '/developer'"></v-list-item>

    <v-list-item prepend-icon="mdi-apps" title="アプリ管理" value="admin-apps" to="/developer/apps" :active="route.path.startsWith('/developer/apps')"></v-list-item>
    <v-list-item prepend-icon="mdi-currency-usd" title="収益レポート" value="earnings" to="/developer/earnings" :active="route.path === '/developer/earnings'"></v-list-item>
    <v-list-item prepend-icon="mdi-account-edit-outline" title="プロフィール編集" value="profile-edit" to="/developer/profile" :active="route.path === '/developer/profile'"></v-list-item>

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
  console.log('Developer Sign out clicked');
  // TODO: Implement admin sign-out logic
  alert('管理画面からサインアウトしました。');
  // Likely redirect to developer sign-in or main site
  // useRouter().push('/developer/signin'); or useRouter().push('/');
};

</script>
