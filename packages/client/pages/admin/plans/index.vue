<template>
  <v-container>
    <!-- 注意喚起 -->
    <v-alert
      type="warning"
      variant="tonal"
      border="start"
      class="mb-4"
      closable
    >
      <v-alert-title>プラン管理に関する注意事項</v-alert-title>
      <p>プランの変更はユーザーのサービス利用に直接影響します。以下の点に注意してください：</p>
      <ul class="mt-2">
        <li>既存のプランを変更すると、そのプランを利用中のすべてのユーザーに影響します</li>
        <li>利用中のプランは削除できません</li>
        <li>価格を変更する場合は、事前に顧客への通知が必要です</li>
      </ul>
    </v-alert>

    <div class="d-flex justify-space-between align-center mb-4">
      <PageTitle title="プラン管理" />
      <v-btn color="primary" prepend-icon="mdi-plus-circle-outline" @click="handleCreatePlan">
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
            :loading="loading"
            items-per-page="10" 
            class="elevation-0"
            density="compact"
            :hover="true"
            items-per-page-text="表示行数"
            :items-per-page-options="itemsPerPageOptions"
          >
            <template v-slot:item.amount="{ item }">
              {{ item.amount.toLocaleString() }} 円
            </template>
            <template v-slot:item.interval="{ item }">
              {{ getIntervalText(item.interval) }}
            </template>
            <template v-slot:item.features="{ item }">
              {{ getFeaturesSummary(item.features) }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" :text="getStatusText(item.status)"></v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="d-flex">
                <v-tooltip text="編集" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon
                      variant="text"
                      density="comfortable"
                      size="small"
                      @click="goToEditPage(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                
                <v-tooltip text="削除" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon
                      variant="text"
                      density="comfortable"
                      size="small"
                      color="error"
                      @click="openDeleteDialog(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
            <template v-slot:no-data>
              <div class="pa-4 text-center">
                <v-progress-circular v-if="loading" indeterminate color="primary" class="mb-3"></v-progress-circular>
                <div v-else>登録されているプランがありません。</div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogs -->

    <!-- Snackbar -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import type { VDataTable } from 'vuetify/components';
import type { Plan } from '~/types/plan';
import { PlanStatus, PlanInterval } from '~/types/plan';
import PageTitle from '~/components/PageTitle.vue';
import { useGlobalModal } from '~/composables/useGlobalModal';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const { $api } = useNuxtApp();
const { confirmDelete, showPrimaryModal, showWarningModal } = useGlobalModal();

// ローディングとエラー状態
const loading = ref(false);
const error = ref<string | null>(null);

// Type for SortItem used by VDataTable
type SortItem = { key: string; order: 'asc' | 'desc' };
type ReadonlyHeaders = VDataTable['$props']['headers'];

const headers: ReadonlyHeaders = [
  { title: 'プラン名', key: 'name', align: 'start' },
  { title: '月額料金', key: 'amount', align: 'end' },
  { title: '課金間隔', key: 'interval', align: 'center' },
  { title: '機能', key: 'features', align: 'start' },
  { title: 'ステータス', key: 'status', align: 'center' },
  { title: 'アクション', key: 'actions', sortable: false, align: 'end', width: 100 },
];

// 状態
const plans = ref<Plan[]>([]);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// Items per page options
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
];

// 機能の概要を表示
const getFeaturesSummary = (features: any): string => {
  if (!features) return '機能情報なし';
  
  try {
    // additionalFeaturesがあれば表示
    const additionalFeatures = Array.isArray(features) ? features : 
      (features.additionalFeatures || []);
    
    // 「+」で始まる機能（または明示的な+がないもの）を含む機能としてカウント
    const includedFeatures = additionalFeatures.filter((f: string) => {
      return !f.startsWith('-');
    });
    
    // 「-」で始まる機能を除外機能としてカウント
    const excludedFeatures = additionalFeatures.filter((f: string) => {
      return f.startsWith('-');
    });
    
    let summary = `機能数: ${additionalFeatures.length}件`;
    if (includedFeatures.length > 0) {
      summary += `（含む: ${includedFeatures.length}件）`;
    }
    if (excludedFeatures.length > 0) {
      summary += `（除く: ${excludedFeatures.length}件）`;
    }
    
    return summary;
  } catch (e) {
    return '機能情報の解析エラー';
  }
};

// 課金間隔を表示
const getIntervalText = (interval: PlanInterval | string) => {
  switch (interval) {
    case PlanInterval.MONTH: return '月額';
    case PlanInterval.YEAR: return '年額';
    default: return interval;
  }
};

// ステータスに応じた表示
const getStatusColor = (status: string) => {
  switch (status) {
    case PlanStatus.ACTIVE: return 'success';
    case PlanStatus.SUSPENDED: return 'error';
    default: return 'primary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case PlanStatus.ACTIVE: return '有効';
    case PlanStatus.SUSPENDED: return '停止';
    default: return status;
  }
};

// CRUD Actions
const handleCreatePlan = async () => {
  const confirmed = await showPrimaryModal(
    '新しいプランを作成しますか？',
    'プラン作成確認'
  );
  
  if (confirmed) {
    router.push('/admin/plans/new');
  }
};

const handleEditPlan = async (plan: Plan) => {
  const confirmed = await showWarningModal(
    `プラン「${plan.name}」を編集しますか？既存の利用者に影響が出る可能性があります。`,
    'プラン編集確認'
  );
  
  if (confirmed) {
    router.push(`/admin/plans/${encodeURIComponent(plan.name)}/edit`);
  }
};

const handleDeletePlan = async (plan: Plan) => {
  const confirmed = await confirmDelete(plan.name, 'プラン');
  
  if (!confirmed) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    await $api.delete(`/admin/plans/${encodeURIComponent(plan.name)}`);
    snackbar.text = 'プランを削除しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    fetchPlans();
  } catch (err: any) {
    error.value = err.response?.data?.message || `プラン「${plan.name}」の削除中にエラーが発生しました`;
    snackbar.text = error.value || `プラン「${plan.name}」の削除中にエラーが発生しました`;
    snackbar.color = 'error';
    snackbar.show = true;
    console.error(`プラン削除エラー:`, err);
  } finally {
    loading.value = false;
  }
};

// 互換性のための古い関数名（削除予定）
const goToEditPage = (plan: Plan) => {
  handleEditPlan(plan);
};

const goToCreatePage = () => {
  handleCreatePlan();
};

const openDeleteDialog = (plan: Plan) => {
  handleDeletePlan(plan);
};

const confirmDeletePlan = async () => {
  // 削除予定
};

// プラン一覧を取得
const fetchPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // APIを直接使用
    const response = await $api.get('/admin/plans');
    // APIレスポンス形式に合わせて処理
    if (response.data && Array.isArray(response.data)) {
      plans.value = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      plans.value = response.data.data;
    } else if (response.data) {
      plans.value = [response.data];
    } else {
      plans.value = [];
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'プランの取得中にエラーが発生しました';
    console.error('プラン取得エラー:', err);
    plans.value = [];
    
    // エラーメッセージを表示
    snackbar.text = error.value || 'プランの取得中にエラーが発生しました';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

// Lifecycle Hooks
onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
.v-data-table {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style> 
