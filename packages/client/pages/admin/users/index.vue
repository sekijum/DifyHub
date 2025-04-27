<template>
  <v-container>
    <PageTitle title="ユーザー管理" />
    <v-row>
      <v-col>
        <v-card variant="outlined">

          <!-- Filter Controls Row -->
          <v-row dense class="pa-4 pt-2">
            <v-col cols="12" sm="4" md="3">
               <v-select
                v-model="selectedPlan"
                :items="planOptions"
                item-title="title"
                item-value="value"
                label="プラン"
                density="compact"
                outlined
                hide-details
                clearable
              ></v-select>
            </v-col>
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
            <v-col cols="12" sm="4" md="4"> 
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
            :items="filteredUsers"
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
             <template v-slot:item.plan="{ item }">
               <v-chip :color="getPlanColor(item.plan)" density="compact" label>
                 {{ getPlanText(item.plan) }}
               </v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" density="compact" label>
                {{ item.status === 'active' ? '有効' : '停止中' }}
              </v-chip>
            </template>
             <template v-slot:item.actions="{ item }">
              <v-icon small class="mr-2" @click="goToEditPage(item)">mdi-pencil</v-icon>
            </template>
             <template v-slot:no-data>
                条件に一致するユーザーが見つかりません。
             </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

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

// Type for SortItem used by VDataTable
type SortItem = { key: string; order: 'asc' | 'desc' };

// Initialize state from route query parameters
const search = ref(route.query.q as string || '');
const selectedPlan = ref<string | null>(route.query.plan as string || null);
const selectedStatus = ref<string | null>(route.query.status as string || null);
const itemsPerPage = ref(Number(route.query.limit) || 10);
const initialSortBy: SortItem[] = route.query.sort_by
    ? [{ key: route.query.sort_by as string, order: (route.query.sort_order || 'asc') as 'asc' | 'desc' }]
    : [{ key: 'id', order: 'asc' }]; // Default sort
const sortBy = ref<SortItem[]>(initialSortBy);

// Define options for items-per-page selector
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
];

const loading = ref(false);
const userToDelete = ref<User | null>(null);

// Define header type explicitly
type ReadonlyHeaders = VDataTable['$props']['headers'];

const headers: ReadonlyHeaders = [
  { title: 'ID', key: 'id', align: 'start', width: 80 },
  { title: '名前', key: 'name', align: 'start', sortable: false },
  { title: 'メールアドレス', key: 'email', align: 'start', sortable: false },
  { title: 'プラン', key: 'plan', align: 'center', width: 100, sortable: false },
  { title: 'ステータス', key: 'status', align: 'center', width: 120, sortable: false },
  { title: '登録日', key: 'registeredAt', align: 'start', width: 150 },
  { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
];

// Plan options for the select dropdown
const planOptions = ref([
    { title: 'Free', value: 'free' },
    { title: 'Plus', value: 'plus' },
    { title: 'Pro', value: 'pro' },
]);
const statusOptions = ref([
    { title: '有効', value: 'active' },
    { title: '停止中', value: 'inactive' },
]);

// Interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  plan: 'free' | 'plus' | 'pro';
  status: 'active' | 'inactive';
  registeredAt: string;
}

// Generate more sample user data (approx. 40 users)
const generateSampleUsers = (count: number): User[] => {
  const usersList: User[] = [];
  const firstNames = ['山田', '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林'];
  const lastNames = ['太郎', '花子', '一郎', '次郎', '三郎', '良子', '健太', '優子', '大輔', '明美'];
  const domains = ['example.com', 'sample.net', 'mail.org', 'test.co.jp', 'dummy.jp'];
  const plans: User['plan'][] = ['free', 'plus', 'pro'];
  const statuses: User['status'][] = ['active', 'active', 'active', 'inactive'];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domains[Math.floor(Math.random() * domains.length)]}`;
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const randomDay = Math.floor(Math.random() * 30) + 1;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const registeredAt = `2023-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;

    usersList.push({
      id: i,
      name,
      email,
      plan,
      status,
      registeredAt,
    });
  }
  return usersList;
};

const users = ref<User[]>(generateSampleUsers(40));

// Computed property to filter users based on search and selected plan
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const planMatch = !selectedPlan.value || user.plan === selectedPlan.value;
    const statusMatch = !selectedStatus.value || user.status === selectedStatus.value;
    const searchMatch = !search.value ||
                        user.name.toLowerCase().includes(search.value.toLowerCase()) ||
                        user.email.toLowerCase().includes(search.value.toLowerCase());
    return planMatch && statusMatch && searchMatch;
  });
});

// Function to update URL query parameters including sorting
const updateQueryParameters = () => {
  const query: Record<string, any> = {};
  if (selectedPlan.value) query.plan = selectedPlan.value;
  if (selectedStatus.value) query.status = selectedStatus.value;
  if (itemsPerPage.value !== 10) query.limit = itemsPerPage.value;
  if (search.value) query.q = search.value;

  // Add sorting parameters if not default (ID asc)
  const currentSort = sortBy.value[0];
  if (currentSort && (currentSort.key !== 'id' || currentSort.order !== 'asc')) {
     query.sort_by = currentSort.key;
     query.sort_order = currentSort.order;
  }

  // Only push if the query actually changed
  if (JSON.stringify(query) !== JSON.stringify(route.query)) {
      router.replace({ query });
  }
};

// Watch filters and sorting, then update query
watch([selectedPlan, selectedStatus, search, sortBy], updateQueryParameters, { deep: true }); // Watch sortBy deeply

// Handler for items-per-page update
const updateItemsPerPage = (value: number) => {
  itemsPerPage.value = value;
  updateQueryParameters(); // Update query when itemsPerPage changes
};

// Handler for sort update
const updateSortBy = (newSortBy: SortItem[]) => {
  sortBy.value = newSortBy;
  // The watch on sortBy will trigger updateQueryParameters
};

// Helper function to get plan text
const getPlanText = (plan: User['plan']): string => {
  switch (plan) {
    case 'free': return 'Free';
    case 'plus': return 'Plus';
    case 'pro': return 'Pro';
    default: return plan;
  }
};

// Function to determine chip color based on plan
const getPlanColor = (plan: User['plan']): string => {
  switch (plan) {
    case 'free': return 'grey';
    case 'plus': return 'orange';
    case 'pro': return 'blue';
    default: return 'default';
  }
};

// Function to determine chip color based on status
const getStatusColor = (status: 'active' | 'inactive'): string => {
  return status === 'active' ? 'green' : 'red';
};

// Updated CRUD Actions
const goToEditPage = (user: User) => {
  router.push(`/admin/users/${user.id}/edit`);
};

</script>

<style scoped>
.v-data-table {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

/* Adjust card title layout on smaller screens if needed */
.v-card-title {
  gap: 8px; /* Add some gap between elements */
}
</style> 
