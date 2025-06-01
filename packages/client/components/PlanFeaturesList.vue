<template>
  <div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { PlanFeatureInput } from '~/types/plan';

const props = defineProps<{
  modelValue: PlanFeatureInput[];
}>();

const emit = defineEmits(['update:modelValue']);

const featureInputs = ref<PlanFeatureInput[]>([]);

// Watch for external changes to modelValue and update local state only if different
watch(() => props.modelValue, (newValue) => {
  // JSON比較で変更があった場合のみ更新
  if (JSON.stringify(featureInputs.value) !== JSON.stringify(newValue)) {
    featureInputs.value = JSON.parse(JSON.stringify(newValue));
  }
}, { deep: true });

// Update parent when local state changes, but avoid circular updates
watch(featureInputs, (newValue) => {
  // JSONを使用して値の比較を行い、実際に値が変わった場合のみ親に通知
  if (JSON.stringify(newValue) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', JSON.parse(JSON.stringify(newValue)));
  }
}, { deep: true });

// Initialize
onMounted(() => {
  // 空の配列ならデフォルト値で初期化
  if (!props.modelValue || props.modelValue.length === 0) {
    // 一つ空のアイテムを追加
    const defaultFeature: PlanFeatureInput = { id: Date.now(), text: '', type: 'included' };
    featureInputs.value = [defaultFeature];
    emit('update:modelValue', JSON.parse(JSON.stringify(featureInputs.value)));
  } else {
    // ディープコピーで初期化
    featureInputs.value = JSON.parse(JSON.stringify(props.modelValue));
  }
});

// --- Feature Management Actions ---
const addFeature = () => {
  const newFeature: PlanFeatureInput = { id: Date.now(), text: '', type: 'included' };
  const newList = [...featureInputs.value, newFeature];
  featureInputs.value = newList;
};

const removeFeature = (idToRemove: number) => {
  if (featureInputs.value.length > 1) { // Prevent removing the last item
    featureInputs.value = featureInputs.value.filter(f => f.id !== idToRemove);
  }
};

// --- Validation Rules ---
const rules = {
  required: (value: any) => !!value || '必須項目です。',
};
</script>

<style scoped>
.feature-row {
  /* Add styles if needed for spacing or borders */
}
</style> 
