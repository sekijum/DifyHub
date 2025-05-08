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
              <v-col cols="12">
                 <v-text-field
                  v-model.number="newPlan.amount"
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
            
            <!-- Dynamic Features List -->
            <h6 class="text-h6 mb-2">機能リスト</h6>
            <v-row v-for="(feature, index) in featureInputs" :key="feature.id" align="center">
              <v-col cols="12" sm="7" md="8">
                <v-text-field
                  v-model="feature.text"
                  :label="`機能 ${index + 1}`"
                  required
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="8" sm="4" md="3">
                <v-radio-group
                  v-model="feature.type"
                  inline
                  density="compact"
                  hide-details
                >
                  <v-radio label="含む" value="included" color="success"></v-radio>
                  <v-radio label="除く" value="excluded" color="grey"></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="4" sm="1" class="text-center">
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeFeature(feature.id)"
                  :disabled="featureInputs.length <= 1"
                  title="この機能を削除"
                >
                  <v-icon>mdi-delete-outline</v-icon>
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
               <v-col cols="12">
                <v-btn
                   variant="outlined"
                   color="grey"
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
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const { $api } = useNuxtApp();

// Interface for individual feature
interface PlanFeature {
  text: string;
  type: 'included' | 'excluded';
  id: number;
}

// Interface for the plan creation payload
interface CreatePlanPayload {
  name: string;
  amount: number;
  status: 'ACTIVE' | 'PRIVATE' | 'SUSPENDED';
  features?: string[];
}

// --- Form and State ---
const createForm = ref<any>(null);
const isCreating = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// Status options
const statusOptions = [
  { text: '有効', value: 'ACTIVE' },
  { text: '非公開', value: 'PRIVATE' },
  { text: '停止', value: 'SUSPENDED' }
];

// State for dynamic feature inputs
const featureInputs = ref<PlanFeature[]>([
  { id: Date.now(), text: '', type: 'included' } // Start with one empty feature
]);

const newPlan = reactive<CreatePlanPayload>({
  name: '',
  amount: 0,
  status: 'ACTIVE',
  features: []
});

// --- Validation Rules ---
const rules = {
  required: (value: any) => !!value || value === 0 || '必須項目です。',
  nonNegative: (value: number) => value >= 0 || '0以上の数値を入力してください。',
};

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
  const payload = {
    name: newPlan.name,
    amount: newPlan.amount,
    status: newPlan.status,
    // 機能リストは文字列配列としてサーバーに送信
    features: featureInputs.value
      .filter(f => f.text.trim() !== '')
      .map(feature => `${feature.type === 'included' ? '+' : '-'}${feature.text}`)
  };

  try {
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
