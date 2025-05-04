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

              <!-- Price -->
              <v-col cols="12">
                 <v-text-field
                  v-model.number="editablePlan.price"
                  label="月額料金 (円) *"
                  required
                  type="number"
                  prefix="¥"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required, rules.nonNegative]"
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
            
            <!-- Dynamic Features List -->
            <h6 class="text-h6 mb-3">機能リスト</h6>
            <div v-for="(feature, index) in featureInputs" :key="feature.id" class="feature-row mb-3">
                <v-row align="center" no-gutters>
                    <v-col cols="12" sm="7" md="8">
                        <v-text-field
                          v-model="feature.text"
                          :label="`機能 ${index + 1}`"
                          required
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :rules="[rules.required]"
                          class="mb-sm-0 mb-2"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="9" sm="4" md="3" class="pl-sm-3">
                        <v-radio-group
                          v-model="feature.type"
                          inline
                          density="compact"
                          hide-details
                          class="justify-start"
                        >
                          <v-radio label="含む" value="included" color="success" class="mr-1"></v-radio>
                          <v-radio label="除く" value="excluded" color="grey"></v-radio>
                        </v-radio-group>
                    </v-col>
                    <v-col cols="3" sm="1" class="text-right">
                        <v-btn
                          icon
                          variant="text"
                          color="grey"
                          size="small"
                          @click="removeFeature(feature.id)"
                          :disabled="featureInputs.length <= 1"
                          title="この機能を削除"
                        >
                          <v-icon size="small">mdi-delete-outline</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
                <v-divider v-if="index < featureInputs.length - 1" class="mt-3"></v-divider>
            </div>
            <v-row justify="center" class="mt-2">
               <v-col cols="auto">
                <v-btn
                   variant="text" 
                   color="grey-darken-1"
                   @click="addFeature"
                   size="small"
                   prepend-icon="mdi-plus"
                 >
                   機能を追加
                 </v-btn>
               </v-col>
            </v-row>
            <!-- End Dynamic Features List -->

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
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

// プランIDは文字列（プラン名）
const planId = route.params.id as string;

// Interface for individual feature with ID for tracking
interface PlanFeature {
  id: number;
  text: string;
  type: 'included' | 'excluded';
}

// Interface for plan data
interface Plan {
  name: string;
  priceMonthly: number;
  features: any; // JSONフィールド
  status: 'ACTIVE' | 'PRIVATE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

// Interface for the plan update payload
interface UpdatePlanPayload {
  name?: string;
  price?: number;
  status?: 'ACTIVE' | 'PRIVATE' | 'SUSPENDED';
  features?: string[];
}

// Status options
const statusOptions = [
  { text: '有効', value: 'ACTIVE' },
  { text: '非公開', value: 'PRIVATE' },
  { text: '停止', value: 'SUSPENDED' }
];

// --- Form and State ---
const editForm = ref<any>(null);
const loading = ref(false);
const isSaving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });
const error = ref<string | null>(null);

// 編集可能なプラン情報
const editablePlan = reactive<{
  name: string;
  price: number;
  status: 'ACTIVE' | 'PRIVATE' | 'SUSPENDED';
}>({
  name: '',
  price: 0,
  status: 'ACTIVE'
});

// State for dynamic feature inputs
const featureInputs = ref<PlanFeature[]>([]);

// --- Validation Rules ---
const rules = {
  required: (value: any) => !!value || value === 0 || '必須項目です。', // Allow 0
  nonNegative: (value: number) => value >= 0 || '0以上の数値を入力してください。',
};

// プランデータ取得
const fetchPlanData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await $api.get(`/admin/plans/${encodeURIComponent(planId)}`);
    const plan = response.data;
    
    // 基本情報設定
    editablePlan.name = plan.name;
    editablePlan.price = plan.priceMonthly;
    editablePlan.status = plan.status || 'ACTIVE';
    
    // 追加機能リスト設定
    const features = plan.features || {};
    const additionalFeatures = features.additionalFeatures || [];
    if (additionalFeatures.length > 0) {
      featureInputs.value = additionalFeatures.map((feature: string, index: number) => {
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
    } else {
      // 一つ空のアイテムを追加
      featureInputs.value = [{ id: Date.now(), text: '', type: 'included' }];
    }
  } catch (err: any) {
    console.error(`プラン取得エラー:`, err);
    error.value = err.response?.data?.message || 'プランの取得中にエラーが発生しました';
    snackbar.text = error.value || 'プランの取得中にエラーが発生しました';
    snackbar.color = 'error';
    snackbar.show = true;
    
    // 一覧ページに戻る
    setTimeout(() => router.push('/admin/plans'), 2000);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPlanData();
});

// --- Feature Management Actions ---
const addFeature = () => {
  featureInputs.value.push({ id: Date.now(), text: '', type: 'included' });
};

const removeFeature = (idToRemove: number) => {
  if (featureInputs.value.length > 1) { // Prevent removing the last item
    featureInputs.value = featureInputs.value.filter(f => f.id !== idToRemove);
  }
};

// --- Main Actions ---
const cancelEdit = () => {
  router.push('/admin/plans');
};

const savePlan = async () => {
  if (!editForm.value) return;
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
  const updateData: UpdatePlanPayload = {};

  // 変更があるフィールドのみAPIに送信
  if (editablePlan.name !== planId) {
    updateData.name = editablePlan.name;
  }

  updateData.price = editablePlan.price;
  updateData.status = editablePlan.status;
  
  // 機能リストは文字列配列としてサーバーに送信
  updateData.features = featureInputs.value
    .filter(f => f.text.trim() !== '')
    .map(feature => `${feature.type === 'included' ? '+' : '-'}${feature.text}`)

  try {
    await $api.patch(`/admin/plans/${encodeURIComponent(planId)}`, updateData);
    
    snackbar.text = 'プラン情報を保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    
    setTimeout(() => router.push('/admin/plans'), 1500); // Redirect after delay
  } catch (err: any) {
    console.error("プラン更新エラー:", err);
    snackbar.text = err.response?.data?.message || '保存中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
};

</script>

<style scoped>
.feature-row {
    /* Add styles if needed for spacing or borders */
}
</style> 
