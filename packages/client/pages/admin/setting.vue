<template>
  <v-container>
    <PageTitle title="アプリ全体設定" />
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-form @submit.prevent="saveSettings">
          <v-card variant="outlined">
            <v-card-title class="ma-2">基本設定</v-card-title>
            <v-list lines="three" class="py-0">

              <!-- Allow User Registration Setting -->
              <v-list-item>
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-list-item-title class="font-weight-medium">ユーザー登録許可</v-list-item-title>
                    <v-list-item-subtitle>新規サインアップを受け付けるか</v-list-item-subtitle>
                  </v-col>
                  <v-col cols="12" sm="8">
                    <v-switch
                      v-model="settings.allowRegistration"
                      color="primary"
                      inset
                      hide-details="auto"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-list-item>
              <v-divider></v-divider>

              <!-- Maintenance Mode Setting -->
              <v-list-item>
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-list-item-title class="font-weight-medium">メンテナンスモード</v-list-item-title>
                    <v-list-item-subtitle>有効時、管理者以外は利用不可</v-list-item-subtitle>
                  </v-col>
                  <v-col cols="12" sm="8">
                    <v-switch
                      v-model="settings.maintenanceMode"
                      color="warning"
                      inset
                      hide-details="auto"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-list-item>
              <v-divider></v-divider>

              <!-- Commission Rate Setting -->
              <v-list-item>
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-list-item-title class="font-weight-medium">手数料率</v-list-item-title>
                    <v-list-item-subtitle>開発者収益から差し引かれる割合 (例: 0.1 = 10%)</v-list-item-subtitle>
                  </v-col>
                  <v-col cols="12" sm="8">
                    <v-text-field
                      v-model.number="settings.commissionRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-list-item>
              <v-divider></v-divider>

              <!-- Payout Fee Setting -->
              <v-list-item>
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-list-item-title class="font-weight-medium">振込手数料</v-list-item-title>
                    <v-list-item-subtitle>出金時に差し引かれる固定額 (最小通貨単位)</v-list-item-subtitle>
                  </v-col>
                  <v-col cols="12" sm="8">
                    <v-text-field
                      v-model.number="settings.payoutFee"
                      type="number"
                      step="1"
                      min="0"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-list-item>
            </v-list>

            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn type="submit" color="primary" :loading="isSaving">
                設定を保存
              </v-btn>
            </v-card-actions>
        </v-card>
        </v-form>

      </v-col>
    </v-row>

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
import { useNuxtApp } from 'nuxt/app';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

// Nuxtアプリケーションから$apiを取得
const { $api } = useNuxtApp();

// Define structure for settings
interface AppSettings {
  // Basic
  siteTitle: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  // Fees
  commissionRate: number; // 手数料率 (0.0 ~ 1.0)
  payoutFee: number;      // 振込手数料 (最小通貨単位)
  // Branding
  faviconUrl: string;
  logoUrlLight: string;
  logoUrlDark: string;
  primaryColor: string;
  secondaryColor: string;
  // Email
  contactEmail: string;
  senderEmail: string;
  senderName: string;
  enableEmailNotifications: boolean;
  // Auth/Security
  enableGoogleOAuth: boolean;
  enableGithubOAuth: boolean;
  passwordResetExpiryHours: number;
  sessionTimeoutMinutes: number;
  // Integration/Display
  termsUrl: string;
  privacyUrl: string;
  googleAnalyticsId: string;
  slackWebhookUrl: string;
  defaultLanguage: 'ja' | 'en';
  defaultTimezone: string;
  footerCopyrightText: string;
  customHeaderScript: string;
  customFooterScript: string;
  // Add more settings as needed
}

// Settings data
const settings = reactive<AppSettings>({
  // Basic
  siteTitle: 'My AI App Hub',
  allowRegistration: true,
  maintenanceMode: false,
  // Fees
  commissionRate: 0.1, // Default 10%
  payoutFee: 0,        // Default 0
  // Branding
  faviconUrl: '',
  logoUrlLight: '',
  logoUrlDark: '',
  primaryColor: '#1976D2',
  secondaryColor: '#424242',
  // Email
  contactEmail: '',
  senderEmail: 'noreply@example.com',
  senderName: 'My AI App Hub',
  enableEmailNotifications: true,
  // Auth/Security
  enableGoogleOAuth: false,
  enableGithubOAuth: false,
  passwordResetExpiryHours: 24,
  sessionTimeoutMinutes: 60,
  // Integration/Display
  termsUrl: '',
  privacyUrl: '',
  googleAnalyticsId: '',
  slackWebhookUrl: '',
  defaultLanguage: 'ja',
  defaultTimezone: 'Asia/Tokyo',
  footerCopyrightText: `© ${new Date().getFullYear()} My AI App Hub`,
  customHeaderScript: '',
  customFooterScript: '',
});

// Loading and saving states
const isLoading = ref(false); // For loading settings
const isSaving = ref(false); // For save button loading state

// Snackbar state
const snackbar = reactive({
    show: false,
    text: '',
    color: 'success'
});

// Load settings on mount
onMounted(async () => {
  isLoading.value = true;
  try {
    // $apiを使用して設定を取得
    const response = await $api.get('/admin/setting');
    
    // レスポンスデータをフロントエンドのデータ構造にマッピング
    const data = response.data;
    settings.maintenanceMode = data.maintenanceMode;
    settings.commissionRate = data.commissionRate;
    settings.payoutFee = data.payoutFee;
    
    console.log('設定を読み込みました:', data);
  } catch (error) {
    console.error('設定の取得に失敗しました:', error);
    snackbar.text = '設定の取得に失敗しました';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isLoading.value = false;
  }
});

// Save settings function
const saveSettings = async () => {
  isSaving.value = true;
  try {
    // バックエンドAPIに送信する設定データ
    // 注: バックエンドが対応しているフィールドのみ送信
    const settingsToSave = {
      maintenanceMode: settings.maintenanceMode,
      commissionRate: settings.commissionRate,
      payoutFee: settings.payoutFee
    };
    
    console.log('保存する設定:', settingsToSave);
    
    // $apiを使用して設定を更新
    const response = await $api.put('/admin/setting', settingsToSave);
    
    const data = response.data;
    console.log('設定を保存しました:', data);
    
    snackbar.text = '設定を保存しました';
    snackbar.color = 'success';
    snackbar.show = true;
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    snackbar.text = '設定の保存に失敗しました';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
};

</script> 

<style scoped>
/* Optional: Add padding to list items if needed */
.v-list-item {
    padding-top: 16px;
    padding-bottom: 16px;
}

.v-card-title {
    font-size: 1.1rem; /* Adjust title size */
    font-weight: 500;
}
</style> 
