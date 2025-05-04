<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" max-width="500px" persistent>
    <v-card :loading="loading || folderLoading || toggleLoading">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>ブックマークの保存先...</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog"></v-btn>
      </v-card-title>
      <v-card-subtitle v-if="appName" class="pb-2">
        「{{ appName }}」を保存
      </v-card-subtitle>

      <v-divider></v-divider>

      <v-card-text style="max-height: 400px; overflow-y: auto;">
        <v-alert v-if="error" type="error" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <div v-if="!loading">
          <!-- Folder List -->
          <v-list density="compact" lines="one">
            <v-list-item
              v-for="folder in folders"
              :key="folder.id"
              @click.stop="toggleBookmark(folder)"
              class="pl-0 pr-1"
            >
              <template v-slot:prepend>
                <v-checkbox-btn
                  :model-value="folder.isAppBookmarked"
                  :loading="togglingFolderId === folder.id"
                  :disabled="toggleLoading && togglingFolderId !== folder.id"
                  color="primary"
                  class="mr-2"
                  @click.stop="toggleBookmark(folder)"
                ></v-checkbox-btn>
              </template>

              <v-list-item-title>{{ folder.name }}</v-list-item-title>

              <template v-slot:append>
                <v-icon size="small" :icon="folder.isDefault ? 'mdi-lock-outline' : 'mdi-folder-outline'"></v-icon>
                 <!-- TODO: Add edit/delete buttons for non-default folders -->
              </template>
            </v-list-item>
            <v-list-item v-if="folders.length === 0 && !showNewFolderInput" class="text-center text-disabled">
               ブックマークフォルダがありません。
            </v-list-item>
          </v-list>

          <!-- New Folder Input -->
          <div v-if="showNewFolderInput" class="mt-3">
             <v-text-field
                v-model.trim="newFolderName"
                label="新しいフォルダ名"
                variant="outlined"
                density="compact"
                autofocus
                hide-details="auto"
                :loading="creatingFolder"
                :disabled="creatingFolder"
                @keydown.enter="createFolder"
                class="mb-2"
             >
               <template v-slot:append-inner>
                 <v-btn
                   icon="mdi-check"
                   variant="text"
                   size="small"
                   color="success"
                   :disabled="!newFolderName || creatingFolder"
                   @click="createFolder"
                   class="mr-n2"
                 ></v-btn>
                 <v-btn
                   icon="mdi-close"
                   variant="text"
                   size="small"
                   color="grey"
                   :disabled="creatingFolder"
                   @click="cancelNewFolder"
                    class="mr-n2"
                 ></v-btn>
               </template>
             </v-text-field>
             <v-alert v-if="createFolderError" type="error" density="compact">{{ createFolderError }}</v-alert>
          </div>
        </div>
         <div v-else class="text-center pa-5">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
         </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
         <v-btn
            v-if="!showNewFolderInput"
            variant="text"
            prepend-icon="mdi-plus"
            :disabled="loading || folderLoading || toggleLoading || creatingFolder"
            @click="startNewFolderInput"
         >
            新しいフォルダ
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="closeDialog">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useNuxtApp } from '#app';

// --- Props ---
const props = defineProps({
  modelValue: { // v-model for dialog visibility
    type: Boolean,
    required: true,
  },
  appId: {
    type: Number,
    required: true,
  },
  appName: {
    type: String,
    default: '',
  },
});

// --- Emits ---
const emit = defineEmits(['update:modelValue', 'update:bookmarkedStatus']);

// --- Composables ---
const { $api } = useNuxtApp();

// --- Types (Mirroring Backend) ---
interface BookmarkFolder {
  id: number;
  userId: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BookmarkFolderWithAppStatus extends BookmarkFolder {
  isAppBookmarked: boolean;
}

// --- State ---
const folders = ref<BookmarkFolderWithAppStatus[]>([]);
const loading = ref(false); // Initial folder loading
const folderLoading = ref(false); // Reloading folders after creation
const toggleLoading = ref(false); // Loading state during bookmark toggle
const togglingFolderId = ref<number | null>(null); // Track which folder is being toggled
const error = ref<string | null>(null);

const showNewFolderInput = ref(false);
const newFolderName = ref('');
const creatingFolder = ref(false);
const createFolderError = ref<string | null>(null);

// --- Computed ---
const isAppBookmarkedInAnyFolder = computed(() => {
  return folders.value.some(folder => folder.isAppBookmarked);
});

// --- Methods ---
const closeDialog = () => {
  emit('update:modelValue', false);
  // Reset states when closing
  showNewFolderInput.value = false;
  newFolderName.value = '';
  createFolderError.value = null;
  error.value = null;
};

const loadFolders = async () => {
  if (!props.appId) return;
  loading.value = true;
  error.value = null;
  try {
    const response = await $api.get<BookmarkFolderWithAppStatus[]>(`/me/bookmark-folders/app-status`, {
      params: { appId: props.appId },
    });
    folders.value = response.data;
    // Emit initial bookmarked status
    emit('update:bookmarkedStatus', isAppBookmarkedInAnyFolder.value);
  } catch (err: any) {
    console.error('Failed to load bookmark folders:', err);
    error.value = err.response?.data?.message || 'ブックマークフォルダの読み込みに失敗しました。';
    folders.value = []; // Clear folders on error
  } finally {
    loading.value = false;
  }
};

const toggleBookmark = async (folder: BookmarkFolderWithAppStatus) => {
  if (toggleLoading.value || !props.appId) return;

  toggleLoading.value = true;
  togglingFolderId.value = folder.id;
  const previousState = folder.isAppBookmarked;
  const payload = {
      appId: props.appId,
      folderId: folder.id
      // folderName is not needed here as we have folderId
  };

  try {
    // Optimistic UI update
    folder.isAppBookmarked = !previousState;
    emit('update:bookmarkedStatus', isAppBookmarkedInAnyFolder.value); // Emit status change

    // API Call (POST /me/bookmarks handles toggle logic based on existence)
    await $api.post('/me/bookmarks', payload);
    console.log(`Bookmark toggled for app ${props.appId} in folder ${folder.id}`);
    // No need to reload folders on toggle, just update the state

  } catch (err: any) {
    console.error('Failed to toggle bookmark:', err);
    // Revert UI on error
    folder.isAppBookmarked = previousState;
    emit('update:bookmarkedStatus', isAppBookmarkedInAnyFolder.value); // Emit reverted status
    // TODO: Show error message (e.g., snackbar)
  } finally {
    toggleLoading.value = false;
    togglingFolderId.value = null;
  }
};

const startNewFolderInput = () => {
  showNewFolderInput.value = true;
  createFolderError.value = null; // Clear previous error
};

const cancelNewFolder = () => {
    showNewFolderInput.value = false;
    newFolderName.value = '';
    createFolderError.value = null;
};

const createFolder = async () => {
  if (!newFolderName.value || creatingFolder.value) return;

  creatingFolder.value = true;
  createFolderError.value = null;
  const folderName = newFolderName.value; // Capture name before reset

  try {
    // 1. Create the new folder
    const createResponse = await $api.post<BookmarkFolder>('/me/bookmark-folders', { name: folderName });
    const newFolder = createResponse.data;
    console.log('New folder created:', newFolder);

    // 2. Reset input and hide
    newFolderName.value = '';
    showNewFolderInput.value = false;

    // 3. OPTIONAL: Automatically bookmark the current app in the new folder
    if (props.appId && newFolder) {
        try {
            await $api.post('/me/bookmarks', { appId: props.appId, folderId: newFolder.id });
            console.log(`App ${props.appId} automatically bookmarked in new folder ${newFolder.id}`);
        } catch (bookmarkErr: any) {
             console.error(`Failed to auto-bookmark app in new folder:`, bookmarkErr);
             // Inform user? Generally, folder creation success is the main goal.
        }
    }


    // 4. Reload folder list to show the new folder with correct bookmark status
    folderLoading.value = true; // Use a different loading indicator
    await loadFolders(); // Reload folders to include the new one and its status

  } catch (err: any) {
    console.error('Failed to create bookmark folder:', err);
    createFolderError.value = err.response?.data?.message || 'フォルダの作成に失敗しました。';
  } finally {
    creatingFolder.value = false;
    folderLoading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue === true) {
    // Load folders when dialog becomes visible
    loadFolders();
  }
});
</script>

<style scoped>
/* Add any specific styles for the dialog here */
.v-list-item:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04); /* Subtle hover effect */
}
.v-list-item--density-compact.v-list-item--one-line {
    min-height: 40px; /* Adjust height slightly */
}
</style> 
