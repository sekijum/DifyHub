<template>
  <v-container>
    <v-row align="center">
       <v-col>
         <PageTitle title="ブックマーク" />
       </v-col>
       <v-col class="d-flex justify-end">
         <v-btn
            color="primary"
            prepend-icon="mdi-plus-circle-outline"
            @click="openCreateFolderDialog"
            variant="tonal"
         >
            フォルダ作成
         </v-btn>
       </v-col>
     </v-row>

    <!-- Loading Indicator -->
    <v-row v-if="loading" justify="center" class="my-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <!-- Error Message (for initial load only) -->
    <v-row v-else-if="error && !Object.keys(bookmarksByDestination).length" justify="center">
       <v-col cols="12" md="8">
         <v-alert type="error" prominent border="start" class="my-4">
           ブックマークの読み込みに失敗しました。時間をおいて再度お試しください。
           <div v-if="error.message" class="text-caption mt-2">詳細: {{ error.message }}</div>
         </v-alert>
       </v-col>
     </v-row>

    <!-- Main Content Area -->
    <template v-else>

      <!-- Desktop Layout -->
      <v-row v-if="display.mdAndUp.value && hasBookmarks">
         <v-col cols="12" md="3">
           <v-list density="compact" nav>
             <v-list-subheader>保存先</v-list-subheader>
             <v-list-item
               v-for="dest in sortedFolderNames"
               :key="bookmarksByDestination[dest].id"
               :value="dest"
               :active="selectedDestination === dest"
               @click="selectedDestination = dest"
               color="primary"
               variant="plain"
               class="folder-list-item"
             >
               <v-list-item-title>{{ dest }}</v-list-item-title>
               <template v-slot:append>
                 <v-chip size="x-small" class="mr-1">{{ bookmarksByDestination[dest].apps.length ?? 0 }}</v-chip>
                 <v-menu location="end" v-if="!bookmarksByDestination[dest].isDefault">
                   <template v-slot:activator="{ props }">
                     <v-btn
                       icon="mdi-dots-vertical"
                       size="x-small"
                       variant="text"
                       color="grey"
                       v-bind="props"
                       @click.stop
                       class="folder-action-btn folder-action-placeholder"
                       title="フォルダオプション"
                    ></v-btn>
                   </template>
                   <v-list density="compact">
                     <v-list-item @click="openRenameDialog(dest)">
                        <template v-slot:prepend>
                          <v-icon>mdi-pencil-outline</v-icon>
                        </template>
                        <v-list-item-title>名前の変更</v-list-item-title>
                      </v-list-item>
                     <v-list-item @click="openDeleteConfirmation(dest)">
                       <template v-slot:prepend>
                         <v-icon color="error">mdi-delete-outline</v-icon>
                       </template>
                       <v-list-item-title>削除</v-list-item-title>
                     </v-list-item>
                   </v-list>
                 </v-menu>
                 <div v-else class="folder-action-placeholder"></div>
               </template>
             </v-list-item>
           </v-list>
         </v-col>
         <v-col cols="12" md="9">
           <div v-if="selectedDestination">
             <h2 class="text-h6 font-weight-medium mb-3">{{ selectedDestination }}</h2>
             <v-row v-if="appsInSelectedDestination.length > 0">
               <v-col
                 v-for="app in appsInSelectedDestination"
                 :key="app.id"
                 cols="12"
                 sm="6"
                 md="4"
                 lg="4"
               >
                 <AppCard
                   :app="app"
                   :is-bookmarked="true"
                   @title-click="goToAppDetail(app.id)"
                   @toggle-bookmark="handleToggleBookmark(app.id)"
                   @creator-click="app.creatorId ? goToUserProfile(app.creatorId) : undefined"
                 />
               </v-col>
             </v-row>
             <p v-else class="text-medium-emphasis pa-4">この保存先にはアプリがありません。</p>
           </div>
           <div v-else class="text-center text-medium-emphasis pa-10">
             <p>左のリストから保存先を選択してください。</p>
           </div>
         </v-col>
      </v-row>

      <!-- Mobile Layout -->
      <div v-else-if="!display.mdAndUp.value && hasBookmarks">
         <div v-if="viewMode === 'list'">
           <v-list density="compact" nav>
             <v-list-subheader>保存先</v-list-subheader>
             <v-list-item
               v-for="dest in sortedFolderNames"
               :key="bookmarksByDestination[dest].id"
               :value="dest"
               @click="selectDestination(dest)"
               color="primary"
               variant="plain"
               class="folder-list-item"
             >
               <v-list-item-title>{{ dest }}</v-list-item-title>
               <template v-slot:append>
                 <v-chip size="x-small" class="mr-1">{{ bookmarksByDestination[dest].apps.length ?? 0 }}</v-chip>
                 <v-menu location="end" v-if="!bookmarksByDestination[dest].isDefault">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        icon="mdi-dots-vertical"
                        size="x-small"
                        variant="text"
                        color="grey"
                        v-bind="props"
                        @click.stop
                        class="folder-action-btn folder-action-placeholder"
                        title="フォルダオプション"
                     ></v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item @click="openRenameDialog(dest)">
                         <template v-slot:prepend>
                           <v-icon>mdi-pencil-outline</v-icon>
                         </template>
                         <v-list-item-title>名前の変更</v-list-item-title>
                       </v-list-item>
                      <v-list-item @click="openDeleteConfirmation(dest)">
                        <template v-slot:prepend>
                          <v-icon color="error">mdi-delete-outline</v-icon>
                        </template>
                        <v-list-item-title>削除</v-list-item-title>
                      </v-list-item>
                    </v-list>
                 </v-menu>
                 <div v-else class="folder-action-placeholder"></div>
               </template>
             </v-list-item>
           </v-list>
         </div>
         <div v-else-if="viewMode === 'apps' && selectedDestination">
            <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="showListView" class="mb-2">
               保存先リストに戻る
             </v-btn>
            <h2 class="text-h6 font-weight-medium mb-3">{{ selectedDestination }}</h2>
            <v-row v-if="appsInSelectedDestination.length > 0">
               <v-col
                 v-for="app in appsInSelectedDestination"
                 :key="app.id"
                 cols="12"
                 sm="6"
               >
                 <AppCard
                   :app="app"
                   :is-bookmarked="true"
                   @title-click="goToAppDetail(app.id)"
                   @toggle-bookmark="handleToggleBookmark(app.id)"
                   @creator-click="app.creatorId ? goToUserProfile(app.creatorId) : undefined"
                 />
               </v-col>
             </v-row>
             <p v-else class="text-medium-emphasis pa-4">この保存先にはアプリがありません。</p>
         </div>
      </div>

      <!-- No Bookmarks/Folders Message (Handles hasBookmarks === false after loading/no error) -->
      <v-row v-else-if="!hasBookmarks" justify="center">
         <v-col cols="auto" class="text-center text-medium-emphasis mt-10">
            <v-icon size="x-large" class="mb-2">mdi-bookmark-multiple-outline</v-icon>
            <p>ブックマークフォルダがまだありません。</p>
            <v-btn
               color="primary"
               prepend-icon="mdi-plus-circle-outline"
               @click="openCreateFolderDialog"
               variant="tonal"
               class="mt-4"
            >
               最初のフォルダを作成
            </v-btn>
         </v-col>
      </v-row>

    </template>

    <!-- Create Folder Dialog -->
    <v-dialog v-model="createFolderDialogVisible" persistent max-width="450">
      <v-card :loading="creatingFolderLoading">
        <v-card-title class="text-h5">
          新しいブックマークフォルダ作成
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newFolderName"
            label="フォルダ名"
            variant="outlined"
            density="compact"
            :error-messages="creatingFolderError ? creatingFolderError.message : undefined"
            :disabled="creatingFolderLoading"
            @keydown.enter="handleCreateFolder"
            autofocus
          ></v-text-field>
           <div v-if="creatingFolderError && !creatingFolderError.message" class="text-error text-caption">
             予期せぬエラーが発生しました。
           </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey darken-1"
            text
            @click="cancelCreateFolder"
            :disabled="creatingFolderLoading"
          >
            キャンセル
          </v-btn>
          <v-btn
            color="primary"
            @click="handleCreateFolder"
            :loading="creatingFolderLoading"
            :disabled="creatingFolderLoading || !newFolderName.trim()"
          >
            作成
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rename Folder Dialog -->
    <v-dialog v-model="renameDialogVisible" persistent max-width="450">
       <v-card :loading="renamingFolderLoading">
         <v-card-title class="text-h5">
           フォルダ名の変更
         </v-card-title>
         <v-card-text>
           <v-text-field
             id="rename-folder-input"
             v-model="newFolderNameForRename"
             :label="`現在の名前: ${folderToRename?.currentName}`"
             variant="outlined"
             density="compact"
             :error-messages="renamingFolderError ? renamingFolderError.message : undefined"
             :disabled="renamingFolderLoading"
             @keydown.enter="confirmRenameFolder"
             autofocus
           ></v-text-field>
            <div v-if="renamingFolderError && !renamingFolderError.message" class="text-error text-caption">
              予期せぬエラーが発生しました。
            </div>
         </v-card-text>
         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn
             color="grey darken-1"
             text
             @click="cancelRenameFolder"
             :disabled="renamingFolderLoading"
           >
             キャンセル
           </v-btn>
           <v-btn
             color="primary"
             @click="confirmRenameFolder"
             :loading="renamingFolderLoading"
             :disabled="renamingFolderLoading || !newFolderNameForRename.trim() || newFolderNameForRename.trim() === folderToRename?.currentName"
           >
             変更を保存
           </v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogVisible" persistent max-width="400">
       <v-card>
         <v-card-title class="text-h5">
           フォルダ削除の確認
         </v-card-title>
         <v-card-text>
           フォルダ「<strong>{{ folderNameToDelete }}</strong>」を削除してもよろしいですか？
           <br>
           このフォルダ内のすべてのブックマークも削除されます。
           <v-progress-linear v-if="deletingFolderLoading" indeterminate color="primary" class="mt-3"></v-progress-linear>
         </v-card-text>
         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn
             color="grey darken-1"
             text
             @click="cancelDeleteFolder"
             :disabled="deletingFolderLoading"
           >
             キャンセル
           </v-btn>
           <v-btn
             color="error darken-1"
             text
             @click="confirmDeleteFolder"
             :loading="deletingFolderLoading"
             :disabled="deletingFolderLoading"
           >
             削除
           </v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbarVisible"
      :timeout="6000"
      :color="snackbarColor"
      location="bottom right"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbarVisible = false"
        >
          閉じる
        </v-btn>
      </template>
    </v-snackbar>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useNuxtApp } from '#app';
import AppCard from '~/components/AppCard.vue';
import PageTitle from '~/components/PageTitle.vue';

// Define the App interface (consistent with AppCard and API response)
interface App {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likes: number;
  dislikes?: number;
  usageCount: number;
  isBookmarked: boolean;
  requiresSubscription: boolean;
  creatorId?: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null | undefined;
}

// Type for the App object as returned within the Bookmark in the API response
interface ApiAppInBookmark extends Omit<App, 'isBookmarked' | 'requiresSubscription' | 'likes' | 'dislikes'> {
  isSubscriptionLimited: boolean;
  category?: { id: number; name: string } | null;
  creator?: { id: number; name: string; avatarUrl: string | null; } | null;
}

// Type for a single bookmark item from the API
interface ApiBookmarkItem {
  app: ApiAppInBookmark; // Use the specific interface for the nested app
  // bookmark specific fields like createdAt if needed
  createdAt: string;
  // ... other bookmark fields
}

// Type for bookmark folder data from API
interface ApiBookmarkFolder {
  id: number;
  name: string;
  userId: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookmarks: number;
  };
  bookmarks: ApiBookmarkItem[]; // Use the bookmark item type
}

// Interface for the Bookmark object returned by the POST /me/bookmarks endpoint on creation
interface Bookmark {
    id: number;
    userId: number;
    appId: number;
    folderId: number;
    createdAt: string;
    updatedAt: string;
}

// Updated Bookmarks interface to hold folder metadata
interface FolderData {
    apps: App[];
    id: number;
    isDefault: boolean;
}
interface Bookmarks {
  [destination: string]: FolderData; // Key is folder name (destination)
}

// --- Nuxt App Composables ---
const { $api } = useNuxtApp();
const router = useRouter();
const display = useDisplay();

// --- Reactive State ---
const bookmarksByDestination = ref<Bookmarks>({});
const selectedDestination = ref<string | null>(null);
const viewMode = ref<'list' | 'apps'>('list');
const loading = ref(false); // For initial load
const error = ref<any>(null); // For initial load error
const newFolderName = ref(''); // For folder creation form
const creatingFolderLoading = ref(false);
const creatingFolderError = ref<any>(null); // Keep for form validation feedback
const deleteDialogVisible = ref(false); // For delete confirmation dialog
const folderNameToDelete = ref<string | null>(null);
const folderIdToDelete = ref<number | null>(null);
const deletingFolderLoading = ref(false);
// deletingFolderError is removed, use snackbar
const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('info'); // 'success', 'error', 'info', 'warning'
const createFolderDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const folderToRename = ref<{ id: number; currentName: string } | null>(null);
const newFolderNameForRename = ref('');
const renamingFolderLoading = ref(false);
const renamingFolderError = ref<any>(null);

// --- Helper Functions ---
const showSnackbar = (message: string, color: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbarVisible.value = true;
};

// --- Load Bookmarks ---
const loadAndGroupBookmarks = async () => {
  console.log("Fetching bookmarks from API...");
  loading.value = true;
  error.value = null;
  bookmarksByDestination.value = {};
  selectedDestination.value = null;
  viewMode.value = 'list';

  try {
    const response = await $api.get<ApiBookmarkFolder[]>('/me/bookmark-folders');
    const data = response.data;

    if (data) {
      const grouped: Bookmarks = {};

      data.forEach((folder: ApiBookmarkFolder) => {
        const appsInFolder: App[] = folder.bookmarks.map((bookmark: ApiBookmarkItem) => ({
          id: bookmark.app.id,
          name: bookmark.app.name,
          description: bookmark.app.description || '',
          imageUrl: bookmark.app.imageUrl ?? 'https://placehold.jp/300x300.png?text=No+Image',
          likes: 0,
          usageCount: bookmark.app.usageCount,
          isBookmarked: true,
          requiresSubscription: bookmark.app.isSubscriptionLimited,
          category: bookmark.app.category,
          creatorId: bookmark.app.creator?.id,
          creatorName: bookmark.app.creator?.name,
          creatorAvatarUrl: bookmark.app.creator?.avatarUrl,
        }));
        // Store apps, id, and isDefault together
        grouped[folder.name] = {
            apps: appsInFolder,
            id: folder.id,
            isDefault: folder.isDefault,
        };
      });

      bookmarksByDestination.value = grouped;

      if (display.mdAndUp.value && !selectedDestination.value) {
        const destinations = Object.keys(grouped);
        if (destinations.length > 0) {
          selectedDestination.value = destinations[0];
        }
      }
    } else {
       console.warn('No bookmark data received from API or empty response.');
    }
  } catch (err: any) {
    console.error('Failed to load bookmarks:', err);
    error.value = err; // Still use this for page-level load error
    showSnackbar('ブックマークの読み込みに失敗しました。' + (err?.response?.data?.message || err?.message || ''), 'error');
  } finally {
      loading.value = false;
  }
};


// --- Computed Property ---
const appsInSelectedDestination = computed((): App[] => {
  if (selectedDestination.value && bookmarksByDestination.value[selectedDestination.value]) {
    return bookmarksByDestination.value[selectedDestination.value].apps;
  }
  return [];
});

const hasBookmarks = computed(() => {
  // Check if any folder exists (even if empty)
  return !loading.value && !error.value && Object.keys(bookmarksByDestination.value).length > 0;
});

// Get folder list sorted potentially (e.g., default first, then alphabetically)
const sortedFolderNames = computed(() => {
    return Object.keys(bookmarksByDestination.value).sort((a, b) => {
        const folderA = bookmarksByDestination.value[a];
        const folderB = bookmarksByDestination.value[b];
        if (folderA.isDefault && !folderB.isDefault) return -1;
        if (!folderA.isDefault && folderB.isDefault) return 1;
        return a.localeCompare(b); // Alphabetical otherwise
    });
});

// --- Event Handlers ---
const goToAppDetail = (appId: number) => {
  router.push(`/apps/${appId}`);
};

const handleToggleBookmark = async (appId: number) => {
  if (!selectedDestination.value) {
    console.error("Cannot toggle bookmark without a selected destination.");
    showSnackbar('ブックマーク操作エラー: 保存先が選択されていません。', 'error');
    return;
  }
  const destinationName = selectedDestination.value;
  const folderData = bookmarksByDestination.value[destinationName];
  if (!folderData) {
     console.error(`Folder data not found for destination: ${destinationName}`);
     showSnackbar('ブックマーク操作エラー: フォルダ情報が見つかりません。', 'error');
     return;
   }
  const folderId = folderData.id;

  let removedApp: App | undefined;
  const appsInCurrentFolder = folderData.apps;
  let appIndex = -1;

  if (appsInCurrentFolder) {
    appIndex = appsInCurrentFolder.findIndex(app => app.id === appId);
    if (appIndex !== -1) {
      removedApp = appsInCurrentFolder.splice(appIndex, 1)[0];
      console.log(`Removed app ${appId} locally from destination ${destinationName}`);
      if (appsInCurrentFolder.length === 0) {}
    } else {
        console.warn(`App ${appId} not found locally in destination ${destinationName} for removal.`);
    }
  }

  try {
    const response = await $api.post<Bookmark | null>(`/me/bookmarks`, { appId, folderId });
    const responseData = response.data;

    if (responseData === null) {
        showSnackbar(`ブックマークを解除しました: ${removedApp?.name ?? `AppID ${appId}`}`, 'success');
        console.log(`Successfully removed bookmark for app ${appId} in folder ${folderId} via API.`);
    } else if (responseData) {
        // This case implies the bookmark was added back or state was inconsistent.
        // We optimistically removed, so maybe just reload or show a warning?
        showSnackbar('ブックマークの状態が更新されました。', 'info');
        console.warn(`API created/returned bookmark for app ${appId}, but it was removed locally. Response:`, responseData);
        // Consider forcing a reload for consistency
        await loadAndGroupBookmarks();
    } else {
        // Unexpected non-error response
        showSnackbar('ブックマーク操作中に予期しない応答がありました。', 'warning');
        console.warn('Unexpected API response structure during bookmark toggle:', responseData);
        if (removedApp && appIndex !== -1 && appsInCurrentFolder) {
            appsInCurrentFolder.splice(appIndex, 0, removedApp);
            console.log(`Reverted local removal of app ${appId} due to unexpected API response.`);
        }
    }
  } catch (err: any) {
    console.error(`API Error toggling bookmark:`, err);
    showSnackbar('ブックマークの更新に失敗しました: ' + (err?.response?.data?.message || 'サーバーエラー'), 'error');
    // Revert optimistic update on error
    if (removedApp && appIndex !== -1 && appsInCurrentFolder) {
      appsInCurrentFolder.splice(appIndex, 0, removedApp);
      console.log(`Reverted local removal of app ${appId} due to API error.`);
    }
  }
};

const selectDestination = (dest: string) => {
    selectedDestination.value = dest;
    if (display.mobile.value) {
        viewMode.value = 'apps';
    }
};

const showListView = () => {
    viewMode.value = 'list';
};

const goToUserProfile = (creatorId: number) => {
  if (creatorId) {
      router.push(`/users/${creatorId}`);
  } else {
      console.warn('Attempted to navigate to user profile with null/undefined creatorId');
  }
};

const handleCreateFolder = async () => {
  const name = newFolderName.value.trim();
  if (!name) {
    creatingFolderError.value = { message: 'フォルダ名を入力してください。' };
    return;
  }
  creatingFolderLoading.value = true;
  creatingFolderError.value = null;
  console.log('[handleCreateFolder] Attempting to create folder with name:', name);
  try {
    const response = await $api.post<ApiBookmarkFolder>('/me/bookmark-folders', { name });
    console.log('[handleCreateFolder] API response received:', response);
    const newFolder = response.data;
    console.log('[handleCreateFolder] Extracted folder data:', newFolder);

    if (newFolder) {
      console.log('[handleCreateFolder] Folder creation successful. Updating local state and closing dialog.');
      bookmarksByDestination.value[newFolder.name] = {
          apps: [],
          id: newFolder.id,
          isDefault: newFolder.isDefault,
      };
      cancelCreateFolder(); // Close dialog
      showSnackbar(`フォルダ「${newFolder.name}」を作成しました。`, 'success');
      selectedDestination.value = newFolder.name; // Select the new folder
      if (display.mobile.value) { viewMode.value = 'apps'; }
      console.log('[handleCreateFolder] Local state updated, new folder selected.');
    } else {
      console.error('[handleCreateFolder] API success, but no folder data returned in response.data');
      throw new Error('API did not return the created folder data.');
    }

  } catch (err: any) {
    console.error('[handleCreateFolder] Failed to create bookmark folder:', err);
    const message = err?.response?.data?.message || 'フォルダの作成に失敗しました。';
    creatingFolderError.value = { message: message };
    console.log('[handleCreateFolder] Error set in modal, dialog remains open.');
    // Do not close modal on error
  } finally {
    creatingFolderLoading.value = false;
    console.log('[handleCreateFolder] Loading finished.');
  }
};

const openDeleteConfirmation = (folderName: string) => {
  const folderData = bookmarksByDestination.value[folderName];
  if (!folderData) {
    console.error(`Cannot delete folder: Data not found for name "${folderName}"`);
    showSnackbar('削除エラー: フォルダ情報が見つかりません。', 'error');
    return;
  }
  // Prevent deletion of default folders
  if (folderData.isDefault) {
      console.warn('Attempted to delete a default folder.');
      showSnackbar('デフォルトフォルダは削除できません。', 'warning');
      return;
  }

  folderNameToDelete.value = folderName;
  folderIdToDelete.value = folderData.id;
  deleteDialogVisible.value = true;
};

const cancelDeleteFolder = () => {
  deleteDialogVisible.value = false;
  folderNameToDelete.value = null;
  folderIdToDelete.value = null;
  deletingFolderLoading.value = false;
  // deletingFolderError is handled by snackbar
};

const confirmDeleteFolder = async () => {
  if (!folderIdToDelete.value || !folderNameToDelete.value) return;

  deletingFolderLoading.value = true;

  try {
    await $api.delete(`/me/bookmark-folders/${folderIdToDelete.value}`);

    const deletedName = folderNameToDelete.value; // Store before resetting
    const currentSelection = selectedDestination.value;

    // Update local state before closing dialog
    delete bookmarksByDestination.value[deletedName];

    showSnackbar(`フォルダ「${deletedName}」を削除しました。`, 'success');
    cancelDeleteFolder(); // Close dialog and reset state

    // If the deleted folder was selected, reset selection
    if (currentSelection === deletedName) {
      const remainingFolders = sortedFolderNames.value; // Use computed for potentially better order
      selectedDestination.value = remainingFolders.length > 0 ? remainingFolders[0] : null;
      if (display.mobile.value && viewMode.value === 'apps') {
         viewMode.value = 'list';
      }
    }
    console.log(`Folder "${deletedName}" (ID: ${folderIdToDelete.value}) deleted successfully.`);

  } catch (err: any) {
    console.error('Failed to delete bookmark folder:', err);
    const message = err?.response?.data?.message || 'フォルダの削除に失敗しました。';
    showSnackbar(message, 'error');
    // Keep dialog open on error? Or close and just show snackbar? Let's close.
    cancelDeleteFolder();
  } finally {
      // Loading is reset within cancelDeleteFolder
      // deletingFolderLoading.value = false; // Already handled by cancelDeleteFolder
  }
};

const openCreateFolderDialog = () => {
  newFolderName.value = '';
  creatingFolderError.value = null;
  creatingFolderLoading.value = false;
  createFolderDialogVisible.value = true;
};

const cancelCreateFolder = () => {
  console.log('[cancelCreateFolder] Closing dialog. Current visibility:', createFolderDialogVisible.value);
  createFolderDialogVisible.value = false;
  console.log('[cancelCreateFolder] Dialog visibility set to:', createFolderDialogVisible.value);
  // Reset form state
  newFolderName.value = '';
  creatingFolderError.value = null;
  creatingFolderLoading.value = false;
};

// --- Folder Rename ---
const openRenameDialog = (folderName: string) => {
    const folderData = bookmarksByDestination.value[folderName];
    if (!folderData || folderData.isDefault) {
        console.error('Cannot rename folder: Data not found or is default folder.', folderName);
        showSnackbar('このフォルダは名前を変更できません。', 'warning');
        return;
    }
    folderToRename.value = { id: folderData.id, currentName: folderName };
    newFolderNameForRename.value = folderName; // Initialize with current name
    renamingFolderError.value = null;
    renamingFolderLoading.value = false;
    renameDialogVisible.value = true;
    // Focus the input field after dialog is rendered
    nextTick(() => {
        const input = document.querySelector('#rename-folder-input'); // Assuming input has this ID
        if (input instanceof HTMLInputElement) {
            input.focus();
            input.select();
        }
    });
};

const cancelRenameFolder = () => {
    renameDialogVisible.value = false;
    folderToRename.value = null;
    newFolderNameForRename.value = '';
    renamingFolderError.value = null;
    renamingFolderLoading.value = false;
};

const confirmRenameFolder = async () => {
    if (!folderToRename.value || !newFolderNameForRename.value) return;

    const newName = newFolderNameForRename.value.trim();
    const oldName = folderToRename.value.currentName;
    const folderId = folderToRename.value.id;

    if (!newName) {
        renamingFolderError.value = { message: 'フォルダ名を入力してください。' };
        return;
    }
    if (newName === oldName) {
        cancelRenameFolder(); // No change needed, just close
        return;
    }

    renamingFolderLoading.value = true;
    renamingFolderError.value = null;

    try {
        const response = await $api.patch<ApiBookmarkFolder>(`/me/bookmark-folders/${folderId}`, { name: newName });
        const updatedFolder = response.data;

        if (updatedFolder && updatedFolder.name === newName) {
            // Update local state carefully
            const currentFolderData = bookmarksByDestination.value[oldName];
            if (currentFolderData) {
                bookmarksByDestination.value[newName] = { ...currentFolderData, id: updatedFolder.id }; // Update name as key, ensure ID is updated if changed (shouldn't)
                delete bookmarksByDestination.value[oldName]; // Remove old entry

                // If the renamed folder was selected, update selection
                if (selectedDestination.value === oldName) {
                    selectedDestination.value = newName;
                }
            }

            cancelRenameFolder();
            showSnackbar(`フォルダ名を「${newName}」に変更しました。`, 'success');
            console.log('Folder renamed successfully:', updatedFolder);
        } else {
            throw new Error('API did not return the updated folder data or name mismatch.');
        }

    } catch (err: any) {
        console.error('Failed to rename bookmark folder:', err);
        const message = err?.response?.data?.message || 'フォルダ名の変更に失敗しました。';
        renamingFolderError.value = { message: message };
        // Keep dialog open on error
    } finally {
        renamingFolderLoading.value = false;
    }
};

// --- Lifecycle ---
onMounted(() => {
  loadAndGroupBookmarks();
});

</script>

<style scoped>
.folder-action-btn {
  /* opacity rules removed */
}

.folder-action-placeholder {
  /* Ensure placeholder and button have same width */
  /* Adjust width based on actual rendered size of v-btn icon size="x-small" */
  min-width: 32px; 
  width: 32px;
  display: inline-block;
  /* Optional: Add vertical alignment if needed */
  vertical-align: middle; 
}

/* Optional: Adjust alignment of append slot items */
.folder-list-item .v-list-item__append {
  align-items: center;
}

/* Add specific styles if needed */
</style> 
