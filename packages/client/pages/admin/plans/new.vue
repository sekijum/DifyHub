<template>
  <v-container>
    <PageTitle title="プラン作成" />
    <v-form ref="createForm">
      <v-card variant="outlined">
        <v-card-text>
          <v-container>
            <v-row>
              <!-- Name -->
              <v-col cols="12">
                <v-text-field
                  v-model="newPlan.name"
                  label="プラン名 *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>

              <!-- amount -->
              <v-col cols="12" md="6">
                 <v-text-field
                  v-model.number="newPlan.amount"
                  label="料金 (円) *"
                  required
                  type="number"
                  prefix="¥"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required, rules.nonNegative]"
                ></v-text-field>
              </v-col>
              
              <!-- interval -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="newPlan.billingPeriod"
                  label="課金間隔 *"
                  :items="intervalOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>

              <!-- Status -->
              <v-col cols="12">
                <v-select
                  v-model="newPlan.status"
                  label="ステータス *"
                  :items="statusOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <!-- PlanFeaturesList Component -->
            <PlanFeaturesList v-model="featureInputs" />

          </v-container>
          <small>*必須入力項目</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelCreate">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createPlan" :loading="isCreating">
            作成する
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
     <!-- Snackbar for feedback -->
     <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
        {{ snackbar.text }}
        <template v-slot:actions>
            <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
        </template>
     </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import type { PlanFeatureInput, CreatePlanDto } from '~/types/plan';
import { PlanStatus, PlanInterval } from '~/types/plan';
import PageTitle from '~/components/PageTitle.vue';
import PlanFeaturesList from '~/components/PlanFeaturesList.vue';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const { $api } = useNuxtApp();

// --- Form and State ---
const createForm = ref<any>(null);
const isCreating = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// Status options
const statusOptions = [
  { text: '有効', value: PlanStatus.ACTIVE },
  { text: '停止', value: PlanStatus.SUSPENDED }
];

// 課金間隔オプション
const intervalOptions = [
  { text: '月額', value: PlanInterval.MONTH },
  { text: '年額', value: PlanInterval.YEAR }
];

// State for dynamic feature inputs
const featureInputs = ref<PlanFeatureInput[]>([
  { id: Date.now(), text: '', type: 'included' } // Start with one empty feature
]);

const newPlan = reactive<{
  name: string;
  amount: number;
  billingPeriod: PlanInterval;
  status: PlanStatus;
}>({
  name: '',
  amount: 0,
  billingPeriod: PlanInterval.MONTH,
  status: PlanStatus.ACTIVE
});

// --- Validation Rules ---
const rules = {
  required: (value: any) => !!value || value === 0 || '必須項目です。',
  nonNegative: (value: number) => value >= 0 || '0以上の数値を入力してください。',
};

// --- Main Actions ---
const cancelCreate = () => {
  router.push('/admin/plans');
};

const createPlan = async () => {
  if (!createForm.value) return;
  const { valid } = await createForm.value.validate();

  // Also validate feature text fields are not empty
  const featuresValid = featureInputs.value.every(f => f.text.trim() !== '');

  if (!valid || !featuresValid) {
    if (!featuresValid) {
      snackbar.text = '機能リストのテキストを入力してください。';
      snackbar.color = 'warning';
      snackbar.show = true;
    } else {
      snackbar.text = '入力内容に問題があります。確認してください。';
      snackbar.color = 'warning';
      snackbar.show = true;
    }
    return;
  }

  isCreating.value = true;

  // APIに送信するデータを準備
  const payload: CreatePlanDto = {
    name: newPlan.name,
    amount: newPlan.amount,
    billingPeriod: newPlan.billingPeriod,
    status: newPlan.status,
    // 機能リストは文字列配列としてサーバーに送信
    features: featureInputs.value
      .filter(f => f.text.trim() !== '')
      .map(feature => `${feature.type === 'included' ? '+' : '-'}${feature.text}`)
  };

  try {
    // APIを直接使用
    await $api.post('/admin/plans', payload);
    
    snackbar.text = 'プランを新規作成しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    
    // Redirect to the list page after successful creation
    setTimeout(() => router.push('/admin/plans'), 1500);
  } catch (err: any) {
    console.error("プラン作成エラー:", err);
    snackbar.text = err.response?.data?.message || '作成中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isCreating.value = false;
  }
};
</script>

<style scoped>
/* Add styles if needed */
</style> 
