<template>
  <v-container>
    <PageTitle title="新規管理者登録" />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card variant="outlined">
          <v-card-text>
            <v-form ref="newAdminForm" @submit.prevent="createAdmin">
              <v-text-field
                v-model="newAdmin.name"
                label="名前"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="newAdmin.email"
                label="メールアドレス"
                type="email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="newAdmin.password"
                label="パスワード"
                type="password"
                :rules="[rules.required, rules.minLength(8)]"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="passwordConfirm"
                label="パスワード（確認）"
                type="password"
                :rules="[rules.required, rules.passwordMatch]"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>
              <!-- Add Role selection if needed -->
              <!-- <v-select
                v-model="newAdmin.role"
                :items="roleOptions"
                label="役割"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-select> -->

              <v-btn type="submit" color="primary" block :loading="isSubmitting">登録する</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const newAdminForm = ref<any>(null); // For form validation
const isSubmitting = ref(false);

// --- Form Data ---
const newAdmin = reactive({
  name: '',
  email: '',
  password: '',
  // role: 'admin', // Default role if implemented
});
const passwordConfirm = ref('');

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  email: (value: string) => /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください。',
  minLength: (length: number) => (value: string) => (value && value.length >= length) || `${length}文字以上で入力してください。`,
  passwordMatch: (value: string) => value === newAdmin.password || 'パスワードが一致しません。',
};

// --- Methods ---
const createAdmin = async () => {
  if (!newAdminForm.value) return;
  const { valid } = await newAdminForm.value.validate();

  if (valid) {
    isSubmitting.value = true;
    try {
      // TODO: Implement API call to create the admin user
      console.log('Creating admin:', { ...newAdmin }); // Log data (remove password in real app)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Use snackbar/toast in a real app for feedback
      // showSnackbar('管理者を登録しました。');
      router.push('/admin/administrators'); // Redirect to admin list page
    } catch (error) {
      console.error('Failed to create admin:', error);
      // showSnackbar('管理者の登録に失敗しました。', 'error');
      alert('管理者の登録に失敗しました。'); // Placeholder
    } finally {
      isSubmitting.value = false;
    }
  } else {
    console.log('Admin creation form validation failed');
  }
};

</script>

<style scoped>
/* Add styles if needed */
</style> 
