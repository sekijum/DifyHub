<template>
    <v-container>
      <PageTitle title="開発者管理" />
      <v-row>
        <v-col>
          <v-card variant="outlined">

            <!-- Filter Controls Row -->
            <v-row dense class="pa-4 pt-2">
              <v-col cols="12" sm="4" md="3">
                <v-select
                  v-model="selectedStatus"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス"
                  density="compact"
                  outlined
                  hide-details
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="8" md="5">
                <v-text-field
                  v-model="search"
                  append-inner-icon="mdi-magnify"
                  label="検索 (名前, メール)"
                  single-line
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredDevelopers"
              :items-per-page="itemsPerPage"
              @update:items-per-page="updateItemsPerPage($event)"
              :sort-by="sortBy"
              @update:sort-by="updateSortBy($event)"
              :multi-sort="false"
              class="elevation-0"
              density="compact"
              :loading="loading"
              loading-text="データを読み込み中..."
              :hover="true"
              items-per-page-text="表示行数"
              :items-per-page-options="itemsPerPageOptions"
            >
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" density="compact" label>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>
              <template v-slot:item.appsCount="{ item }">
                 {{ item.appsCount ?? 0 }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-icon small class="mr-2" @click="goToEditPage(item)" title="編集">mdi-pencil</v-icon>
                <v-icon
                  v-if="item.status === 'active'"
                  small
                  @click="openDeactivateDialog(item)"
                  color="error"
                  title="停止"
                >
                  mdi-account-cancel-outline
                </v-icon>
                <v-icon
                  v-else
                  small
                  @click="openReactivateDialog(item)"
                  color="success"
                  title="有効化"
                >
                  mdi-account-check-outline
                </v-icon>
              </template>
              <template v-slot:no-data>
                条件に一致する開発者が見つかりません。
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- Deactivation Confirmation Dialog -->
      <ConfirmationDialog
        v-model="isDeactivateDialogOpen"
        title="開発者停止確認"
        :message="`開発者「${developerToModify?.name}」を停止しますか？開発者はアプリの管理や新規公開ができなくなります。`"
        confirm-text="停止する"
        confirm-color="error"
        @confirm="confirmDeactivateDeveloper"
      />
       <!-- Reactivation Confirmation Dialog (Optional) -->
      <ConfirmationDialog
        v-model="isReactivateDialogOpen"
        title="開発者有効化確認"
        :message="`開発者「${developerToModify?.name}」を再度有効化しますか？`"
        confirm-text="有効化する"
        confirm-color="success"
        @confirm="confirmReactivateDeveloper"
      />

    </v-container>
  </template>

  <script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import type { VDataTable } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  import ConfirmationDialog from '~/components/ConfirmationDialog.vue';

  definePageMeta({
    layout: 'admin',
  });

  const router = useRouter();
  const route = useRoute();

  type DeveloperStatus = 'active' | 'inactive';
  type SortItem = { key: string; order: 'asc' | 'desc' };

  // Interface for Developer data
  interface Developer {
    id: number; // User ID
    name: string;
    email: string;
    avatarUrl?: string;
    status: DeveloperStatus;
    approvedAt: string; // Date when they became a developer
    appsCount?: number; // Number of apps they published (optional)
  }

  // Initialize state from route query parameters
  const search = ref(route.query.q as string || '');
  const selectedStatus = ref<DeveloperStatus | null>(route.query.status as DeveloperStatus || null);
  const itemsPerPage = ref(Number(route.query.limit) || 10);
  const initialSortBy: SortItem[] = route.query.sort_by
      ? [{ key: route.query.sort_by as string, order: (route.query.sort_order || 'asc') as 'asc' | 'desc' }]
      : [{ key: 'id', order: 'asc' }]; // Default sort
  const sortBy = ref<SortItem[]>(initialSortBy);

  // Options for items-per-page selector
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];

  const loading = ref(false);
  const isDeactivateDialogOpen = ref(false);
  const isReactivateDialogOpen = ref(false);
  const developerToModify = ref<Developer | null>(null);

  // Define header type explicitly
  type ReadonlyHeaders = VDataTable['$props']['headers'];

  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80 },
    { title: '名前', key: 'name', align: 'start', sortable: false },
    { title: 'メールアドレス', key: 'email', align: 'start', sortable: false },
    { title: '公開アプリ数', key: 'appsCount', align: 'center', width: 100 },
    { title: 'ステータス', key: 'status', align: 'center', width: 120 },
    { title: '承認日', key: 'approvedAt', align: 'start', width: 150 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
  ];

  // Status options for the select dropdown
  const statusOptions = ref([
      { title: '有効', value: 'active' },
      { title: '停止中', value: 'inactive' },
  ]);

  // Generate sample developer data (approved developers)
  const generateSampleDevelopers = (count: number): Developer[] => {
    const developersList: Developer[] = [];
    const firstNames = ['承認済 太郎', 'アクティブ 花子', '開発者 鈴木', 'クリエイター 高橋', 'システム 山本'];
    const lastNames = ['ユーザー', '開発者', 'クリエイター', 'エンジニア', 'メンバー'];
    const domains = ['dev.example.com', 'creator.sample.net', 'approved.mail.org', 'active.test.co.jp', 'sys.dummy.jp'];
    const statuses: DeveloperStatus[] = ['active', 'active', 'active', 'inactive', 'active']; // Mostly active

    for (let i = 1; i <= count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase().split(' ')[0]}.${lastName.toLowerCase()}${i}@${domains[Math.floor(Math.random() * domains.length)]}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const approvedDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Within last year
      const avatarSuffix = Math.floor(Math.random() * 50) + 1; // Random avatar number

      developersList.push({
        id: i,
        name,
        email,
        avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${avatarSuffix}.jpg`,
        status,
        approvedAt: approvedDate.toISOString().substring(0, 10), // YYYY-MM-DD
        appsCount: status === 'active' ? Math.floor(Math.random() * 25) : 0,
      });
    }
    return developersList;
  };

  const developers = ref<Developer[]>(generateSampleDevelopers(35)); // Generate sample data

  // Computed property to filter developers
  const filteredDevelopers = computed(() => {
    return developers.value.filter(dev => {
      const statusMatch = !selectedStatus.value || dev.status === selectedStatus.value;
      const searchMatch = !search.value ||
                          dev.name.toLowerCase().includes(search.value.toLowerCase()) ||
                          dev.email.toLowerCase().includes(search.value.toLowerCase());
      return statusMatch && searchMatch;
    });
  });

  // Function to update URL query parameters including sorting
  const updateQueryParameters = () => {
    const query: Record<string, any> = {};
    if (selectedStatus.value) query.status = selectedStatus.value;
    if (itemsPerPage.value !== 10) query.limit = itemsPerPage.value;
    if (search.value) query.q = search.value;

    const currentSort = sortBy.value[0];
    if (currentSort && (currentSort.key !== 'id' || currentSort.order !== 'asc')) {
       query.sort_by = currentSort.key;
       query.sort_order = currentSort.order;
    }

    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
        router.replace({ query });
    }
  };

  // Watch filters and sorting, then update query
  watch([selectedStatus, search, sortBy], updateQueryParameters, { deep: true });

  // Handler for items-per-page update
  const updateItemsPerPage = (value: number) => {
    itemsPerPage.value = value;
    updateQueryParameters();
  };

  // Handler for sort update
  const updateSortBy = (newSortBy: SortItem[]) => {
    sortBy.value = newSortBy;
  };

  // Helper function to get status text
  const getStatusText = (status: DeveloperStatus): string => {
    return status === 'active' ? '有効' : '停止中';
  };

  // Function to determine chip color based on status
  const getStatusColor = (status: DeveloperStatus): string => {
    return status === 'active' ? 'green' : 'grey';
  };

  // --- Actions ---
  const goToEditPage = (developer: Developer) => {
    // Navigate to the user edit page for this developer's user ID
    router.push(`/admin/users/${developer.id}/edit`);
    // Or create a dedicated /admin/developers/[id]/edit page if needed
  };

  // Deactivate actions
  const openDeactivateDialog = (developer: Developer) => {
    developerToModify.value = developer;
    isDeactivateDialogOpen.value = true;
  };

  const confirmDeactivateDeveloper = () => {
    if (developerToModify.value) {
      console.log('Deactivating developer:', developerToModify.value);
      // TODO: Replace with actual API call to update status
      const index = developers.value.findIndex(d => d.id === developerToModify.value!.id);
      if (index !== -1) {
        developers.value[index].status = 'inactive';
      }
      developerToModify.value = null;
    }
    isDeactivateDialogOpen.value = false;
  };

  // Reactivate actions (Optional)
  const openReactivateDialog = (developer: Developer) => {
    developerToModify.value = developer;
    isReactivateDialogOpen.value = true;
  };

  const confirmReactivateDeveloper = () => {
     if (developerToModify.value) {
      console.log('Reactivating developer:', developerToModify.value);
      // TODO: Replace with actual API call to update status
      const index = developers.value.findIndex(d => d.id === developerToModify.value!.id);
      if (index !== -1) {
        developers.value[index].status = 'active';
      }
      developerToModify.value = null;
    }
    isReactivateDialogOpen.value = false;
  };

  // TODO: Implement fetchDevelopers function to get real data
  // onMounted(async () => {
  //   loading.value = true;
  //   // developers.value = await fetchDevelopers(); // Replace with API call
  //   loading.value = false;
  // });

  </script>

  <style scoped>
  .v-data-table {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
  </style> 
