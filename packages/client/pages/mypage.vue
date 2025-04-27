<template>
  <v-container>
    <PageTitle title="マイページ" />

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
            title="アバターを変更"
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
         <!-- Save Button for Avatar -->
         <v-btn 
            v-if="selectedAvatarFile"
            color="primary"
            variant="elevated"
            size="small"
            @click="saveAvatar"
            :loading="isSavingAvatar"
            class="mt-2"
         >
           アバターを保存
         </v-btn>
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
          ></v-text-field>
          <template v-slot:append>
            <div v-if="!isEditingName">
              <v-btn
                color="grey"
                variant="text"
                size="small"
                @click="startEditName"
                icon="mdi-pencil"
              ></v-btn>
            </div>
            <div v-else>
               <v-btn
                 color="grey"
                 variant="text"
                 size="small"
                 @click="cancelEditName"
                 icon="mdi-close"
                 class="mr-1"
               ></v-btn>
              <v-btn
                color="primary"
                variant="text"
                size="small"
                @click="saveName"
                icon="mdi-check"
                :disabled="!editedName"
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
        <v-list-item>
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

    <v-card variant="outlined">
      <v-card-title class="text-h6">パスワード変更</v-card-title>
      <v-card-text>
        <v-form ref="passwordForm">
          <v-text-field
            v-model="currentPassword"
            label="現在のパスワード"
            type="password"
            variant="outlined"
            density="compact"
            class="mb-3"
            :rules="[rules.required]"
          ></v-text-field>
          <v-text-field
            v-model="newPassword"
            label="新しいパスワード"
            type="password"
            variant="outlined"
            density="compact"
            class="mb-3"
            :rules="[rules.required, rules.minLength(8)]"
          ></v-text-field>
          <v-text-field
            v-model="confirmPassword"
            label="新しいパスワード (確認)"
            type="password"
            variant="outlined"
            density="compact"
            class="mb-3"
            :rules="[rules.required, rules.passwordMatch]"
          ></v-text-field>
          <v-btn color="primary" @click="changePassword" block>パスワードを変更</v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Become a Developer / Go to Developer Console Section -->
    <v-card variant="outlined" class="mt-6">
      <v-card-title class="text-h6">開発者向け機能</v-card-title>

      <!-- Case 1: Not Applied (First time) -->
      <v-card-text v-if="developerStatus === 'not_applied'">
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

      <!-- Case 2: Rejected -->
       <v-card-text v-else-if="developerStatus === 'rejected'">
         <p class="mb-4">残念ながら、前回の開発者申請は承認されませんでした。<br>理由をご確認の上、修正後に再度申請いただけます。</p>
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

      <!-- Case 3: Pending Approval -->
      <v-card-text v-else-if="developerStatus === 'pending'">
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

      <!-- Case 4: Approved -->
       <v-card-text v-else-if="developerStatus === 'approved'">
         <p class="mb-4">開発者として承認されました！作成したアプリを登録して公開しましょう。</p>
         <v-btn
           color="success"
           to="/developer"
           block
           prepend-icon="mdi-apps"
           :style="{ 'text-transform': 'none' }"
         >
           アプリ管理画面へ
         </v-btn>
       </v-card-text>

    </v-card>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

// Type for Developer Status (added 'rejected')
type DeveloperStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';

// --- Reactive State --- 
const userEmail = ref('user@example.com');
const userName = ref('テストユーザー');
const currentPlan = ref('フリー');
const userAvatarUrl = ref<string | null>(null); // Holds the *saved* avatar URL
const avatarPreviewUrl = ref<string | null>(null); // Holds the temporary preview URL
const selectedAvatarFile = ref<File | null>(null); // Holds the selected file object
const userRole = ref('未設定'); // Added user role state
const defaultAvatar = 'https://placehold.jp/120x120.png?text=Avatar';
const fileInput = ref<HTMLInputElement | null>(null);
const isSavingAvatar = ref(false); // Loading state for avatar save

const isEditingName = ref(false);
const editedName = ref('');

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordForm = ref<any>(null);
const developerStatus = ref<DeveloperStatus>('rejected'); // Initialize developer status

// --- Computed property to determine avatar source ---
// const displayAvatarSrc = computed(() => {
//   return avatarPreviewUrl.value || userAvatarUrl.value || defaultAvatar;
// });

// --- Simulate fetching user data on mount ---
onMounted(() => {
  console.log('Simulating fetching user data...');
  setTimeout(() => {
      const fetchedAvatarUrl = null;
      userAvatarUrl.value = fetchedAvatarUrl;
      userName.value = "取得したユーザー名";
      userEmail.value = "fetched@example.com";
      currentPlan.value = "プレミアム";
      userRole.value = "一般ユーザー";
      // Simulate different developer statuses for testing
      developerStatus.value = 'not_applied'; // 初めて申請する場合
      // developerStatus.value = 'rejected';    // 拒否された場合
      // developerStatus.value = 'pending';     // 申請中の場合
      // developerStatus.value = 'approved';    // 承認済みの場合
      console.log('Simulated user data fetched.');
  }, 500);
});

// --- Methods --- 
const changePassword = async () => {
  if (!passwordForm.value) return;
  const { valid } = await passwordForm.value.validate();
  if (valid) {
    console.log('Changing password...');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    passwordForm.value.resetValidation();
    alert('パスワードが変更されました。');
  } else {
    console.log('Password form validation failed');
  }
};

// --- Name Edit Methods ---
const startEditName = () => {
  editedName.value = userName.value;
  isEditingName.value = true;
};

const saveName = () => {
  if (!editedName.value) return;
  console.log('Updating name to:', editedName.value);
  userName.value = editedName.value;
  isEditingName.value = false;
  alert('名前が変更されました。');
};

const cancelEditName = () => {
  isEditingName.value = false;
};

// --- Avatar Change Methods ---
const triggerFileInput = () => {
  // Reset preview and selection before opening dialog
  // avatarPreviewUrl.value = null;
  // selectedAvatarFile.value = null;
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedAvatarFile.value = file; // Store the file for upload
    // Generate and show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreviewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    console.log('Selected file (ready for saving):', file);
  } else {
      selectedAvatarFile.value = null;
      avatarPreviewUrl.value = null; // Clear preview if selection cancelled
  }
};

const saveAvatar = async () => {
  if (!selectedAvatarFile.value) return;

  isSavingAvatar.value = true;
  console.log('Attempting to save avatar...', selectedAvatarFile.value);

  // --- Actual Upload Logic Needed Here ---
  try {
    // 1. Create FormData
    const formData = new FormData();
    formData.append('avatar', selectedAvatarFile.value);

    // 2. Call API to upload (Replace with your actual API call)
    // const response = await yourApiUploadFunction(formData);
    // --- Simulation ---
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    const response = { data: { avatarUrl: `https://placehold.jp/120x120.png?text=Saved_${Date.now()}` } }; // Simulate successful response
    // --- End Simulation ---

    // 3. IMPORTANT: Update userAvatarUrl with the *actual* URL from the server response
    if (response && response.data && response.data.avatarUrl) {
      userAvatarUrl.value = response.data.avatarUrl; // Update the permanent URL
      avatarPreviewUrl.value = null; // Clear the preview URL
      selectedAvatarFile.value = null; // Clear the selected file
      alert('アバターを保存しました。');
    } else {
      throw new Error("Invalid response from server");
    }

  } catch (error) {
    console.error("Avatar upload failed:", error);
    alert('アバターの保存に失敗しました。');
    // Keep selected file and preview for retry if needed
  } finally {
    isSavingAvatar.value = false;
  }
};

// --- Validation Rules --- 
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  minLength: (length: number) => (value: string) => (value && value.length >= length) || `${length}文字以上で入力してください。`,
  passwordMatch: (value: string) => value === newPassword.value || '新しいパスワードが一致しません。',
};

</script>

<style scoped>
/* Add specific styles if needed */
</style> 
