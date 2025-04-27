<template>
    <v-container>
        <div class="d-flex justify-space-between align-center mb-4">
        <PageTitle title="管理者管理" />
        <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" to="/admin/administrators/new">
          新規登録
        </v-btn>
      </div>
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
              <!-- TODO: Add filter by Role if implemented -->
            </v-row>
  
            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredAdmins"
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
              <!-- Custom slot for admin name and email -->
               <template v-slot:item.adminUser="{ item }">
                  <div class="d-flex align-center py-1">
                     <v-avatar size="32" class="mr-2">
                      <!-- Assuming admins might have avatars stored in user profiles -->
                      <v-img :src="item.avatarUrl" v-if="item.avatarUrl">
                        <template v-slot:placeholder>
                          <v-row class="fill-height ma-0" align="center" justify="center">
                            <v-progress-circular indeterminate color="grey-lighten-5" size="20"></v-progress-circular>
                          </v-row>
                        </template>
                      </v-img>
                      <v-icon v-else>mdi-account-tie</v-icon> <!-- Admin icon -->
                    </v-avatar>
                    <div>
                      <div>{{ item.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                    </div>
                  </div>
                </template>
  
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" density="compact" label>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>
              <!-- Add Role column if needed -->
              <!-- <template v-slot:item.role="{ item }">
                  {{ item.role ?? '一般管理者' }}
              </template> -->
  
              <template v-slot:item.actions="{ item }">
                <!-- Link to user edit page -->
                <v-icon small class="mr-2" @click="goToEditPage(item)" title="編集">mdi-pencil</v-icon>
                <!-- Deactivate/Reactivate action -->
                 <v-icon
                   v-if="item.status === 'active'"
                   small
                   class="mr-2"
                   @click="openDeactivateDialog(item)"
                   color="warning"
                   title="停止"
                 >
                   mdi-account-cancel-outline
                 </v-icon>
                  <v-icon
                   v-else
                   small
                   class="mr-2"
                   @click="openReactivateDialog(item)"
                   color="success"
                   title="有効化"
                 >
                   mdi-account-check-outline
                 </v-icon>
                 <!-- Delete Action -->
                 <v-icon
                   small
                   @click="openDeleteDialog(item)"
                   color="error"
                   title="削除"
                 >
                   mdi-delete
                 </v-icon>
              </template>
               <template v-slot:no-data>
                  条件に一致する管理者が見つかりません。
               </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Deactivation Confirmation Dialog -->
      <ConfirmationDialog
        v-model="isDeactivateDialogOpen"
        title="管理者停止確認"
        :message="`管理者「${adminToModify?.name}」を停止しますか？対象の管理者はログインできなくなります。`"
        confirm-text="停止する"
        confirm-color="error"
        @confirm="confirmDeactivateAdmin"
      />
       <!-- Reactivation Confirmation Dialog -->
      <ConfirmationDialog
        v-model="isReactivateDialogOpen"
        title="管理者有効化確認"
        :message="`管理者「${adminToModify?.name}」を再度有効化しますか？`"
        confirm-text="有効化する"
        confirm-color="success"
        @confirm="confirmReactivateAdmin"
      />
      <!-- Delete Confirmation Dialog -->
       <ConfirmationDialog
        v-model="isDeleteDialogOpen"
        title="管理者削除確認"
        :message="`管理者「${adminToDelete?.name}」を完全に削除しますか？この操作は元に戻せません。`"
        confirm-text="削除する"
        confirm-color="error"
        @confirm="confirmDeleteAdmin"
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
  
  // --- Types and Interfaces ---
  type SortItem = { key: string; order: 'asc' | 'desc' };
  type AdminStatus = 'active' | 'inactive';
  // Add Role type if you implement roles
  // type AdminRole = 'super_admin' | 'content_manager' | 'support';
  
  interface AdminUser {
    id: number; // User ID
    name: string;
    email: string;
    avatarUrl?: string;
    status: AdminStatus;
    // role?: AdminRole; // Optional: Add admin role
    registeredAt: string; // Or last login, etc.
  }
  
  // --- State Initialization ---
  const search = ref(route.query.q as string || '');
  const selectedStatus = ref<AdminStatus | null>(route.query.status as AdminStatus || null);
  const itemsPerPage = ref(Number(route.query.limit) || 10);
  const initialSortBy: SortItem[] = route.query.sort_by
      ? [{ key: route.query.sort_by as string, order: (route.query.sort_order || 'asc') as 'asc' | 'desc' }]
      : [{ key: 'id', order: 'asc' }];
  const sortBy = ref<SortItem[]>(initialSortBy);
  
  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];
  
  const loading = ref(false);
  const isDeactivateDialogOpen = ref(false);
  const isReactivateDialogOpen = ref(false);
  const adminToModify = ref<AdminUser | null>(null);
  const isDeleteDialogOpen = ref(false); // State for delete dialog
  const adminToDelete = ref<AdminUser | null>(null); // State for admin to delete
  
  // --- Data Table Headers ---
  type ReadonlyHeaders = VDataTable['$props']['headers'];
  
  const headers: ReadonlyHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: 80 },
    { title: '管理者', key: 'adminUser', align: 'start', sortable: false }, // Custom slot
    // { title: '役割', key: 'role', align: 'start', width: 120 }, // Add if Role is implemented
    { title: 'ステータス', key: 'status', align: 'center', width: 120 },
    { title: '登録日', key: 'registeredAt', align: 'start', width: 150 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 120 }, // Adjusted width for 3 icons
  ];
  
  // --- Filter Options ---
  const statusOptions = ref([
      { title: '有効', value: 'active' },
      { title: '停止中', value: 'inactive' },
  ]);
  // Add role options if needed
  
  // --- Sample Data Generation ---
  const generateSampleAdmins = (count: number): AdminUser[] => {
    const adminsList: AdminUser[] = [];
    const firstNames = ['管理者A', 'システムB', 'サポートC', 'スーパーD'];
    const lastNames = ['Admin', 'System', 'Support', 'Super'];
    const domains = ['admin.example.com', 'sys.sample.net', 'support.mail.org'];
    const statuses: AdminStatus[] = ['active', 'active', 'inactive', 'active'];
  
    for (let i = 1; i <= count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase().split(' ')[0]}${i}@${domains[Math.floor(Math.random() * domains.length)]}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const registeredDate = new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000); // Within last 2 years
      const avatarSuffix = Math.floor(Math.random() * 50) + 51; // Different range for admins
  
      adminsList.push({
        id: 500 + i, // Use a different ID range maybe
        name,
        email,
        avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${avatarSuffix}.jpg`,
        status,
        registeredAt: registeredDate.toISOString().substring(0, 10), // YYYY-MM-DD
      });
    }
    return adminsList;
  };
  
  const admins = ref<AdminUser[]>(generateSampleAdmins(8)); // Generate fewer admins
  
  // --- Computed Properties ---
  const filteredAdmins = computed(() => {
    return admins.value.filter(admin => {
      const statusMatch = !selectedStatus.value || admin.status === selectedStatus.value;
      const searchMatch = !search.value ||
                          admin.name.toLowerCase().includes(search.value.toLowerCase()) ||
                          admin.email.toLowerCase().includes(search.value.toLowerCase());
      return statusMatch && searchMatch;
    });
  });
  
  // --- URL Query Parameter Handling ---
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
  
  watch([selectedStatus, search, sortBy], updateQueryParameters, { deep: true });
  
  const updateItemsPerPage = (value: number) => {
    itemsPerPage.value = value;
    updateQueryParameters();
  };
  
  const updateSortBy = (newSortBy: SortItem[]) => {
    sortBy.value = newSortBy;
  };
  
  // --- Display Helpers ---
  const getStatusText = (status: AdminStatus): string => {
    return status === 'active' ? '有効' : '停止中';
  };
  
  const getStatusColor = (status: AdminStatus): string => {
    return status === 'active' ? 'success' : 'grey';
  };
  
  // --- Actions ---
  const goToEditPage = (admin: AdminUser) => {
    // Navigate to the user edit page for this admin's user ID
    // Assuming admins are also users and share the same edit page
    router.push(`/admin/users/${admin.id}/edit`);
  };
  
  const openDeactivateDialog = (admin: AdminUser) => {
    adminToModify.value = admin;
    isDeactivateDialogOpen.value = true;
  };
  
  const confirmDeactivateAdmin = () => {
    if (adminToModify.value) {
      console.log('Deactivating admin:', adminToModify.value);
      // TODO: Replace with actual API call
      const index = admins.value.findIndex(a => a.id === adminToModify.value!.id);
      if (index !== -1) {
        admins.value[index].status = 'inactive';
      }
      adminToModify.value = null;
    }
    isDeactivateDialogOpen.value = false;
  };
  
  const openReactivateDialog = (admin: AdminUser) => {
    adminToModify.value = admin;
    isReactivateDialogOpen.value = true;
  };
  
  const confirmReactivateAdmin = () => {
     if (adminToModify.value) {
      console.log('Reactivating admin:', adminToModify.value);
      // TODO: Replace with actual API call
      const index = admins.value.findIndex(a => a.id === adminToModify.value!.id);
      if (index !== -1) {
        admins.value[index].status = 'active';
      }
      adminToModify.value = null;
    }
    isReactivateDialogOpen.value = false;
  };
  
  // --- Delete Actions ---
  const openDeleteDialog = (admin: AdminUser) => {
    adminToDelete.value = admin;
    isDeleteDialogOpen.value = true;
  };
  
  const confirmDeleteAdmin = () => {
    if (adminToDelete.value) {
      console.log('Deleting admin:', adminToDelete.value);
      // TODO: Replace with actual API call to delete the admin user
      // Be very careful with this operation!
      const index = admins.value.findIndex(a => a.id === adminToDelete.value!.id);
      if (index !== -1) {
        admins.value.splice(index, 1); // Remove from local list
      }
      adminToDelete.value = null;
    }
    isDeleteDialogOpen.value = false;
  };
  
  // --- Data Fetching ---
  // TODO: Implement fetchAdmins function
  // onMounted(async () => {
  //   loading.value = true;
  //   // admins.value = await fetchAdmins(); // Replace with API call
  //   loading.value = false;
  // });
  
  </script>
  
  <style scoped>
  .v-data-table {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
  </style> 
  