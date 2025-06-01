<template>
  <v-container>
    <PageTitle :title="`プラン編集: ${editablePlan.name || '...'}`" />
    <v-form ref="editForm">
      <v-card variant="outlined">
        <v-card-text>
          <v-container class="pa-0">
            <v-row>
              <!-- Name -->
              <v-col cols="12">
                <v-text-field
                  v-model="editablePlan.name"
                  label="プラン名 *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>

              <!-- Status -->
              <v-col cols="12">
                <v-select
                  v-model="editablePlan.status"
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
          <small class="d-block mt-4">*必須入力項目</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelEdit">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="savePlan" :loading="isSaving">
            保存
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
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import type { Plan, PlanFeatureInput } from '~/types/plan';
import { PlanStatus, PlanInterval } from '~/types/plan';
import PageTitle from '~/components/PageTitle.vue';
import PlanFeaturesList from '~/components/PlanFeaturesList.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

// クリーンアップフラグ
const isComponentMounted = ref(true);

// プラン名の型を確実に文字列に変換
const planName = typeof route.params.name === 'string' 
  ? route.params.name 
  : Array.isArray(route.params.name) ? route.params.name[0] : '';

// --- Form and State ---
const editForm = ref<any>(null);
const loading = ref(false);
const isSaving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });
const error = ref<string | null>(null);

// 編集可能なプラン情報
const editablePlan = reactive<{
  name: string;
  status: PlanStatus;
}>({
  name: '',
  status: PlanStatus.ACTIVE
});

// State for dynamic feature inputs
const featureInputs = ref<PlanFeatureInput[]>([]);

// --- Validation Rules ---
const rules = {
  required: (value: any) => !!value || value === 0 || '必須項目です。', // Allow 0
  nonNegative: (value: number) => value >= 0 || '0以上の数値を入力してください。',
};

// Status options
const statusOptions = [
  { text: '有効', value: PlanStatus.ACTIVE },
  { text: '停止', value: PlanStatus.SUSPENDED }
];

// プランデータ取得
const fetchPlanData = async () => {
  if (!isComponentMounted.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    // APIを直接使用してプラン情報を取得
    const response = await $api.get(`/admin/plans/${String(planName)}`);
    if (!isComponentMounted.value) return;
    
    const planData = response.data.data ? response.data.data : response.data;
    
    // データの存在確認
    if (!planData) {
      throw new Error('プランデータが取得できませんでした');
    }
    
    // 基本情報設定
    editablePlan.name = planData.name || '';
    editablePlan.status = planData.status || PlanStatus.ACTIVE;
    
    // 追加機能リスト設定
    const additionalFeatures = Array.isArray(planData.features) 
      ? planData.features 
      : (typeof planData.features === 'object' && planData.features && 'additionalFeatures' in planData.features 
          ? planData.features.additionalFeatures 
          : []);
      
    if (additionalFeatures.length > 0) {
      // 新しい配列を作成し、直接代入（リアクティブ依存関係の循環を避ける）
      const processedFeatures: PlanFeatureInput[] = additionalFeatures.map((feature: string, index: number) => {
        // 「+機能名」または「-機能名」の形式から解析
        let type: 'included' | 'excluded' = 'included';
        let text = feature;
        
        if (feature.startsWith('+')) {
          type = 'included';
          text = feature.substring(1);
        } else if (feature.startsWith('-')) {
          type = 'excluded';
          text = feature.substring(1);
        }
        
        return {
          id: Date.now() + index,
          text,
          type
        };
      });
      
      // 配列全体を一度に代入
      featureInputs.value = processedFeatures;
    } else {
      // 一つ空のアイテムを追加
      featureInputs.value = [{ id: Date.now(), text: '', type: 'included' }];
    }
  } catch (err: any) {
    if (!isComponentMounted.value) return;
    
    console.error(`プラン取得エラー:`, err);
    error.value = err.response?.data?.message || 'プランの取得中にエラーが発生しました';
    snackbar.text = error.value || 'プランの取得中にエラーが発生しました';
    snackbar.color = 'error';
    snackbar.show = true;
    
    // 一覧ページに戻る
    setTimeout(() => {
      if (isComponentMounted.value) {
        router.push('/admin/plans');
      }
    }, 2000);
  } finally {
    if (isComponentMounted.value) {
      loading.value = false;
    }
  }
};

onMounted(() => {
  isComponentMounted.value = true;
  fetchPlanData();
});

onBeforeUnmount(() => {
  // コンポーネントがアンマウントされたことをマーク
  isComponentMounted.value = false;
});

// --- Main Actions ---
const cancelEdit = () => {
  router.push('/admin/plans');
};

const savePlan = async () => {
  if (!editForm.value || !isComponentMounted.value) return;
  const { valid } = await editForm.value.validate();

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

  isSaving.value = true;

  // APIに送信するデータを準備
  const updateData = {
    name: editablePlan.name,
    status: editablePlan.status,
    // 機能リストは文字列配列としてサーバーに送信
    features: featureInputs.value
      .filter(f => f.text.trim() !== '')
      .map(feature => `${feature.type === 'included' ? '+' : '-'}${feature.text}`)
  };

  try {
    // APIを直接使用
    await $api.patch(`/admin/plans/${String(planName)}`, updateData);
    
    if (!isComponentMounted.value) return;
    
    snackbar.text = 'プラン情報を保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    
    setTimeout(() => {
      if (isComponentMounted.value) {
        router.push('/admin/plans');
      }
    }, 1500); // Redirect after delay
  } catch (err: any) {
    if (!isComponentMounted.value) return;
    
    console.error("プラン更新エラー:", err);
    snackbar.text = err.response?.data?.message || '保存中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    if (isComponentMounted.value) {
      isSaving.value = false;
    }
  }
};

</script>

<style scoped>
.feature-row {
    /* Add styles if needed for spacing or borders */
}
</style> 
