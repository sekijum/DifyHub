<template>
  <v-container>
    <PageTitle :title="`アプリ編集: ${editableApp.name || '...'}`" />

    <v-form ref="editForm">
      <v-card variant="outlined">
        <v-card-title class="pt-4 pb-2">基本情報</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <!-- Name (Disabled) -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editableApp.name"
                  label="名前"
                  variant="outlined"
                  density="compact"
                  disabled
                ></v-text-field>
              </v-col>
              <!-- Status (Editable) -->
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
                ></v-select>
              </v-col>
              <!-- App URL (Disabled) -->
              <v-col cols="12">
                <v-text-field
                  v-model="editableApp.appUrl"
                  label="アプリURL"
                  variant="outlined"
                  density="compact"
                  placeholder="設定されていません"
                  disabled
                ></v-text-field>
              </v-col>
              <!-- Description (Disabled) -->
              <v-col cols="12">
                 <v-textarea
                  v-model="editableApp.description"
                  label="説明"
                  rows="3"
                  variant="outlined"
                  density="compact"
                  disabled
                ></v-textarea>
              </v-col>
              <!-- Subscription Only (Disabled) -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editableApp.isSubscriptionOnly"
                  color="primary"
                  label="サブスクリプション限定"
                  hide-details
                  disabled
                ></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-divider></v-divider>

        <!-- Image Settings Section (Display Only) -->
        <v-card-title class="text-h6 pt-4 pb-1 px-4">画像設定 (表示のみ)</v-card-title>
        <v-card-text class="px-4 pt-3">
          <v-container fluid class="pa-0">
             <!-- Thumbnail Row -->
             <v-row>
                <v-col cols="12">
                    <h6 class="text-subtitle-1 font-weight-regular mb-2">サムネイル画像</h6>
                    <!-- File input removed as it's disabled -->
                    <div v-if="editableApp.thumbnailUrl" class="d-flex align-center mt-2">
                       <v-img
                         :src="editableApp.thumbnailUrl"
                         :key="editableApp.thumbnailUrl"
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
                       サムネイル画像は設定されていません。
                     </div>
                </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>

            <!-- Sub Images Row -->
            <v-row>
                <v-col cols="12">
                    <h6 class="text-subtitle-1 font-weight-regular mb-2">サブ画像</h6>
                    <!-- File input removed as it's disabled -->
                    <div v-if="editableApp.subImageUrls && editableApp.subImageUrls.length > 0" class="mt-2 d-flex flex-wrap ga-2">
                       <div v-for="(url, index) in editableApp.subImageUrls" :key="index" class="list-group-item pa-0 position-relative" style="width: 128px; height: 72px;">
                         <v-img
                           :src="url"
                           width="128"
                           height="72"
                           :aspect-ratio="16 / 9"
                           class="elevation-1 rounded"
                           cover
                           style="border: 1px solid #e0e0e0;"
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
                         <!-- Close button removed -->
                       </div>
                    </div>
                    <div v-else class="text-caption text-grey mt-2">
                       サブ画像は設定されていません。
                     </div>
                </v-col>
             </v-row>
           </v-container>
           <!-- Removed required field note -->
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelEdit">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveAppStatus" :loading="isSaving">
            ステータスを保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const appId = Number(route.params.id);

interface App {
  id: number;
  name: string;
  description: string;
  thumbnailUrl?: string;
  subImageUrls?: string[];
  status: 'published' | 'draft' | 'archived';
  isSubscriptionOnly: boolean;
  appUrl?: string;
  createdAt?: string;
  authorName?: string;
}

const editForm = ref<any>(null);
const editableApp = reactive<Partial<App>>({
    id: appId,
    name: '',
    description: '',
    status: 'draft',
    thumbnailUrl: undefined,
    subImageUrls: [],
    isSubscriptionOnly: false,
    appUrl: '',
    createdAt: '',
    authorName: '',
});
const isSaving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const statusOptions = ref([
    { title: '公開', value: 'published' },
    { title: '下書き', value: 'draft' },
    { title: 'アーカイブ', value: 'archived' },
]);

const rules = {
  required: (value: string) => !!value || '必須項目です。',
};

const generateSampleApps = (count: number): App[] => {
  const appsList: App[] = [];
  const appNames = ['顧客管理システム', '在庫追跡ツール', 'プロジェクトボード', '請求書ジェネレータ', '社内Wiki', 'イベントカレンダー', '簡易ブログエンジン', 'タスクランナー', 'URL短縮サービス', '画像リサイザー'];
  const statuses: ('published' | 'draft' | 'archived')[] = ['published', 'published', 'draft', 'archived'];
  const authors = ['管理ユーザーA', '管理ユーザーB', 'システム', '田中 太郎', '佐藤 花子'];

  for (let i = 1; i <= count; i++) {
    const name = `${appNames[Math.floor(Math.random() * appNames.length)]} #${i}`;
    const description = `これは ${name} のサンプル説明文です。様々な機能を提供します。`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isSubscriptionOnly = Math.random() < 0.3;
    const createdAt = `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
    const appUrl = Math.random() < 0.7 ? `https://example.com/app/${i}` : undefined;
    const thumbnailUrl = Math.random() > 0.2 ? `https://placehold.jp/160x90.png?text=Thumb+${i}` : undefined;
    const subImageUrls: string[] = [];
    const numSubImages = Math.floor(Math.random() * 6);
    for (let j = 0; j < numSubImages; j++) {
        if (Math.random() > 0.1) {
           subImageUrls.push(`https://placehold.jp/128x72.png?text=Sub+${i}-${j+1}`);
        }
    }
    const authorName = authors[Math.floor(Math.random() * authors.length)];
    appsList.push({ id: i, name, description, thumbnailUrl, subImageUrls: subImageUrls.slice(0, 5), status, isSubscriptionOnly, appUrl, createdAt, authorName });
  }
  return appsList;
};

onMounted(() => {
  console.log(`Fetching data for app ID: ${appId}`);
  const sampleApps = generateSampleApps(35);
  const foundApp = sampleApps.find(app => app.id === appId);

  if (foundApp) {
    Object.assign(editableApp, foundApp);
  } else {
    console.error(`App with ID ${appId} not found.`);
    snackbar.text = 'アプリが見つかりません。';
    snackbar.color = 'error';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/apps'), 2000);
  }
});

const cancelEdit = () => {
  router.push('/admin/apps');
};

const saveAppStatus = async () => {
  if (!editForm.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) {
      console.log('Status validation failed.');
      return;
  }

  isSaving.value = true;

  try {
    const payload = {
      status: editableApp.status!,
    };

    console.log(`Saving status for app ID ${appId} (simulation):`, payload);
    await new Promise(resolve => setTimeout(resolve, 500));

    snackbar.text = 'アプリのステータスを保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;

    setTimeout(() => router.push('/admin/apps'), 1500);

  } catch (error) {
    console.error("Error during status save simulation:", error);
    snackbar.text = 'ステータスの保存中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
};

</script>

<style scoped>
.list-group-item {
  display: block;
}
</style>
