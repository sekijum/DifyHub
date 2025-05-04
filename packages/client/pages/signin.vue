<template>
  <v-container>
    <PageTitle title="サインイン" />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card variant="outlined">
          <v-card-text class="pa-6">
            <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
              {{ errorMessage }}
            </v-alert>
            <v-form @submit.prevent="handleSignIn">
              <v-text-field
                label="メールアドレス"
                name="email"
                type="email"
                v-model="email"
                :disabled="loading"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-text-field
                label="パスワード"
                name="password"
                type="password"
                v-model="password"
                :disabled="loading"
                required
                variant="outlined"
              ></v-text-field>
               <v-card-actions class="justify-center mt-4 pa-0">
                 <v-btn 
                   type="submit" 
                   color="primary" 
                   @click="handleSignIn" 
                   block 
                   size="large"
                   :loading="loading"
                   :disabled="loading"
                 >
                   サインイン
                 </v-btn>
               </v-card-actions>
            </v-form>
            <div class="text-center mt-6">
              <nuxt-link to="/signup">アカウントをお持ちでない場合</nuxt-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageTitle from '~/components/PageTitle.vue';
import { useRouter, useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const router = useRouter();
const route = useRoute();
const nuxtApp = useNuxtApp();
const { $api, $storage } = nuxtApp;

console.log($storage);

type LoginResponse = { access_token: string };

const handleSignIn = async () => {
  loading.value = true;
  errorMessage.value = null;
  $storage.removeItem('access_token'); // 削除

  try {
    // レスポンス型を修正
    const response = await $api.post<LoginResponse>('/auth/signin', {
      email: email.value,
      password: password.value
    });

    const responseData = response.data;

    // レスポンスに access_token が含まれているか確認
    if (responseData && responseData.access_token) {
      // アクセストークンを保存
      // @ts-ignore Nuxt plugin type inference
      $storage.setItem('access_token', responseData.access_token);

      router.push('/');
    } else {
      // アクセストークンがない場合はエラー処理
      console.error('Login response did not contain access_token:', responseData);
      // @ts-ignore Nuxt plugin type inference
      throw new Error(t('signin.errors.generic'));
    }

  } catch (error: any) {
    console.log(error);
    if (error.response && error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
    } else {
        errorMessage.value = 'サインインに失敗しました。接続を確認してください。';
    }
  } finally {
    loading.value = false;
  }
};

// Define layout if needed (e.g., if you have a specific auth layout)
// definePageMeta({
//   layout: 'auth', 
// });
</script>

<style scoped>
/* Add any specific styles for the signin page here */
</style> 
