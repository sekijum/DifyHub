<template>
  <v-container>
    <!-- Notification Section -->
    <v-row pt-0 mt-0 px-0 pb-4>
      <v-col cols="12">
        <v-alert
          type="info"
          title="セキュリティ強化のお知らせ"
          variant="tonal"
          prominent
          border="start"
          density="compact"
        >
          セキュリティ向上のため、一部の決済処理において3Dセキュア（本人認証サービス）による追加認証が必要になる場合がございます。ご理解とご協力をお願いいたします。
        </v-alert>
      </v-col>
    </v-row>

    <PageTitle title="料金プラン" />
    <v-row justify="center">
      <v-col cols="12" lg="11" xl="10">
        <v-row align="stretch">
          <!-- Free Plan -->
          <v-col cols="12" md="4">
            <v-card class="pa-6 fill-height d-flex flex-column" variant="outlined">
              <v-card-title class="text-h5 justify-center mb-2">Free</v-card-title>
              <v-card-subtitle class="text-center text-h6 mb-4">¥0 <span class="text-body-1">/ 月</span></v-card-subtitle>
              <v-divider class="mb-4"></v-divider>
              <v-list density="compact" class="bg-transparent">
                <v-list-item prepend-icon="mdi-check" class="mb-1">基本的なアプリ機能</v-list-item>
                <v-list-item prepend-icon="mdi-check" class="mb-1">月 10 件までのアプリ作成</v-list-item>
                <v-list-item prepend-icon="mdi-close" class="mb-1">コミュニティサポート</v-list-item>
              </v-list>
              <v-spacer></v-spacer>
              <v-card-actions class="justify-center mt-4">
                <v-btn color="grey" variant="outlined" block size="large">現在のプラン</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Plus Plan -->
          <v-col cols="12" md="4">
            <v-card class="pa-6 fill-height d-flex flex-column" variant="outlined">
              <v-card-title class="text-h5 justify-center mb-2">Plus</v-card-title>
              <v-card-subtitle class="text-center text-h6 mb-4">¥1,480 <span class="text-body-1">/ 月</span></v-card-subtitle>
              <v-divider class="mb-4"></v-divider>
              <v-list density="compact" class="bg-transparent">
                <v-list-item prepend-icon="mdi-check" class="mb-1">基本的なアプリ機能</v-list-item>
                <v-list-item prepend-icon="mdi-check" class="mb-1">月 50 件までのアプリ作成</v-list-item>
                <v-list-item prepend-icon="mdi-check" class="mb-1">コミュニティサポート</v-list-item>
                <v-list-item prepend-icon="mdi-close" class="mb-1">優先メールサポート</v-list-item>
              </v-list>
              <v-spacer></v-spacer>
              <v-card-actions class="justify-center mt-4">
                <v-btn color="primary" variant="elevated" block size="large" @click="showConfirmationDialog('Plus', 1480)">プランに登録</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Pro Plan -->
          <v-col cols="12" md="4">
            <v-card class="pa-6 fill-height d-flex flex-column" variant="outlined">
              <v-card-title class="text-h5 justify-center mb-2">Pro</v-card-title>
              <v-card-subtitle class="text-center text-h6 mb-4">¥2,980 <span class="text-body-1">/ 月</span></v-card-subtitle>
              <v-divider class="mb-4"></v-divider>
              <v-list density="compact" class="bg-transparent">
                <v-list-item prepend-icon="mdi-check" class="mb-1">すべてのアプリ機能</v-list-item>
                <v-list-item prepend-icon="mdi-check" class="mb-1">無制限のアプリ作成</v-list-item>
                <v-list-item prepend-icon="mdi-check" class="mb-1">優先メールサポート</v-list-item>
                <v-list-item prepend-icon="mdi-check" class="mb-1">高度な分析機能</v-list-item>
              </v-list>
              <v-spacer></v-spacer>
              <v-card-actions class="justify-center mt-4">
                <v-btn color="primary" variant="elevated" block size="large" @click="showConfirmationDialog('Pro', 2980)">プランに登録</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="isDialogVisible" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h6">プラン登録確認</v-card-title>
        <v-card-text>
          {{ selectedPlan.name }}プラン（¥{{ selectedPlan.price.toLocaleString() }}/月）に登録します。よろしいですか？
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="isDialogVisible = false">キャンセル</v-btn>
          <v-btn color="primary" text @click="confirmRegistration">登録する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

const isDialogVisible = ref(false);

// Store selected plan details for the dialog
const selectedPlan = reactive({
  name: '',
  price: 0,
});

const showConfirmationDialog = (planName: string, planPrice: number) => {
  selectedPlan.name = planName;
  selectedPlan.price = planPrice;
  isDialogVisible.value = true;
};

const confirmRegistration = () => {
  console.log(`${selectedPlan.name} plan registration confirmed.`);
  // TODO: Implement actual plan registration logic (API call, payment processing)
  alert(`${selectedPlan.name}プランへの登録処理を開始します。`);
  isDialogVisible.value = false;
};

</script>

<style scoped>
.bg-transparent {
  background-color: transparent !important;
}
</style> 
