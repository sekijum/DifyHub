<template>
  <v-container>
    <PageTitle title="サインアップ" />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <!-- Show alert if registration is not allowed -->
        <v-alert
          v-if="!allowRegistration"
          type="info"
          variant="outlined"
          prominent
          class="mb-6"
          border="start"
        >
          現在、新規ユーザー登録は受け付けておりません。
        </v-alert>

        <!-- Show signup form only if registration is allowed -->
        <v-card v-if="allowRegistration" variant="outlined" :loading="isLoading">
          <v-card-text class="pa-6">
            <!-- エラーメッセージ表示 -->
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="outlined"
              prominent
              class="mb-6"
              border="start"
              closable
              @click:close="errorMessage = null"
            >
              {{ errorMessage }}
            </v-alert>

            <v-form @submit.prevent="handleSignUp">

              <v-text-field
                label="名前"
                name="name"
                type="text"
                v-model="formData.name"
                required
                class="mb-4"
                variant="outlined"
                :disabled="isLoading"
              ></v-text-field>

              <v-text-field
                label="メールアドレス"
                name="email"
                type="email"
                v-model="formData.email"
                required
                class="mb-4"
                variant="outlined"
                :disabled="isLoading"
              ></v-text-field>

              <v-text-field
                label="パスワード"
                name="password"
                type="password"
                v-model="formData.password"
                required
                hint="パスワードは8文字以上"
                class="mb-4"
                variant="outlined"
                :disabled="isLoading"
              ></v-text-field>

               <v-text-field
                label="パスワード（確認）"
                name="passwordConfirm"
                type="password"
                v-model="formData.passwordConfirm"
                required
                :rules="[passwordConfirmationRule]"
                variant="outlined"
                :disabled="isLoading"
              ></v-text-field>
            </v-form>
             <v-card-actions class="justify-center mt-4 pa-0">
               <v-btn type="submit" color="primary" :disabled="!isFormValid || isLoading" @click="handleSignUp" block size="large">サインアップ</v-btn>
             </v-card-actions>
            <div class="text-center mt-6">
              <nuxt-link to="/signin">既にアカウントをお持ちの場合</nuxt-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import PageTitle from '~/components/PageTitle.vue';
import { useRouter } from 'vue-router';
import { ref as vueRef } from 'vue';
import { useNuxtApp } from '#app';

// Simulate fetching the registration setting
// TODO: Replace this with an actual API call to fetch settings
const allowRegistration = ref(true); // Default to true, will be updated on mount

onMounted(() => {
  // Simulate fetching the setting from an API or state management store
  // For demonstration, let's toggle it to false after a short delay
  // In a real app, you would fetch the actual value from your backend settings
  setTimeout(() => {
    // Example: Set based on fetched data
    // allowRegistration.value = fetchedSettings.allowRegistration;
    console.log('Simulating fetching registration setting...');
    // To test the disabled state, uncomment the next line:
    // allowRegistration.value = false;
  }, 500); // Simulate network delay
});

// --- State Refs & Reactive Objects ---
const formData = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
});
const isLoading = vueRef(false);
const errorMessage = vueRef<string | null>(null);

const router = useRouter();
const nuxtApp = useNuxtApp();
const { $api, $storage } = nuxtApp;

// Basic password confirmation rule
const passwordConfirmationRule = computed(() => {
  return () => (formData.password === formData.passwordConfirm) || 'パスワードが一致しません';
});

// Simple form validation check (can be expanded)
const isFormValid = computed(() => {
    // Avatar is optional, so not included in validation for now
    return formData.name && formData.email && formData.password && formData.password === formData.passwordConfirm;
});

const handleSignUp = async () => {
  if (!isFormValid.value || isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const apiUrl = '/auth/signup';
    const payload = {
      email: formData.email,
      password: formData.password,
      name: formData.name
    };

    // バックエンドは成功応答で { access_token: string } を含むオブジェクトを返すと仮定
    const signupResponse = await $api.post<{ access_token: string }>(apiUrl, payload);
    const signupData = signupResponse.data;

    // レスポンスに access_token が含まれているか確認
    if (signupData && signupData.access_token) {
      // アクセストークンを保存
      // @ts-ignore Nuxt plugin type inference
      $storage.setItem('access_token', signupData.access_token);
      // ログイン後のページ（例: /mypage）へリダイレクト
      router.push('/mypage'); // Redirect to a relevant page after signup
      // @ts-ignore Nuxt plugin type inference
      $toast.success(t('signup.success'));
    } else {
      // アクセストークンがない場合はエラー
      console.error('Signup response did not contain access_token:', signupData);
      // @ts-ignore Nuxt plugin type inference
      throw new Error(t('signup.errors.generic'));
    }
  } catch (error: any) {
    // サインアップ自体のエラー処理 (例: Email already exists)
    if (error.response && error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
    } else {
        errorMessage.value = error.message || 'サインアップ中に予期せぬエラーが発生しました。';
    }
     // 念のため関連トークンを削除 (access_tokenのみ)
     $storage.removeItem('access_token');
  } finally {
    isLoading.value = false;
  }
};

// Define layout if needed
// definePageMeta({
//   layout: 'auth', 
// });
</script>

<style scoped>
/* Add any specific styles for the signup page here */
</style> 
