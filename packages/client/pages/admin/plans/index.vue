<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <PageTitle title="プラン管理" />
      <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" @click="goToCreatePage">
        新規登録
      </v-btn>
    </div>
    <v-row>
      <v-col>
        <v-card variant="outlined">

          <!-- Data Table -->
          <v-data-table
            :headers="headers"
            :items="plans"
            items-per-page="5" 
            class="elevation-0"
            density="compact"
            :hover="true"
            items-per-page-text="表示行数"
             :items-per-page-options="itemsPerPageOptions"
          >
             <template v-slot:item.price="{ item }">
                {{ item.price.toLocaleString() }} 円/月
             </template>
             <template v-slot:item.credits="{ item }">
                {{ item.credits.toLocaleString() }} クレジット
             </template>
              <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" density="compact" label>
                {{ item.status === 'active' ? '有効' : '無効' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon small class="mr-2" @click="goToEditPage(item)">mdi-pencil</v-icon>
              <v-icon small @click="openDeleteDialog(item)">mdi-delete</v-icon>
            </template>
             <template v-slot:no-data>
                登録されているプランがありません。
             </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

     <!-- Dialogs -->
    <ConfirmationDialog
      v-model="isDeleteDialogOpen"
      title="プラン削除確認"
      :message="`プラン「${planToDelete?.name}」を削除しますか？`"
      confirm-text="削除する"
      confirm-color="error"
      @confirm="confirmDeletePlan"
    />

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { VDataTable } from 'vuetify/components';
import PageTitle from '~/components/PageTitle.vue';
import ConfirmationDialog from '~/components/ConfirmationDialog.vue';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();

// Type for SortItem used by VDataTable - Not used here but kept for consistency possibility
type SortItem = { key: string; order: 'asc' | 'desc' };
type ReadonlyHeaders = VDataTable['$props']['headers'];

const headers: ReadonlyHeaders = [
  { title: 'プラン名', key: 'name', align: 'start' },
  { title: '月額料金', key: 'price', align: 'end' },
  { title: '月間クレジット', key: 'credits', align: 'end' },
  { title: 'ステータス', key: 'status', align: 'center', width: 100 },
  { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
];

// Options for status select
const statusOptions = ref([
    { title: '有効', value: 'active' },
    { title: '無効', value: 'inactive' },
]);

// Interface for plan data
interface Plan {
  id: number;
  name: string;
  price: number;
  credits: number;
  status: 'active' | 'inactive';
  // Add more properties as needed (e.g., features list, description)
}

// Sample plan data
const plans = ref<Plan[]>([
  {
    id: 1,
    name: 'Free',
    price: 0,
    credits: 0,
    status: 'active',
  },
  {
    id: 3,
    name: 'Plus',
    price: 1480,
    credits: 1000,
    status: 'active',
  },
  {
    id: 2,
    name: 'Pro',
    price: 2980,
    credits: 10000,
    status: 'active',
  },
]);

// Items per page options
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 25, title: '25' },
];
const itemsPerPage = ref(itemsPerPageOptions[0].value); // Default items per page

// Dialog states
const isDeleteDialogOpen = ref(false);
const planToDelete = ref<Plan | null>(null);

// Status display helper
const getStatusColor = (status: Plan['status']): string => {
  return status === 'active' ? 'green' : 'grey';
};

// CRUD Actions (Updated)
const goToEditPage = (plan: Plan) => {
  router.push(`/admin/plans/${plan.id}/edit`);
};

const goToCreatePage = () => {
  router.push('/admin/plans/new');
};

const openDeleteDialog = (plan: Plan) => {
  planToDelete.value = plan;
  isDeleteDialogOpen.value = true;
};

const confirmDeletePlan = () => {
  if (planToDelete.value) {
    console.log('Deleting plan:', planToDelete.value);
    // TODO: Replace with actual API call
    plans.value = plans.value.filter(p => p.id !== planToDelete.value!.id);
    planToDelete.value = null;
  }
  isDeleteDialogOpen.value = false;
};

</script>

<style scoped>
.v-data-table {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style> 
