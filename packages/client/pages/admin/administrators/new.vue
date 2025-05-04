<template>
  <v-container fluid>
    <PageTitle 
      title="新規管理者登録" 
      :back-button="true" 
      back-to="/admin/administrators" 
    />
    
    <v-alert v-if="error" type="error" class="mb-4" closable>
      {{ error }}
    </v-alert>
    
    <v-row justify="center">
      <v-col cols="12">
        <v-card variant="outlined" class="mb-4">
          <v-card-text>
            <v-form ref="newAdminForm" @submit.prevent="createAdmin">
              <v-row>
                <!-- 左側: 基本情報 -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newAdmin.name"
                    label="名前 *"
                    :rules="[rules.required]"
                    variant="outlined"
                    class="mb-3"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="newAdmin.email"
                    label="メールアドレス *"
                    type="email"
                    :rules="[rules.required, rules.email]"
                    variant="outlined"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                
                <!-- 右側: パスワード設定 -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newAdmin.password"
                    label="パスワード *"
                    type="password"
                    :rules="[rules.required, rules.minLength(8)]"
                    variant="outlined"
                    class="mb-3"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="passwordConfirm"
                    label="パスワード（確認） *"
                    type="password"
                    :rules="[rules.required, rules.passwordMatch]"
                    variant="outlined"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              variant="outlined" 
              color="grey" 
              class="me-4" 
              :disabled="isSubmitting" 
              @click="cancel"
            >
              キャンセル
            </v-btn>
            <v-btn 
              type="submit" 
              color="primary" 
              variant="elevated" 
              :loading="isSubmitting" 
              :disabled="isSubmitting"
              @click="createAdmin"
            >
              登録する
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- スナックバー -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          閉じる
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';
import { UserStatus } from '~/constants/user-status';
import type { UserStatusType } from '~/constants/user-status';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const { $api } = useNuxtApp();
const newAdminForm = ref<any>(null);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

// スナックバー状態
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

// --- Form Data ---
interface AdminFormData {
  name: string;
  email: string;
  password: string;
  status: UserStatusType;
}

const newAdmin = reactive<AdminFormData>({
  name: '',
  email: '',
  password: '',
  status: UserStatus.ACTIVE,
});

const passwordConfirm = ref('');

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  email: (value: string) => /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください。',
  minLength: (length: number) => (value: string) => (value && value.length >= length) || `${length}文字以上で入力してください。`,
  passwordMatch: (value: string) => value === newAdmin.password || 'パスワードが一致しません。',
};

// ヘルパー関数
const showError = (message: string): void => {
  snackbar.text = message;
  snackbar.color = 'error';
  snackbar.show = true;
  error.value = message;
};

const showSuccess = (message: string): void => {
  snackbar.text = message;
  snackbar.color = 'success';
  snackbar.show = true;
};

// キャンセル処理
const cancel = (): void => {
  router.push('/admin/administrators');
};

// --- Methods ---
const createAdmin = async () => {
  if (!newAdminForm.value) return;
  
  const { valid } = await newAdminForm.value.validate();

  if (valid) {
    isSubmitting.value = true;
    error.value = null;
    
    try {
      // API呼び出し
      await $api.post('/admin/administrators', newAdmin);
      
      // 成功メッセージ表示
      showSuccess('管理者を登録しました');
      
      // 一覧ページへリダイレクト（タイミングを少し遅らせる）
      setTimeout(() => {
        router.push('/admin/administrators');
      }, 1500);
    } catch (error: any) {
      // エラー処理
      showError(error.response?.data?.message || '管理者の登録に失敗しました');
    } finally {
      isSubmitting.value = false;
    }
  }
};
</script>

<style scoped>
.v-text-field.v-input--disabled .v-field__input {
  color: rgba(0, 0, 0, 0.7) !important;
}
</style> 
