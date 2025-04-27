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
              <v-col cols="12" md="6">
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
              <v-col cols="12" md="6">
                <v-select
                  v-model="editablePlan.status"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
            </v-row>

            <!-- Dynamic Features List - Improved UI -->
            <v-divider class="my-5"></v-divider>
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
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const planId = Number(route.params.id);

// Interface for individual feature
interface PlanFeature {
  text: string;
  type: 'included' | 'excluded';
}

// Type definition for Plan (updated)
interface Plan {
  id: number;
  name: string;
  price: number;
  features: PlanFeature[]; // Changed from credits
  status: 'active' | 'inactive';
}

// Interface for feature inputs in the form (includes temporary id)
interface PlanFeatureInput extends PlanFeature {
  id: number;
}

// --- Form and State ---
const editForm = ref<any>(null);
const editablePlan = reactive<Partial<Omit<Plan, 'features'>>>({}); // Exclude features initially
const featureInputs = ref<PlanFeatureInput[]>([]);// State for dynamic feature inputs
const isSaving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// Options for status select
const statusOptions = ref([
    { title: '有効', value: 'active' },
    { title: '無効', value: 'inactive' },
]);

// --- Validation Rules ---
const rules = {
  required: (value: any) => !!value || value === 0 || '必須項目です。', // Allow 0
  nonNegative: (value: number) => value >= 0 || '0以上の数値を入力してください。',
};

// --- Fetch Plan Data (Simulation - Updated with Features) ---
const fetchPlanData = (id: number): Plan | null => {
    // Simulate finding plan data with features
    const samplePlans: Plan[] = [
      {
        id: 1,
        name: 'Free',
        price: 0,
        status: 'active',
        features: [
          { text: '基本的なアプリ機能', type: 'included' },
          { text: '月 10 件までのアプリ作成', type: 'included' },
          { text: 'コミュニティサポート', type: 'excluded' },
        ],
      },
      {
        id: 3,
        name: 'Plus',
        price: 1480,
        status: 'active',
        features: [
          { text: '基本的なアプリ機能', type: 'included' },
          { text: '月 50 件までのアプリ作成', type: 'included' },
          { text: 'コミュニティサポート', type: 'included' },
          { text: '優先メールサポート', type: 'excluded' },
        ],
      },
      {
        id: 2,
        name: 'Pro',
        price: 2980,
        status: 'active',
        features: [
          { text: 'すべてのアプリ機能', type: 'included' },
          { text: '無制限のアプリ作成', type: 'included' },
          { text: '優先メールサポート', type: 'included' },
          { text: '高度な分析機能', type: 'included' },
        ],
      },
    ];
    const found = samplePlans.find(p => p.id === id);
    return found || null;
}

onMounted(() => {
  // TODO: Replace this with actual API call to fetch plan data by planId
  console.log(`Fetching data for plan ID: ${planId}`);
  const existingPlan = fetchPlanData(planId);

  if (existingPlan) {
    // Assign basic info
    editablePlan.name = existingPlan.name;
    editablePlan.price = existingPlan.price;
    editablePlan.status = existingPlan.status;
    // Initialize featureInputs from existing features, adding a temporary id
    featureInputs.value = existingPlan.features.map((feature, index) => ({
        ...feature,
        id: Date.now() + index // Ensure unique ID for v-for key
    }));
    // If no features exist, add a default empty one
    if (featureInputs.value.length === 0) {
        addFeature();
    }
  } else {
    console.error(`Plan with ID ${planId} not found.`);
    snackbar.text = 'プランが見つかりません。';
    snackbar.color = 'error';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/plans'), 2000);
  }
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
      }
      return; // Stop if form or features are invalid
  }

  isSaving.value = true;

  // Construct the payload including the updated features
  const payload: Partial<Plan> = {
    ...editablePlan,
    id: planId, // Ensure ID is included
    // Map featureInputs back to the PlanFeature structure
    features: featureInputs.value.map(({ id, ...rest }) => rest),
  };

  try {
    // --- Placeholder for Update Logic ---
    console.log('Saving plan data (simulation):', payload);
    // TODO: Replace with actual API call (e.g., PUT /api/plans/{id})
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save

    snackbar.text = 'プラン情報を保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/plans'), 1500); // Redirect after delay

  } catch (error) {
    console.error("Error during plan save simulation:", error);
    snackbar.text = '保存中にエラーが発生しました。';
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
