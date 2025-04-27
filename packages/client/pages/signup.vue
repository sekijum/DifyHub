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
        <v-card v-if="allowRegistration" variant="outlined">
          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleSignUp">

              <!-- Avatar Selection -->
              <div class="d-flex justify-center mb-6">
                <div class="avatar-container" style="position: relative; width: 100px; height: 100px;">
                  <v-avatar size="100" color="grey-lighten-3">
                    <v-img :src="avatarPreviewUrl || defaultAvatar" alt="Avatar Preview"></v-img>
                  </v-avatar>
                  <v-btn
                    icon
                    size="small"
                    color="primary"
                    style="position: absolute; bottom: -5px; right: -5px;"
                    @click="triggerFileInput"
                    title="アバターを選択"
                  >
                    <v-icon>mdi-camera-plus-outline</v-icon>
                  </v-btn>
                </div>
              </div>
              <input 
                 type="file"
                 ref="fileInput"
                 accept="image/*" 
                 @change="onFileChange"
                 style="display: none;" 
              />

              <v-text-field
                label="名前"
                name="name"
                type="text"
                v-model="name"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-text-field
                label="メールアドレス"
                name="email"
                type="email"
                v-model="email"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-text-field
                label="パスワード"
                name="password"
                type="password"
                v-model="password"
                required
                hint="パスワードは8文字以上"
                class="mb-4"
                variant="outlined"
              ></v-text-field>

               <v-text-field
                label="パスワード（確認）"
                name="passwordConfirm"
                type="password"
                v-model="passwordConfirm"
                required
                :rules="[passwordConfirmationRule]" 
                variant="outlined"
              ></v-text-field>
            </v-form>
             <v-card-actions class="justify-center mt-4 pa-0">
               <v-btn type="submit" color="primary" :disabled="!isFormValid" @click="handleSignUp" block size="large">サインアップ</v-btn>
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
import { ref, computed, onMounted } from 'vue';
import PageTitle from '~/components/PageTitle.vue';
import { useRouter } from 'vue-router';

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

const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const avatarFile = ref<File | null>(null); // To store the selected file
const avatarPreviewUrl = ref<string | null>(null); // For image preview
const fileInput = ref<HTMLInputElement | null>(null);
const defaultAvatar = 'https://placehold.jp/100x100.png?text=Avatar'; // Default placeholder

const router = useRouter();

// Basic password confirmation rule
const passwordConfirmationRule = computed(() => {
  return () => (password.value === passwordConfirm.value) || 'パスワードが一致しません';
});

// Simple form validation check (can be expanded)
const isFormValid = computed(() => {
    // Avatar is optional, so not included in validation for now
    return name.value && email.value && password.value && password.value === passwordConfirm.value;
});

// --- Avatar Selection Methods ---
const triggerFileInput = () => {
  console.log('Triggering file input click...');
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  console.log('onFileChange triggered.');
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    avatarFile.value = file; 
    console.log('File selected:', file.name, file.type);

    const reader = new FileReader();
    reader.onloadstart = () => console.log('FileReader: loadstart');
    reader.onprogress = (e) => console.log(`FileReader: progress ${e.loaded}/${e.total}`);
    reader.onload = (e) => {
      console.log('FileReader: load complete.');
      const result = e.target?.result as string;
      if (result) {
          console.log('Assigning result to avatarPreviewUrl (first 100 chars):', result.substring(0, 100));
          avatarPreviewUrl.value = result;
          // Force template update check
          console.log('avatarPreviewUrl value after assignment:', avatarPreviewUrl.value?.substring(0, 100));
      } else {
          console.error('FileReader result is empty.');
      }
    };
    reader.onerror = (e) => {
      console.error('FileReader error:', reader.error);
      alert(`ファイルの読み込み中にエラーが発生しました: ${reader.error?.message}`);
    };
    reader.readAsDataURL(file);
  } else {
      console.log('No file selected or selection cancelled.');
      avatarFile.value = null;
      avatarPreviewUrl.value = null;
  }
};

const handleSignUp = () => {
  if (!isFormValid.value) return;
  console.log('Attempting sign up with:');
  console.log('Name:', name.value);
  console.log('Email:', email.value);
  console.log('Avatar File:', avatarFile.value ? avatarFile.value.name : 'None');

  // TODO: Implement actual sign-up logic
  // You'll likely need to use FormData to send the file along with other data
  // const formData = new FormData();
  // formData.append('name', name.value);
  // formData.append('email', email.value);
  // formData.append('password', password.value);
  // if (avatarFile.value) {
  //   formData.append('avatar', avatarFile.value);
  // }
  // callSignupApi(formData).then(...)

  // Redirect to OTP verification page after successful signup (simulated)
  console.log('Signup successful (simulated), redirecting to OTP verification...');
  router.push('/otp-verify'); 
};

// Define layout if needed
// definePageMeta({
//   layout: 'auth', 
// });
</script>

<style scoped>
/* Add any specific styles for the signup page here */
</style> 
