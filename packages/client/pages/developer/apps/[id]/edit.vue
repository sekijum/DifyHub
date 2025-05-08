<template>
  <v-container>
    <PageTitle :title="`アプリ編集: ${editableApp.name || '...'}`" />

    <!-- Embedding Note -->
    <v-alert
      type="warning"
      variant="tonal"
      prominent
      border="start"
      density="compact"
      class="mb-4"
      title="重要: アプリの表示と埋め込みについて"
    >
      当サービスでは、ここで設定された「アプリURL」を <code>iframe</code> を使用して表示します。 Dify 側で環境変数 <code>NEXT_PUBLIC_ALLOW_EMBED=true</code> が設定されていない場合、アプリは正しく表示されません。
      埋め込みを許可するには、必ず Dify の設定を確認してください。
      詳細は <a href="https://github.com/langgenius/dify/blob/eb92dd59f9fa893dd630f92e3db8156146a95810/web/.env.example#L33" target="_blank" rel="noopener noreferrer">Dify の .env.example</a> を参照してください。
    </v-alert>

    <!-- 停止中アプリの通知 -->
    <v-alert
      v-if="editableApp.status === AppStatus.SUSPENDED"
      type="error"
      variant="tonal"
      prominent
      border="start"
      density="compact"
      class="mb-4"
      title="このアプリは停止中です"
    >
      このアプリは管理者によって停止されています。コンテンツポリシーに違反している可能性があります。
      詳細については管理者にお問い合わせください。
    </v-alert>

    <!-- アプリレポートセクション -->
    <v-card variant="outlined" class="mb-6" v-if="editableApp.id">
      <v-card-title class="text-h6 pt-4 pb-1 px-4">アプリレポート</v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <!-- 評価情報カード -->
            <v-col cols="12" md="4">
              <v-card variant="flat" class="report-card">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon :color="evaluationColor" size="large">{{ evaluationIcon }}</v-icon>
                  </template>
                  <v-card-title class="text-subtitle-1 font-weight-bold">評価情報</v-card-title>
                </v-card-item>
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-4">
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-2">mdi-thumb-up</v-icon>
                      <span class="text-h5 font-weight-bold">{{ likesCount }}</span>
                      <span class="text-caption ml-2">高評価</span>
                    </div>
                    <div class="d-flex align-center">
                      <v-icon color="error" class="mr-2">mdi-thumb-down</v-icon>
                      <span class="text-h5 font-weight-bold">{{ dislikesCount }}</span>
                      <span class="text-caption ml-2">低評価</span>
                    </div>
                  </div>
                  
                  <p class="text-subtitle-2 mb-1">評価レート</p>
                  <div class="d-flex align-center mb-2">
                    <div class="rating-bar-container">
                      <div class="rating-bar-positive" :style="{ width: `${likeRatio}%` }"></div>
                      <div class="rating-bar-negative" :style="{ width: `${100 - likeRatio}%` }"></div>
                    </div>
                    <span class="text-body-2 font-weight-medium ml-2">{{ likeRatio }}%</span>
                  </div>
                  
                  <div class="d-flex mt-3 align-center">
                    <v-icon size="small" :color="evaluationColor">{{ evaluationTrendIcon }}</v-icon>
                    <span class="text-caption ml-1">{{ evaluationMessage }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 使用統計カード -->
            <v-col cols="12" md="4">
              <v-card variant="flat" class="report-card">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" size="large">mdi-counter</v-icon>
                  </template>
                  <v-card-title class="text-subtitle-1 font-weight-bold">使用統計</v-card-title>
                </v-card-item>
                <v-card-text>
                  <div class="text-center mb-4">
                    <div class="text-h3 font-weight-bold usage-count">{{ formattedUsageCount }}</div>
                    <span class="text-caption text-medium-emphasis">累計使用回数</span>
                  </div>
                  
                  <v-divider class="mb-3"></v-divider>
                  
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <p class="text-subtitle-2 mb-1">公開からの期間</p>
                      <div class="d-flex align-center">
                        <v-icon color="info" size="small" class="mr-2">mdi-calendar-range</v-icon>
                        <div>
                          <span class="text-body-2 font-weight-medium">{{ formatDate(editableApp.createdAt) }}</span>
                          <div class="usage-days d-flex align-center">
                            <span class="text-caption text-medium-emphasis">{{ getDaysSinceCreation(editableApp.createdAt) }} 日経過</span>
                            <v-chip size="x-small" color="info" variant="flat" class="ml-2">
                              {{ Math.round((editableApp.usageCount || 0) / Math.max(getDaysSinceCreation(editableApp.createdAt), 1)) }}回/日
                            </v-chip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- ブックマーク情報カード -->
            <v-col cols="12" md="4">
              <v-card variant="flat" class="report-card">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon color="amber-darken-2" size="large">mdi-bookmark-multiple</v-icon>
                  </template>
                  <v-card-title class="text-subtitle-1 font-weight-bold">ブックマーク情報</v-card-title>
                </v-card-item>
                <v-card-text>
                  <div class="text-center mb-4">
                    <div class="text-h3 font-weight-bold bookmark-count">{{ bookmarkCount }}</div>
                    <span class="text-caption text-medium-emphasis">ブックマーク数</span>
                  </div>
                  
                  <v-divider class="mb-3"></v-divider>
                  
                  <div class="bookmark-metrics">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <span class="text-body-2">ブックマーク率</span>
                      <span class="text-body-2 font-weight-medium">{{ bookmarkRatio }}%</span>
                    </div>
                    <v-progress-linear
                      :model-value="bookmarkRatio"
                      color="amber-darken-2"
                      height="6"
                      rounded
                    ></v-progress-linear>
                    
                    <div class="d-flex align-center mt-3">
                      <v-icon size="small" color="amber-darken-2" class="mr-2">mdi-information-outline</v-icon>
                      <span class="text-caption">ブックマーク数が多いほど人気度が高いことを示します</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>

    <v-form ref="editForm">
      <v-card variant="outlined">
        <v-card-title class="pt-4 pb-2">基本情報</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <!-- Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editableApp.name"
                  label="名前 *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :disabled="isEditDisabled"
                ></v-text-field>
              </v-col>
              <!-- Status -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editableApp.status"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :disabled="editableApp.status === AppStatus.SUSPENDED"
                ></v-select>
              </v-col>
              <!-- App URL -->
              <v-col cols="12">
                <v-text-field
                  v-model="editableApp.appUrl"
                  label="アプリURL"
                  variant="outlined"
                  density="compact"
                  placeholder="https://example.com/app"
                  hint="Dify アプリの「公開する」セクションにある「アプリを実行」ボタンから取得できる公開 URL を入力してください。"
                  persistent-hint
                  :disabled="isEditDisabled"
                ></v-text-field>
              </v-col>
              <!-- Category -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editableApp.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="カテゴリ *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :loading="loadingCategories"
                  :disabled="isEditDisabled"
                ></v-select>
              </v-col>
              <!-- Tags -->
              <v-col cols="12" md="6">
                 <v-combobox
                  v-model="editableApp.tags"
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
                  :disabled="isEditDisabled"
                ></v-combobox>
              </v-col>
              <!-- Description -->
              <v-col cols="12">
                 <v-textarea
                  v-model="editableApp.description"
                  label="説明"
                  rows="3"
                  variant="outlined"
                  density="compact"
                  :disabled="isEditDisabled"
                ></v-textarea>
              </v-col>
              <!-- Subscription Only -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editableApp.isSubscriptionOnly"
                  color="primary"
                  label="サブスクリプション限定"
                  hide-details
                  :disabled="isEditDisabled"
                ></v-switch>
                 <p class="text-caption text-medium-emphasis pl-1">
                   有効にするとサブスクリプション登録者のみが利用可能になり、収益向上に繋がる可能性があります。
                 </p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-divider></v-divider>
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
                      :disabled="isEditDisabled"
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
                          <!-- Placeholder/Error slots -->
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
                      :disabled="isEditDisabled"
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
                       :disabled="isEditDisabled"
                     >
                        <template #item="{ element, index }">
                           <!-- Adjusted container size for 16:9 -->
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
                                <!-- Placeholder/Error slots -->
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
                              <!-- Close button -->
                              <v-btn
                                 icon
                                 density="compact"
                                 variant="flat"
                                 color="rgba(0, 0, 0, 0.6)"
                                 size="x-small"
                                 class="position-absolute top-0 right-0 ma-n1"
                                 @click="removeSubImage(index)"
                                 title="削除"
                                 :disabled="isEditDisabled"
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
          <v-btn variant="text" @click="cancelEdit">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveApp" :loading="isSaving" :disabled="isSaving || isEditDisabled">
            保存
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
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import PageTitle from '~/components/PageTitle.vue';
import draggable from 'vuedraggable';
import { useToast } from '@/composables/useToast';
import axios from 'axios';
import type { App, Category } from '~/types';
import { AppStatus } from '~/types';

definePageMeta({
  layout: 'developer',
});

const route = useRoute();
const router = useRouter();
const { toast, showSuccessToast, showErrorToast } = useToast();
const appId = Number(route.params.id);

// アプリ取得中フラグ
const isLoading = ref(true);

// Constants for limits
const MAX_SUB_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- カテゴリとタグのデータ ---
const categories = ref<Category[]>([]);
const tags = ref<string[]>([]);
const loadingCategories = ref(false);
const loadingTags = ref(false);

// --- Form and State ---
const editForm = ref<any>(null);
const editableApp = reactive<Partial<App>>({
    id: appId,
    name: '',
    description: '',
    status: AppStatus.DRAFT,
    thumbnailUrl: undefined,
    subImageUrls: [],
    isSubscriptionOnly: false,
    appUrl: '',
    createdAt: '',
    categoryId: undefined,
    tags: [],
});
const isSaving = ref(false);

// 編集の無効化
const isEditDisabled = computed(() => {
  // 停止中の場合のみ全体の編集を無効化
  return editableApp.status === AppStatus.SUSPENDED;
});

// Status options
const statusOptions = ref([
    { title: '公開', value: AppStatus.PUBLISHED },
    { title: '下書き', value: AppStatus.DRAFT },
    { title: '非公開', value: AppStatus.PRIVATE },
    { title: 'アーカイブ', value: AppStatus.ARCHIVED },
]);

// --- State for File Inputs & Previews ---
const thumbnailFile = ref<File[]>([]);
const subImageFiles = ref<File[]>([]);
const thumbnailPreviewUrl = ref<string | null>(null);
const originalThumbnailUrl = ref<string | null>(null);

// Draggable previews state
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
  disabled: isEditDisabled.value,
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
     return (subImagePreviews.value.length <= MAX_SUB_IMAGES) || `サブ画像は最大${MAX_SUB_IMAGES}枚までです。`;
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
    // 文字列の配列として正しく取得
    tags.value = response.data.map((tag: any) => tag.name || tag);
  } catch (error) {
    console.error('タグ取得エラー:', error);
    showErrorToast('タグの取得に失敗しました');
  } finally {
    loadingTags.value = false;
  }
};

// --- Helper Functions ---
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (e) { 
    console.error('Error formatting date:', dateString, e); 
    return 'N/A'; 
  }
};

function getDaysSinceCreation(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// appDataを追加して、レポート用のデータを保持
const appData = ref<any>(null);

// fetchAppDataを修正して、アプリ統計情報を取得
const fetchAppData = async () => {
  isLoading.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get<App>(`/developer/apps/${appId}`);
    const fetchedData = response.data;
    
    // appDataを保存
    appData.value = fetchedData;
    
    // データをeditableAppにセット
    Object.assign(editableApp, fetchedData);
    
    // 高評価・低評価数が設定されていない場合のデフォルト値設定
    if (!appData.value.likesCount) appData.value.likesCount = 0;
    if (!appData.value.dislikesCount) appData.value.dislikesCount = 0;
    
    // likeRatioが設定されていない場合は計算
    if (appData.value.likesCount || appData.value.dislikesCount) {
      const total = (appData.value.likesCount || 0) + (appData.value.dislikesCount || 0);
      if (total > 0) {
        appData.value.likeRatio = Math.round((appData.value.likesCount / total) * 100);
      } else {
        appData.value.likeRatio = 0;
      }
    } else {
      appData.value.likeRatio = 0;
    }
    
    // タグデータが配列でなかったり、オブジェクトだった場合の対処
    if (fetchedData.tags) {
      if (typeof fetchedData.tags === 'string') {
        editableApp.tags = [fetchedData.tags];
      } else if (Array.isArray(fetchedData.tags)) {
        // どのような形式でも文字列の配列に変換
        editableApp.tags = fetchedData.tags.map(tag => {
          if (tag === null) return '';
          if (typeof tag === 'object') {
            // タイプアサーションでエラーを回避
            const tagObj = tag as Record<string, any>;
            return String(tagObj.name || JSON.stringify(tag));
          }
          return String(tag);
        });
      }
    }
    
    // サムネイルとサブ画像の設定
    thumbnailPreviewUrl.value = fetchedData.thumbnailUrl || null;
    originalThumbnailUrl.value = fetchedData.thumbnailUrl || null;
    
    if (fetchedData.subImageUrls && fetchedData.subImageUrls.length > 0) {
      subImagePreviews.value = fetchedData.subImageUrls.map((url: string) => ({
        id: url,
        url: url,
        isNew: false,
      }));
    } else {
      subImagePreviews.value = [];
    }
    
    // ファイル入力のリセット
    thumbnailFile.value = [];
    subImageFiles.value = [];
    
  } catch (error) {
    console.error(`アプリ(ID: ${appId})の取得に失敗しました:`, error);
    showErrorToast('アプリデータの取得に失敗しました');
    setTimeout(() => router.push('/developer/apps'), 1500);
  } finally {
    isLoading.value = false;
  }
};

// 初期データ読み込み
onMounted(() => {
  Promise.all([
    fetchCategories(),
    fetchTags(),
    fetchAppData()
  ]);
});

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
      if (thumbnailFile.value[0] !== file) thumbnailFile.value = [file];
  } else if (Array.isArray(value) && value.length === 0) {
      file = null;
      if (thumbnailFile.value.length > 0) thumbnailFile.value = [];
  } else if (value === null || value === undefined) {
       file = null;
       if (thumbnailFile.value.length > 0) thumbnailFile.value = [];
  }

  if (file) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      thumbnailPreviewUrl.value = originalThumbnailUrl.value;
      thumbnailFile.value = [];
      showErrorToast(`画像サイズは${MAX_FILE_SIZE_MB}MB以下にしてください。`);
      return;
    }
    const result = await readFileAsDataURL(file);
    thumbnailPreviewUrl.value = result;
  } else {
    thumbnailPreviewUrl.value = originalThumbnailUrl.value;
    thumbnailFile.value = [];
  }
};

// --- Sub Images Watcher ---
watch(subImageFiles, async (newFiles, oldFiles) => {
  if (!newFiles || isEditDisabled.value) return;

  const oldFileSet = new Set(oldFiles || []);
  const filesToAdd = newFiles.filter(f => f && !oldFileSet.has(f));

  if (subImagePreviews.value.length + filesToAdd.length > MAX_SUB_IMAGES) {
      showErrorToast(`サブ画像は最大${MAX_SUB_IMAGES}枚までです。`);
      const currentFiles = subImagePreviews.value.filter(p => p.isNew && p.file).map(p => p.file as File);
      const allowedNewFilesCount = MAX_SUB_IMAGES - subImagePreviews.value.length;
      const filesToKeep = filesToAdd.slice(0, Math.max(0, allowedNewFilesCount));
      subImageFiles.value = [...currentFiles, ...filesToKeep];
      return;
  }

  for (const file of filesToAdd) {
    if (!file) continue;
    
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
const cancelEdit = () => {
  router.push('/developer/apps');
};

const removeSubImage = (index: number) => {
  if (isEditDisabled.value) return;
  
  if (index >= 0 && index < subImagePreviews.value.length) {
    const removedPreview = subImagePreviews.value.splice(index, 1)[0];
    if (removedPreview && removedPreview.isNew && removedPreview.file) {
      subImageFiles.value = subImageFiles.value.filter(f => f !== removedPreview.file);
    }
  }
};

const saveApp = async () => {
  if (!editForm.value) return;
  if (isEditDisabled.value) return;
  
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  isSaving.value = true;

  try {
    // 必須フィールドの検証
    if (!editableApp.name || !editableApp.categoryId || !editableApp.status) {
      showErrorToast('必須項目を入力してください');
      isSaving.value = false;
      return;
    }

    console.log('送信前のステータス:', editableApp.status);

    // JSON形式で送信するデータを準備
    const formData = new FormData();
    const jsonData: {
      name: string;
      status: AppStatus;
      categoryId: number;
      isSubscriptionOnly: boolean;
      appUrl: string;
      description?: string;
      tags?: string[];
      removeThumbnail?: boolean;
      existingSubImageIds?: string[];
    } = {
      name: editableApp.name,
      status: editableApp.status,
      categoryId: editableApp.categoryId,
      isSubscriptionOnly: !!editableApp.isSubscriptionOnly,
      appUrl: editableApp.appUrl || 'https://example.com'
    };

    // 任意フィールドを追加
    if (editableApp.description !== undefined) {
      jsonData.description = editableApp.description;
    }
    
    // タグの処理
    if (editableApp.tags && editableApp.tags.length > 0) {
      const tagNames = editableApp.tags.map(tag => {
        if (typeof tag === 'string') {
          return tag;
        } else if (tag && typeof tag === 'object') {
          // タグがオブジェクトの場合（タイプガードを追加）
          return 'name' in tag && typeof tag.name === 'string' 
            ? tag.name 
            : String(tag);
        }
        return String(tag); // その他の型を文字列に変換
      }).filter(Boolean); // 空の値を除外
      
      jsonData.tags = tagNames;
    }

    // FormDataに変換
    formData.append('data', JSON.stringify(jsonData));
    
    // サムネイル画像（新しい画像がある場合）
    if (thumbnailFile.value && thumbnailFile.value.length > 0) {
      formData.append('thumbnail', thumbnailFile.value[0]);
    } else if (!thumbnailPreviewUrl.value && originalThumbnailUrl.value) {
      // サムネイルが削除された場合、明示的に削除を指示
      jsonData.removeThumbnail = true;
    }
    
    // サブ画像（順序を保持）
    const existingSubImageIds: string[] = [];
    const subImagesToUpload: File[] = [];
    
    subImagePreviews.value.forEach((preview) => {
      if (preview.isNew && preview.file) {
        subImagesToUpload.push(preview.file);
      } else if (!preview.isNew) {
        existingSubImageIds.push(preview.id);
      }
    });
    
    // 既存のサブ画像IDを送信（削除や順序変更用）
    if (existingSubImageIds.length > 0) {
      jsonData.existingSubImageIds = existingSubImageIds;
    }
    
    // 新しいサブ画像をアップロード
    if (subImagesToUpload.length > 0) {
      subImagesToUpload.forEach((file, index) => {
        formData.append(`newSubImages[${index}]`, file);
      });
    }

    // データをJSON文字列として再設定（サブ画像IDsを含めるため）
    formData.set('data', JSON.stringify(jsonData));

    // デバッグ用：送信するデータの内容を確認
    console.log('送信するJSON:', jsonData);
    console.log('送信するFormData:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const { $api } = useNuxtApp();
    const response = await $api.patch(`/developer/apps/${appId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('サーバーからの応答:', response.data);
    showSuccessToast('アプリ情報を保存しました');
    setTimeout(() => router.push('/developer/apps'), 1500);

  } catch (error: any) {
    console.error("アプリ更新エラー:", error);
    if (error.response && error.response.data && error.response.data.message) {
      const messages = Array.isArray(error.response.data.message) 
        ? error.response.data.message.join('\n') 
        : error.response.data.message;
      showErrorToast(`更新失敗: ${messages}`);
    } else {
      showErrorToast('アプリの更新に失敗しました');
    }
  } finally {
    isSaving.value = false;
  }
};

// 高評価/低評価のカラー判定とアイコン
const evaluationColor = computed(() => {
  const likesCount = getLikesCount();
  const dislikesCount = getDislikesCount();
  
  if (likesCount > dislikesCount) {
    return 'primary'; // 高評価が多い場合は青
  } else if (dislikesCount > likesCount) {
    return 'error'; // 低評価が多い場合は赤
  } else {
    return 'grey'; // 同数の場合はグレー
  }
});

const evaluationIcon = computed(() => {
  const likesCount = getLikesCount();
  const dislikesCount = getDislikesCount();
  
  if (likesCount > dislikesCount) {
    return 'mdi-thumb-up';
  } else if (dislikesCount > likesCount) {
    return 'mdi-thumb-down';
  } else {
    return 'mdi-thumbs-up-down';
  }
});

const evaluationTrendIcon = computed(() => {
  const likesCount = getLikesCount();
  const dislikesCount = getDislikesCount();
  
  if (likesCount > dislikesCount) {
    return 'mdi-trending-up';
  } else if (dislikesCount > likesCount) {
    return 'mdi-trending-down';
  } else {
    return 'mdi-trending-neutral';
  }
});

const evaluationMessage = computed(() => {
  const likesCount = getLikesCount();
  const dislikesCount = getDislikesCount();
  const likeRatio = appData.value?.likeRatio || 0;
  
  if (likesCount > dislikesCount) {
    return `高評価が多く好評です。現在の高評価率は${likeRatio}%です。`;
  } else if (dislikesCount > likesCount) {
    return `低評価が多いため改善の余地があります。現在の高評価率は${likeRatio}%です。`;
  } else {
    return '評価が同数か、まだ評価がありません。';
  }
});

// レーティングデータから高評価数を取得
const getLikesCount = (): number => {
  // バックエンドから直接取得した高評価数を利用
  if (appData.value?.likesCount !== undefined) {
    return appData.value.likesCount;
  }
  
  // 従来のデータ構造の場合のフォールバック
  if (appData.value?.ratings) {
    return appData.value.ratings.filter((rating: { type: string }) => rating.type === 'LIKE').length;
  }
  
  return 0;
};

// レーティングデータから低評価数を取得
const getDislikesCount = (): number => {
  // バックエンドから直接取得した低評価数を利用
  if (appData.value?.dislikesCount !== undefined) {
    return appData.value.dislikesCount;
  }
  
  // 従来のデータ構造の場合のフォールバック
  if (appData.value?.ratings) {
    return appData.value.ratings.filter((rating: { type: string }) => rating.type === 'DISLIKE').length;
  }
  
  return 0;
};

// 高評価数を計算して返す
const likesCount = computed(() => {
  return getLikesCount();
});

// 低評価数を計算して返す
const dislikesCount = computed(() => {
  return getDislikesCount();
});

// 使用回数のフォーマット
const formattedUsageCount = computed(() => {
  const count = editableApp.usageCount || 0;
  return count.toLocaleString();
});

// ブックマーク率の計算
const bookmarkRatio = computed(() => {
  const bCount = appData.value?._count?.bookmarks || 0;
  const usageCount = editableApp.usageCount || 0;
  
  if (usageCount === 0) return 0;
  return Math.round((bCount / usageCount) * 100);
});

// 評価率を計算
const likeRatio = computed(() => {
  const likes = getLikesCount();
  const dislikes = getDislikesCount();
  const total = likes + dislikes;
  
  if (total === 0) return 0;
  return Math.round((likes / total) * 100);
});

// ブックマーク数を取得
const bookmarkCount = computed(() => {
  // バックエンドから直接取得したブックマーク数を利用
  if (appData.value?.bookmarkCount !== undefined) {
    return appData.value.bookmarkCount;
  }
  
  // 従来のデータ構造の場合のフォールバック
  if (appData.value?._count?.bookmarks !== undefined) {
    return appData.value._count.bookmarks;
  }
  
  return 0;
});

</script>

<style scoped>
.report-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 12px;
  height: 100%;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow: hidden;
}

.report-card:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.08);
  transform: translateY(-3px);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.metrics-card {
  border: 1px solid rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 12px;
  background-color: rgba(var(--v-theme-surface), 1);
}

.metric-item {
  flex: 1;
  min-width: 120px;
}

.rating-bar-container {
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(var(--v-theme-error), 0.2);
}

.rating-bar-positive {
  height: 100%;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.5s ease;
}

.rating-bar-negative {
  height: 100%;
  background-color: transparent;
}

.usage-count, .bookmark-count {
  color: rgb(var(--v-theme-primary));
  text-shadow: 0 1px 2px rgba(var(--v-theme-on-surface), 0.05);
  animation: countFadeIn 1s ease-out;
}

.usage-days {
  margin-top: 4px;
}

.bookmark-metrics {
  padding: 0 8px;
}

.pagination-select {
  width: 100px;
}

@keyframes countFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ダークモード調整 */
:deep(.v-theme--dark) .report-card {
  background-color: rgba(var(--v-theme-surface-variant), 0.05);
}

:deep(.v-theme--dark) .rating-bar-container {
  background-color: rgba(var(--v-theme-error), 0.3);
}

/* 既存のスタイル */
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.list-group-item {
  display: block;
}
</style>
