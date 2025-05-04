<template>
  <v-container>
    <PageTitle title="プロフィール編集" />

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
      @update:modelValue="clearMessages"
      density="compact"
    >
      {{ errorMessage }}
    </v-alert>
    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
      @update:modelValue="clearMessages"
      density="compact"
    >
      {{ successMessage }}
    </v-alert>

    <v-row v-if="!isLoading" justify="center">
      <v-col cols="12" md="8">
        <!-- 注意喚起メッセージ -->
        <v-alert
          type="info"
          variant="tonal"
          border="start"
          density="compact"
          class="mb-4"
          icon="mdi-information-outline"
        >
          <strong>ご注意ください:</strong> プロフィール情報（開発者名、自己紹介、アバター画像）はアプリ内で公開され、すべてのユーザーに表示されます。個人を特定できる情報や機密情報は入力しないようご注意ください。
        </v-alert>

        <v-form ref="profileForm">
          <v-card elevation="0" border>
            <!-- Avatar Section -->
            <v-card-title class="text-subtitle-1 px-4 pt-4 pb-2">
              <v-icon start color="primary">mdi-account-circle</v-icon>
              アバター画像
            </v-card-title>
            <v-card-text class="text-center px-4 pb-4">
              <div class="d-flex align-center flex-column">
                <v-avatar size="120" color="grey-lighten-2" class="avatar-border mb-4">
                  <v-img :src="avatarPreviewUrl || formData.avatarUrl || defaultAvatar" alt="User Avatar" cover></v-img>
                </v-avatar>
                <div class="d-flex gap-2">
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-camera"
                    @click="triggerFileInput"
                    :disabled="isSaving"
                  >
                    画像を選択
                  </v-btn>
                  <v-btn
                    v-if="formData.avatarUrl || avatarPreviewUrl"
                    color="error"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-delete"
                    @click="removeAvatar"
                    :disabled="isSaving"
                  >
                    削除
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
              </div>
              <v-alert v-if="avatarError" type="error" density="compact" class="mt-2">{{ avatarError }}</v-alert>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-text class="px-4 py-4">
              <!-- Developer Name Field -->
              <v-text-field
                v-model="formData.developerName"
                label="開発者名"
                variant="outlined"
                density="comfortable"
                placeholder="開発者として表示される名前"
                hint="サイト内で公開されるあなたの開発者としての名前"
                persistent-hint
                :rules="[rules.maxLength(100)]"
                counter="100"
                prepend-inner-icon="mdi-storefront-outline"
                class="mb-6"
                :disabled="isSaving"
              ></v-text-field>

              <!-- Bio Field -->
              <v-textarea
                v-model="formData.bio"
                label="自己紹介"
                variant="outlined"
                density="comfortable"
                placeholder="あなたの開発者としての紹介文"
                hint="あなたのスキルや開発に対する姿勢などを記入してください（500文字以内）"
                persistent-hint
                :rules="[rules.maxLength(500)]"
                counter="500"
                rows="6"
                auto-grow
                prepend-inner-icon="mdi-text-account"
                :disabled="isSaving"
              ></v-textarea>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="px-4 py-4">
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-content-save"
                @click="saveProfile"
                :loading="isSaving"
                :disabled="isSaving || !hasChanges"
              >
                変更を保存
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import type { VForm } from 'vuetify/components';
import { useNuxtApp } from '#app';
import PageTitle from '~/components/PageTitle.vue';
import type { MyProfile } from '~/types/user';

// --- Page Meta ---
definePageMeta({
  layout: 'developer',
});

// --- Composables ---
const { $api } = useNuxtApp();

// --- Data Types ---
interface ProfileFormData {
  id: number | null;
  developerName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  removeAvatar: boolean;
}

// --- Constants ---
const defaultAvatar = '/img/avatar_default.png';

// --- Reactive State ---
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const avatarError = ref<string | null>(null);
const profileForm = ref<VForm | null>(null);

// Original data (for detecting changes)
const originalData = ref<ProfileFormData>({
  id: null,
  developerName: null,
  bio: null,
  avatarUrl: null,
  removeAvatar: false
});

// Form data (editable values)
const formData = reactive<ProfileFormData>({
  id: null,
  developerName: null,
  bio: null,
  avatarUrl: null,
  removeAvatar: false
});

// Avatar Edit State
const avatarPreviewUrl = ref<string | null>(null);
const selectedAvatarFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  maxLength: (max: number) => (value: string | null) => (value?.length || 0) <= max || `${max}文字以内で入力してください。`,
};

// --- Computed Properties ---

// 変更があるかどうかを検出
const hasChanges = computed(() => {
  // もし新しいアバター画像が選択されていれば変更あり
  if (avatarPreviewUrl.value) return true;
  
  // アバター削除フラグが立っていれば変更あり
  if (formData.removeAvatar) return true;
  
  // 各フィールドを比較
  if (formData.developerName !== originalData.value.developerName) return true;
  if (formData.bio !== originalData.value.bio) return true;
  
  return false;
});

// --- Methods ---

const clearMessages = () => {
  errorMessage.value = null;
  successMessage.value = null;
  avatarError.value = null;
};

// Fetch Profile Data
const fetchProfile = async () => {
  isLoading.value = true;
  clearMessages();
  try {
    // 開発者プロフィールAPIからデータを取得
    const response = await $api.get('/developer/profile');
    const data = response.data;

    // 元データを保存（変更検知用）
    originalData.value = {
      id: data.id,
      developerName: data.developerName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      removeAvatar: false
    };
    
    // フォームデータを設定
    formData.id = data.id;
    formData.developerName = data.developerName;
    formData.bio = data.bio;
    formData.avatarUrl = data.avatarUrl;
    formData.removeAvatar = false;

  } catch (error: any) {
    console.error('Failed to load profile:', error);
    errorMessage.value = 'プロフィールの読み込みに失敗しました。';
  } finally {
    isLoading.value = false;
  }
};

// Avatar Handling
const triggerFileInput = () => {
  clearMessages();
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  avatarError.value = null;

  if (file) {
    // Basic validation (example: size limit 2MB)
    if (file.size > 2 * 1024 * 1024) {
      avatarError.value = 'ファイルサイズは2MB以下にしてください。';
      selectedAvatarFile.value = null;
      avatarPreviewUrl.value = null;
      target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      avatarError.value = '画像ファイルを選択してください。';
      selectedAvatarFile.value = null;
      avatarPreviewUrl.value = null;
      target.value = '';
      return;
    }

    selectedAvatarFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreviewUrl.value = e.target?.result as string;
      formData.removeAvatar = false; // アバター削除フラグをリセット
    };
    reader.readAsDataURL(file);
  } else {
    selectedAvatarFile.value = null;
    avatarPreviewUrl.value = null;
  }
};

// アバター削除
const removeAvatar = () => {
  avatarPreviewUrl.value = null;
  selectedAvatarFile.value = null;
  formData.removeAvatar = true;
  if (fileInput.value) fileInput.value.value = '';
};

// プロフィール一括保存
const saveProfile = async () => {
  // フォーム検証
  const { valid } = await profileForm.value?.validate() || { valid: false };
  if (!valid) {
    errorMessage.value = '入力内容を確認してください。';
    return;
  }

  isSaving.value = true;
  clearMessages();

  try {
    // 送信データの準備
    const profileData: any = {
      developerName: formData.developerName,
      bio: formData.bio
    };

    // アバター画像処理
    if (avatarPreviewUrl.value) {
      profileData.avatarUrl = avatarPreviewUrl.value;
    } else if (formData.removeAvatar) {
      profileData.removeAvatar = true;
    }

    // APIを呼び出してプロフィールを更新
    const response = await $api.patch('/developer/profile', profileData);
    
    // 成功したら元データを更新
    originalData.value = {
      id: response.data.id,
      developerName: response.data.developerName,
      bio: response.data.bio,
      avatarUrl: response.data.avatarUrl,
      removeAvatar: false
    };
    
    // フォームデータも更新
    formData.id = response.data.id;
    formData.developerName = response.data.developerName;
    formData.bio = response.data.bio;
    formData.avatarUrl = response.data.avatarUrl;
    formData.removeAvatar = false;
    
    // プレビュー状態をリセット
    avatarPreviewUrl.value = null;
    selectedAvatarFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
    
    successMessage.value = 'プロフィールを更新しました。';
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    errorMessage.value = 'プロフィールの更新に失敗しました。';
  } finally {
    isSaving.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(fetchProfile);
</script>

<style scoped>
.avatar-border {
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.gap-2 {
  gap: 8px;
}
</style> 
