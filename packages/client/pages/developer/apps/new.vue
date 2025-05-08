<template>
  <v-container>
    <PageTitle title="アプリ作成" />

    <!-- Embedding Note -->
    <v-alert
      type="warning"
      variant="tonal"
      prominent
      border="start"
      density="compact"
      class="mb-6"
      title="重要: アプリの表示と埋め込みについて"
    >
      当サービスでは、ここで設定された「アプリURL」を <code>iframe</code> を使用して表示します。 Dify 側で環境変数 <code>NEXT_PUBLIC_ALLOW_EMBED=true</code> が設定されていない場合、アプリは正しく表示されません。
      埋め込みを許可するには、必ず Dify の設定を確認してください。
      詳細は <a href="https://github.com/langgenius/dify/blob/eb92dd59f9fa893dd630f92e3db8156146a95810/web/.env.example#L33" target="_blank" rel="noopener noreferrer">Dify の .env.example</a> を参照してください。
    </v-alert>

    <v-form ref="createForm">
      <v-card variant="outlined">
        <!-- Basic Info Section -->
        <v-card-title class="text-h6 pt-4 pb-1 px-4">基本情報</v-card-title>
        <v-card-text class="px-4 pt-3">
          <v-container fluid class="pa-0">
            <v-row>
              <!-- Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newApp.name"
                  label="名前 *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <!-- Status -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="newApp.status"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
              <!-- App URL -->
              <v-col cols="12">
                <v-text-field
                  v-model="newApp.appUrl"
                  label="アプリURL"
                  variant="outlined"
                  density="compact"
                  placeholder="https://example.com/app"
                  hint="Dify アプリの「公開する」セクションにある「アプリを実行」ボタンから取得できる公開 URL を入力してください。"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <!-- Category -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="newApp.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="カテゴリ *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :loading="loadingCategories"
                ></v-select>
              </v-col>
              <!-- Tags -->
              <v-col cols="12" md="6">
                <v-combobox
                  v-model="newApp.tags"
                  :items="tags"
                  label="タグ (複数選択可, Enterで追加)"
                  multiple
                  chips
                  clearable
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hint="既存のタグを選択するか、新しいタグを入力してEnterキーを押してください。"
                  persistent-hint
                  :loading="loadingTags"
                ></v-combobox>
              </v-col>
              <!-- Description -->
              <v-col cols="12">
                 <v-textarea
                  v-model="newApp.description"
                  label="説明"
                  rows="3"
                  variant="outlined"
                  density="compact"
                  auto-grow
                ></v-textarea>
              </v-col>
               <!-- Subscription Only -->
               <v-col cols="12">
                 <v-switch
                   v-model="newApp.isSubscriptionOnly"
                   color="primary"
                   label="サブスクリプション限定"
                   hide-details
                   density="compact"
                 ></v-switch>
                 <p class="text-caption text-medium-emphasis pl-1 mt-n1">
                   有効にするとサブスクリプション登録者のみが利用可能になり、収益向上に繋がる可能性があります。
                 </p>
               </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-divider></v-divider>

        <!-- Image Settings Section -->
        <v-card-title class="text-h6 pt-4 pb-1 px-4">画像設定</v-card-title>
        <v-card-text class="px-4 pt-3">
          <v-container fluid class="pa-0">
             <!-- Thumbnail Row -->
             <v-row>
                <v-col cols="12">
                    <h6 class="text-subtitle-1 font-weight-regular mb-2">サムネイル画像</h6>
                    <v-file-input
                      v-model="thumbnailFile"
                      label="ファイルを選択 (推奨: 16:9)"
                      accept="image/*"
                      variant="outlined"
                      density="compact"
                      prepend-icon="mdi-camera"
                      show-size
                      clearable
                      :rules="[rules.imageSize]"
                      class="mb-3"
                      @update:modelValue="handleThumbnailChange"
                    ></v-file-input>

                     <!-- Thumbnail Preview Area - Conditional Rendering -->
                    <div v-if="thumbnailPreviewUrl" class="d-flex align-center mt-2">
                      <v-img
                        :src="thumbnailPreviewUrl"
                        :key="thumbnailPreviewUrl || 'no-image'"
                        width="160"
                        :aspect-ratio="16 / 9"
                        class="elevation-1 rounded mr-4 flex-shrink-0"
                        cover
                        style="border: 1px solid #e0e0e0;"
                      >
                        <template v-slot:placeholder>
                           <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                             <v-icon color="grey-darken-1" size="large">mdi-image-outline</v-icon>
                           </div>
                        </template>
                         <template v-slot:error>
                           <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                             <v-icon color="error" size="large">mdi-alert-circle-outline</v-icon>
                           </div>
                         </template>
                      </v-img>
                    </div>
                    <div v-else class="text-caption text-grey mt-2">
                       サムネイル画像を選択すると、ここにプレビューが表示されます。
                     </div>
                </v-col>
            </v-row>

            <!-- Divider -->
            <v-divider class="my-5"></v-divider>

            <!-- Sub Images Row -->
            <v-row>
                <v-col cols="12">
                    <h6 class="text-subtitle-1 font-weight-regular mb-2">サブ画像 (複数選択可, ドラッグ&ドロップで順序変更)</h6>
                    <v-file-input
                      v-model="subImageFiles"
                      label="ファイルを選択 (最大5枚まで, 推奨: 16:9)"
                      accept="image/*"
                      variant="outlined"
                      density="compact"
                      prepend-icon="mdi-image-multiple"
                      show-size
                      clearable
                      multiple
                      :rules="[rules.imageSize, rules.maxSubImages]"
                      class="mb-3"
                    ></v-file-input>

                    <!-- Sub Image Previews - Draggable Grid -->
                     <div v-if="subImagePreviews.length === 0" class="text-caption text-grey mt-2">
                       サブ画像のプレビューはありません。
                     </div>
                    <draggable
                       v-else
                       v-model="subImagePreviews"
                       item-key="id"
                       class="mt-2 d-flex flex-wrap ga-2"
                       tag="div"
                       handle=".drag-handle"
                       v-bind="dragOptions"
                       @start="drag=true"
                       @end="drag=false"
                     >
                        <template #item="{ element, index }">
                           <div class="list-group-item pa-0 position-relative" style="width: 128px; height: 72px;">
                             <v-img
                                :src="element.url"
                                :key="element.id"
                                width="128"
                                height="72"
                                :aspect-ratio="16 / 9"
                                class="elevation-1 rounded drag-handle"
                                cover
                                style="border: 1px solid #e0e0e0; cursor: move;"
                              >
                                <template v-slot:placeholder>
                                   <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                                      <v-progress-circular indeterminate size="20" width="2" color="grey-lighten-1"></v-progress-circular>
                                   </div>
                                </template>
                                <template v-slot:error>
                                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                                     <v-icon color="error" size="small">mdi-alert-circle-outline</v-icon>
                                  </div>
                                </template>
                              </v-img>
                              <v-btn
                                 icon
                                 density="compact"
                                 variant="flat"
                                 color="rgba(0, 0, 0, 0.6)"
                                 size="x-small"
                                 class="position-absolute top-0 right-0 ma-n1"
                                 @click="removeSubImage(index)"
                                 title="削除"
                               >
                                  <v-icon size="small" color="white">mdi-close</v-icon>
                               </v-btn>
                           </div>
                        </template>
                    </draggable>
                </v-col>
             </v-row>
           </v-container>
           <small class="d-block mt-4 px-4">*必須入力項目</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelCreate">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createApp" :loading="isCreating" :disabled="isCreating">
            作成する
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    <!-- トースト通知 -->
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      :timeout="toast.timeout"
      location="top"
    >
      {{ toast.message }}
      <template v-slot:actions>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="toast.show = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import PageTitle from '~/components/PageTitle.vue';
import draggable from 'vuedraggable';
import { useToast } from '@/composables/useToast';
import type { Category } from '~/types';
import { AppStatus } from '~/types';

definePageMeta({
  layout: 'developer',
});

const router = useRouter();
const { toast, showSuccessToast, showErrorToast } = useToast();

// Constants for limits
const MAX_SUB_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Interface for app data
interface AppPayload {
  name: string;
  description?: string;
  status: AppStatus;
  isSubscriptionOnly: boolean;
  appUrl?: string;
  categoryId: number;
  tags?: string[];
}

// --- カテゴリとタグのデータ ---
const categories = ref<Category[]>([]);
const tags = ref<string[]>([]);
const loadingCategories = ref(false);
const loadingTags = ref(false);

// --- Form and State ---
const createForm = ref<any>(null);
const newApp = reactive<Partial<AppPayload>>({
    name: '',
    description: '',
    status: AppStatus.DRAFT,
    isSubscriptionOnly: false,
    appUrl: '',
    categoryId: undefined,
    tags: [],
});
const isCreating = ref(false);

// Status options
const statusOptions = ref([
    { title: '公開', value: AppStatus.PUBLISHED },
    { title: '下書き', value: AppStatus.DRAFT },
    { title: '非公開', value: AppStatus.PRIVATE },
]);

// --- State for File Inputs & Previews ---
const thumbnailFile = ref<File[]>([]);
const subImageFiles = ref<File[]>([]);
const thumbnailPreviewUrl = ref<string | null>(null);

// State for draggable previews
interface SubImagePreview {
  id: string;
  url: string;
  isNew: boolean;
  file?: File;
}
const subImagePreviews = ref<SubImagePreview[]>([]);

// Draggable state and options
const drag = ref(false);
const dragOptions = computed(() => ({
  animation: 200,
  group: 'subImages',
  disabled: false,
  ghostClass: 'ghost'
}));

// --- Validation Rules ---
const rules = {
  required: (value: string | number) => !!value || '必須項目です。',
  imageSize: (files: File[] | File) => {
    const fileList = Array.isArray(files) ? files : (files ? [files] : []);
    if (!fileList || fileList.length === 0) return true;

    if (fileList.some(file => !file)) {
        return true;
    }

    const oversized = fileList.some(file => file.size > MAX_FILE_SIZE_BYTES);
    return !oversized || `画像サイズは${MAX_FILE_SIZE_MB}MB以下にしてください。`;
  },
  maxSubImages: (files: File[]) => {
    return (!files || files.length <= MAX_SUB_IMAGES) || `サブ画像は最大${MAX_SUB_IMAGES}枚までです。`;
  }
};

// --- カテゴリとタグの取得 ---
const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get('/categories');
    categories.value = response.data;
  } catch (error) {
    console.error('カテゴリ取得エラー:', error);
    showErrorToast('カテゴリの取得に失敗しました');
  } finally {
    loadingCategories.value = false;
  }
};

const fetchTags = async () => {
  loadingTags.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get('/tags');
    tags.value = response.data.map((tag: any) => tag.name);
  } catch (error) {
    console.error('タグ取得エラー:', error);
    showErrorToast('タグの取得に失敗しました');
  } finally {
    loadingTags.value = false;
  }
};

// --- Image Preview Processing ---
const readFileAsDataURL = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!file) {
        resolve(null);
        return;
    }
    if (!file.type.startsWith('image/')) {
      showErrorToast('画像ファイルを選択してください。');
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        resolve(e.target?.result as string);
    }
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      resolve(null);
    }
    reader.readAsDataURL(file);
  });
}

// --- Thumbnail Event Handler ---
const handleThumbnailChange = async (value: any) => {
  let file: File | null = null;
  if (value instanceof File) {
      file = value;
  } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      file = value[0];
      if (thumbnailFile.value[0] !== file) {
          thumbnailFile.value = [file];
      }
  } else if (Array.isArray(value) && value.length === 0) {
      file = null;
      if (thumbnailFile.value.length > 0) thumbnailFile.value = [];
  } else if (value === null || value === undefined) {
       file = null;
       if (thumbnailFile.value.length > 0) thumbnailFile.value = [];
  }

  if (file) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      thumbnailPreviewUrl.value = null;
      thumbnailFile.value = [];
      showErrorToast(`画像サイズは${MAX_FILE_SIZE_MB}MB以下にしてください。`);
      return;
    }
    const result = await readFileAsDataURL(file);
    thumbnailPreviewUrl.value = result;
  } else {
    thumbnailPreviewUrl.value = null;
  }
};

// --- Watcher for Sub Images ---
watch(subImageFiles, async (newFiles) => {
  if (!newFiles) return;

  const filesToAdd = newFiles.filter(f =>
    f &&
    !subImagePreviews.value.some(p => p.isNew && p.file === f)
  );

  if (subImagePreviews.value.length + filesToAdd.length > MAX_SUB_IMAGES) {
      showErrorToast(`サブ画像は最大${MAX_SUB_IMAGES}枚までです。`);
      try {
          const allowedToAddCount = MAX_SUB_IMAGES - subImagePreviews.value.length;
          const keptFiles = filesToAdd.slice(0, allowedToAddCount);
          subImageFiles.value = subImagePreviews.value
                                  .filter(p => p.file && newFiles.includes(p.file))
                                  .map(p => p.file as File)
                                  .concat(keptFiles);
      } catch (e) {
          console.error('Error adjusting subImageFiles:', e);
          subImageFiles.value = [];
      }
      return;
  }

  for (const file of filesToAdd) {
    if (!file) {
        continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
       showErrorToast(`画像サイズは${MAX_FILE_SIZE_MB}MB以下にしてください。`);
       subImageFiles.value = subImageFiles.value.filter(f => f !== file);
       continue;
    }

    const dataUrl = await readFileAsDataURL(file);
    if (dataUrl) {
      subImagePreviews.value.push({
        id: `new-${Date.now()}-${Math.random()}`,
        url: dataUrl,
        isNew: true,
        file: file,
      });
    } else {
       subImageFiles.value = subImageFiles.value.filter(f => f !== file);
    }
  }
}, { deep: true });

// --- Actions ---
const cancelCreate = () => {
  router.push('/developer/apps');
};

const removeSubImage = (index: number) => {
  if (index >= 0 && index < subImagePreviews.value.length) {
    const removedPreview = subImagePreviews.value.splice(index, 1)[0];
    if (removedPreview && removedPreview.isNew && removedPreview.file) {
      subImageFiles.value = subImageFiles.value.filter(f => f !== removedPreview.file);
    }
  }
};

const createApp = async () => {
  if (!createForm.value) return;
  const { valid } = await createForm.value.validate();
  if (!valid) return;

  isCreating.value = true;

  try {
    // 必須フィールドの検証
    if (!newApp.name || !newApp.categoryId || !newApp.status) {
      showErrorToast('必須項目を入力してください');
      return;
    }

    // フォームデータを作成
    const formData = new FormData();
    
    // 基本情報のフィールド (必須)
    formData.append('name', newApp.name);
    formData.append('status', newApp.status);
    formData.append('categoryId', String(newApp.categoryId));
    formData.append('isSubscriptionOnly', String(!!newApp.isSubscriptionOnly));
    
    // appUrlは必須だがフォームに入力がない場合、デフォルト値を設定
    formData.append('appUrl', newApp.appUrl || 'https://example.com');
    
    // 任意フィールド
    if (newApp.description) formData.append('description', newApp.description);
    
    // タグ
    if (newApp.tags && newApp.tags.length > 0) {
      newApp.tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });
    }
    
    // サムネイル画像
    if (thumbnailFile.value && thumbnailFile.value.length > 0) {
      formData.append('thumbnail', thumbnailFile.value[0]);
    }
    
    // サブ画像（順序を保持）
    if (subImagePreviews.value.length > 0) {
      subImagePreviews.value.forEach((preview, index) => {
        if (preview.file) {
          formData.append(`subImages[${index}]`, preview.file);
        }
      });
    }

    // デバッグ用：フォームデータの内容を確認
    console.log('送信するデータ:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const { $api } = useNuxtApp();
    const response = await $api.post('/developer/apps', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    showSuccessToast('アプリを新規作成しました');
    router.push('/developer/apps');

  } catch (error: any) {
    console.error("アプリ作成エラー:", error);
    if (error.response && error.response.data && error.response.data.message) {
      const messages = Array.isArray(error.response.data.message) 
        ? error.response.data.message.join('\n') 
        : error.response.data.message;
      showErrorToast(`作成失敗: ${messages}`);
    } else {
      showErrorToast('アプリの作成に失敗しました');
    }
  } finally {
    isCreating.value = false;
  }
};

// 初期データ読み込み
onMounted(() => {
  fetchCategories();
  fetchTags();
});

</script>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.list-group-item {
  display: block;
}
</style>
