<template>
  <v-container>
    <PageTitle title="マイページ" />

    <!-- Loading Indicator -->
    <v-row v-if="isLoading" justify="center" class="my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <!-- Error/Success Messages -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @update:modelValue="errorMessage = null"
    >
      {{ errorMessage }}
    </v-alert>
    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
      @update:modelValue="successMessage = null"
    >
      {{ successMessage }}
    </v-alert>

    <v-row v-if="!isLoading">
      <v-col cols="12">
        <!-- Profile Card -->
        <v-card variant="outlined" class="mb-6">
          <v-card-text class="text-center pa-4">
            <!-- Avatar Display and Change Button -->
            <div class="avatar-container mx-auto mb-4" style="position: relative; width: 120px; height: 120px;">
              <v-avatar size="120" color="grey-lighten-2">
                <v-img :src="avatarPreviewUrl || userAvatarUrl || defaultAvatar" alt="User Avatar"></v-img>
              </v-avatar>
              <v-btn
                icon
                size="small"
                color="primary"
                style="position: absolute; bottom: 0; right: 0;"
                @click="triggerFileInput"
                title="アバターを変更 (プレビューのみ)"
                :disabled="true"
              >
                <v-icon>mdi-camera</v-icon>
              </v-btn>
            </div>
            <!-- Hidden File Input -->
            <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="onFileChange"
                style="display: none;"
             />
             <!-- Save Button for Avatar (Removed/Disabled) -->
              <v-alert type="info" density="compact" variant="tonal" class="mt-2" v-if="selectedAvatarFile">
                  アバター保存機能は現在利用できません。
              </v-alert>
          </v-card-text>

          <v-divider></v-divider>

          <v-list lines="two">
            <!-- Name Section -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account-outline"></v-icon>
              </template>
              <v-list-item-title>名前</v-list-item-title>
              <v-list-item-subtitle v-if="!isEditingName">{{ userName }}</v-list-item-subtitle>
              <v-text-field
                v-else
                v-model="editedName"
                label="新しい名前"
                variant="outlined"
                density="compact"
                hide-details
                class="mt-2 mb-1"
                :rules="[rules.required]"
                @keyup.enter="saveName"
                @keyup.esc="cancelEditName"
              ></v-text-field>
              <template v-slot:append>
                <div v-if="!isEditingName">
                  <v-btn
                    color="grey"
                    variant="text"
                    size="small"
                    @click="startEditName"
                    icon="mdi-pencil"
                    title="名前を編集"
                  ></v-btn>
                </div>
                <div v-else>
                   <v-btn
                     color="grey"
                     variant="text"
                     size="small"
                     @click="cancelEditName"
                     icon="mdi-close"
                     title="キャンセル"
                     class="mr-1"
                   ></v-btn>
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    @click="saveName"
                    icon="mdi-check"
                    title="保存"
                    :disabled="!editedName || editedName === userName"
                  ></v-btn>
                </div>
              </template>
            </v-list-item>

            <v-divider inset></v-divider>

            <!-- Email Section (Readonly) -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-email-outline"></v-icon>
              </template>
              <v-list-item-title>メールアドレス</v-list-item-title>
              <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
            </v-list-item>

            
            <v-divider inset></v-divider>
            <!-- Plan Section -->
            <!-- ADMINISTRATOR 以外の場合のみ表示 -->
            <v-list-item v-if="user && user.role !== 'ADMINISTRATOR'">
              <template v-slot:prepend>
                <v-icon icon="mdi-credit-card-outline"></v-icon>
              </template>
              <v-list-item-title>現在のプラン</v-list-item-title>
              <v-list-item-subtitle>{{ currentPlan }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  to="/plans"
                >
                  プラン変更
                </v-btn>
              </template>
            </v-list-item>

          </v-list>
        </v-card>

        <!-- Password Change Card -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6">パスワード変更</v-card-title>
          <v-card-text>
            <v-form ref="passwordForm" @submit.prevent="changePassword">
              <v-text-field
                v-model="currentPassword"
                label="現在のパスワード"
                type="password"
                variant="outlined"
                density="compact"
                class="mb-3"
                :rules="[rules.required]"
                autocomplete="current-password"
              ></v-text-field>
              <v-text-field
                v-model="newPassword"
                label="新しいパスワード"
                type="password"
                variant="outlined"
                density="compact"
                class="mb-3"
                :rules="[rules.required, rules.minLength(8)]"
                autocomplete="new-password"
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                label="新しいパスワード (確認)"
                type="password"
                variant="outlined"
                density="compact"
                class="mb-3"
                :rules="[rules.required, rules.passwordMatch]"
                autocomplete="new-password"
              ></v-text-field>
              <v-btn type="submit" color="primary" block>パスワードを変更</v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Developer Section Card -->
        <v-card v-if="user && user.role !== 'ADMINISTRATOR'" variant="outlined">
          <v-card-title class="text-h6">開発者向け機能</v-card-title>

          <!-- Case: DEVELOPER or (USER and APPROVED) -->
          <v-card-text v-if="user.role === 'DEVELOPER' || (user.role === 'USER' && developerStatus === 'APPROVED')">
            <p class="mb-4">あなたは開発者として承認されています。</p>
            <v-btn
              color="success"
              to="/developer"
              block
              prepend-icon="mdi-apps"
              :style="{ 'text-transform': 'none' }"
            >
              開発者管理画面へ
            </v-btn>
          </v-card-text>

          <!-- Case: USER and Not Approved (UNSUBMITTED, PENDING, REJECTED) -->
          <template v-else-if="user.role === 'USER'">
              <!-- Sub-Case 1: Not Applied -->
              <v-card-text v-if="developerStatus === 'UNSUBMITTED'">
                <p class="mb-4">開発者としてアプリを公開しませんか？<br>申請を行うことで、作成したアプリを多くのユーザーに届け、収益を得るチャンスがあります。</p>
                <v-btn
                  color="secondary"
                  to="/developer/apply"
                  block
                  prepend-icon="mdi-rocket-launch-outline"
                  :style="{ 'text-transform': 'none' }"
                >
                  開発者申請を行う
                </v-btn>
              </v-card-text>

              <!-- Sub-Case 2: Rejected -->
               <v-card-text v-else-if="developerStatus === 'REJECTED'">
                 <p class="mb-4">開発者申請は承認されませんでした。<br>提出内容をご確認の上、必要に応じて修正し再度申請してください。</p>
                 <v-btn
                   color="warning"
                   to="/developer/apply"
                   block
                   prepend-icon="mdi-refresh"
                   :style="{ 'text-transform': 'none' }"
                 >
                   再度、開発者申請を行う
                 </v-btn>
               </v-card-text>

              <!-- Sub-Case 3: Pending Approval -->
              <v-card-text v-else-if="developerStatus === 'PENDING'">
                <p class="mb-4">開発者申請は現在審査中です。承認までしばらくお待ちください。</p>
                <v-progress-linear indeterminate color="secondary"></v-progress-linear>
                 <v-btn
                   color="secondary"
                   block
                   disabled
                   class="mt-4"
                   :style="{ 'text-transform': 'none' }"
                 >
                   現在、開発者申請中です
                 </v-btn>
              </v-card-text>

              <!-- Note: APPROVED case is handled above -->

          </template>

        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useNuxtApp } from '#app';
import PageTitle from '~/components/PageTitle.vue';
// import type を使用し、エラー無視コメントを削除
import type { MyProfile } from '~/types/user';

definePageMeta({ middleware: ['logged-in-access-only'] });

// --- API Client Setup ---
const { $api, payload: { user } } = useNuxtApp();

// --- Reactive State ---
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// User information
const userEmail = ref('');
const userName = ref('');
const currentPlan = ref('');
const userAvatarUrl = ref<string | null>(null); // Holds the *saved* avatar URL
const userRole = ref(''); // Added user role state
const developerStatus = ref<MyProfile['developerStatus']>('UNSUBMITTED'); // Initialize developer status

// Avatar related (upload is deferred this time)
const avatarPreviewUrl = ref<string | null>(null); // Holds the temporary preview URL
const selectedAvatarFile = ref<File | null>(null); // Holds the selected file object
const isSavingAvatar = ref(false); // Loading state for avatar save (not used)
const fileInput = ref<HTMLInputElement | null>(null);
const defaultAvatar = 'https://placehold.jp/120x120.png?text=Avatar';

// Name edit related
const isEditingName = ref(false);
const editedName = ref('');

// Password change related
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordForm = ref<any>(null);

// --- Fetch User Data ---
onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    userName.value = user.name;
    userEmail.value = user.email;
    userAvatarUrl.value = user.avatarUrl;
    currentPlan.value = user.planName; // Use the plan name from API
    userRole.value = user.role;
    developerStatus.value = user.developerStatus;
  } catch (error: any) {
    errorMessage.value = 'Failed to load user profile.';
    // Add additional handling for 401 Unauthorized etc.
  } finally {
    isLoading.value = false;
  }
});

// --- Methods ---

// Avatar related (save is deferred this time)
const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedAvatarFile.value = file; // Store the file
    // Generate and show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreviewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    console.log('Selected file (preview only):', file);
     // Avatar save functionality is deferred, so selected file and preview are kept but save button is disabled
     // saveAvatar() is not called
  } else {
      selectedAvatarFile.value = null;
      avatarPreviewUrl.value = null; // Clear preview if selection cancelled
  }
};

// Name edit related
const startEditName = () => {
  editedName.value = userName.value;
  isEditingName.value = true;
  successMessage.value = null; // Clear message
  errorMessage.value = null;
};

const saveName = async () => {
  if (!editedName.value) return;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    const updatedUser: Pick<MyProfile, 'name'> = await $api('/me/name', {
      method: 'PATCH',
      data: { name: editedName.value },
    });
    userName.value = updatedUser.name;
    isEditingName.value = false;
    successMessage.value = 'Name updated successfully.';
  } catch (error: any) {
    console.error('Failed to update name:', error);
    errorMessage.value = 'Failed to update name.';
    // Add more specific error handling based on the error response
  }
};

const cancelEditName = () => {
  isEditingName.value = false;
  errorMessage.value = null;
};

// Password change related
const changePassword = async () => {
  if (!passwordForm.value) return;
  const { valid } = await passwordForm.value.validate();

  if (valid) {
    errorMessage.value = null;
    successMessage.value = null;
    try {
      await $api('/me/password', {
        method: 'PATCH',
        data: {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        },
      });
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      passwordForm.value.reset(); // Vuetify form reset
      passwordForm.value.resetValidation();
      successMessage.value = 'Password changed successfully.';
    } catch (error: any) {
      console.error('Failed to change password:', error);
      if (error.response?.status === 401) {
        errorMessage.value = 'Current password is incorrect.';
      } else if (error.response?.status === 400) {
        errorMessage.value = error.response._data?.message || 'Please check your input.'; // Attempt to show server message
      } else {
        errorMessage.value = 'Failed to change password.';
      }
    }
  } else {
    console.log('Password form validation failed');
    errorMessage.value = 'Please check your input.';
  }
};

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || 'Required field.',
  minLength: (length: number) => (value: string) => (value && value.length >= length) || `${length} characters or more required.`,
  passwordMatch: (value: string) => value === newPassword.value || 'Passwords do not match.',
};

</script>

<style scoped>
/* Add specific styles if needed */
</style> 
