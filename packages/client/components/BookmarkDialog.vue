<template>
  <v-dialog :model-value="modelValue" @update:model-value="emitUpdate" max-width="500px" persistent>
    <v-card v-if="localAppId !== null">
      <v-card-title class="text-h6">ブックマーク: {{ localAppName }}</v-card-title>
      <v-card-text>
        <p class="mb-4">保存先を選択または新規作成してください。</p>
        
        <!-- Select Existing Destination -->
        <v-select
          v-model="selectedBookmarkDestination"
          :items="bookmarkDestinations"
          label="既存の保存先"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4"
          clearable
        ></v-select>

        <!-- Create New Destination -->
        <v-text-field
          v-model="newBookmarkDestination"
          label="新しい保存先を作成"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
        >
          <template v-slot:append-inner>
            <v-btn 
              icon="mdi-plus-circle-outline"
              variant="text"
              size="small"
              @click="addNewDestination"
              :disabled="!newBookmarkDestination.trim()"
            ></v-btn>
          </template>
        </v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="isCurrentlyBookmarked" 
          color="error" 
          variant="text" 
          @click="remove"
        >
          削除
        </v-btn>
        <v-btn 
          variant="text" 
          @click="close"
        >
          キャンセル
        </v-btn>
        <v-btn 
          color="primary" 
          variant="flat" 
          @click="save"
          :disabled="!selectedBookmarkDestination && !newBookmarkDestination.trim()"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
     <v-card v-else>
        <v-card-text>アプリ情報が読み込めません。</v-card-text>
         <v-card-actions>
            <v-spacer></v-spacer>
             <v-btn variant="text" @click="close">閉じる</v-btn>
         </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';

// --- Props & Emits --- 
const props = defineProps({
  modelValue: Boolean, // For v-model
  appId: { type: Number, default: null },
  appName: { type: String, default: '' }
});

const emit = defineEmits([
    'update:modelValue', 
    'bookmark-saved',      // { appId: number, destination: string }
    'bookmark-removed'     // { appId: number }
]);

// --- Local State --- 
const localAppId = ref<number | null>(null);
const localAppName = ref<string>('');
const isCurrentlyBookmarked = ref(false);
const currentDestination = ref<string | null>(null);
const bookmarkDestinations = ref<string[]>([]); 
const selectedBookmarkDestination = ref<string | null>(null); 
const newBookmarkDestination = ref('');

// --- LocalStorage Keys & Helpers (Keep these local to the dialog for destination management) ---
const BOOKMARK_DESTINATIONS_KEY = 'bookmarkDestinations';
const BOOKMARKED_APPS_KEY = 'bookmarkedApps'; // Key for app bookmarks

interface LocalStorageBookmarkData {
  destinations: string[];
  apps: { [appId: number]: string };
}

// Helper to load both destinations and specific app bookmark info
const loadDataFromStorage = (): LocalStorageBookmarkData => {
  const destinationsStr = localStorage.getItem(BOOKMARK_DESTINATIONS_KEY);
  const appsStr = localStorage.getItem(BOOKMARKED_APPS_KEY);
  const destinations = destinationsStr ? JSON.parse(destinationsStr) : ['お気に入り', '後で見る', '仕事用'];
  const apps = appsStr ? JSON.parse(appsStr) : {};
  // Save defaults if they don't exist
  if (!destinationsStr) localStorage.setItem(BOOKMARK_DESTINATIONS_KEY, JSON.stringify(destinations));
  if (!appsStr) localStorage.setItem(BOOKMARKED_APPS_KEY, JSON.stringify(apps));
  return { destinations, apps };
};

// Helper to save only destinations
const saveDestinationsToStorage = (destinations: string[]) => {
  localStorage.setItem(BOOKMARK_DESTINATIONS_KEY, JSON.stringify(destinations));
};

// --- Methods --- 
const emitUpdate = (value: boolean) => {
  emit('update:modelValue', value);
};

const close = () => {
  emitUpdate(false);
};

// Loads data when the dialog opens or appId changes
const loadInitialData = () => {
    if (props.appId !== null) {
        localAppId.value = props.appId;
        localAppName.value = props.appName;
        const { destinations, apps } = loadDataFromStorage();
        bookmarkDestinations.value = destinations;
        if (apps[props.appId]) {
            isCurrentlyBookmarked.value = true;
            currentDestination.value = apps[props.appId];
            selectedBookmarkDestination.value = currentDestination.value; // Pre-select if bookmarked
        } else {
            isCurrentlyBookmarked.value = false;
            currentDestination.value = null;

            // Default selection logic
            const defaultDest = 'お気に入り';
            if (destinations.includes(defaultDest)) {
                selectedBookmarkDestination.value = defaultDest; // Select 'お気に入り' if it exists
            } else {
                // If 'お気に入り' doesn't exist, add it and select it
                bookmarkDestinations.value.push(defaultDest);
                saveDestinationsToStorage(bookmarkDestinations.value); // Save the updated list
                selectedBookmarkDestination.value = defaultDest;
            }
        }
        newBookmarkDestination.value = ''; // Always reset new destination input
    } else {
        // Handle case where appId might not be provided (error state)
        localAppId.value = null;
        localAppName.value = '';
        isCurrentlyBookmarked.value = false;
        currentDestination.value = null;
        selectedBookmarkDestination.value = null;
        newBookmarkDestination.value = '';
        bookmarkDestinations.value = loadDataFromStorage().destinations; // Still load destinations
    }
};

const addNewDestination = () => {
  const newDest = newBookmarkDestination.value.trim();
  if (newDest && !bookmarkDestinations.value.includes(newDest)) {
    bookmarkDestinations.value.push(newDest);
    saveDestinationsToStorage(bookmarkDestinations.value); // Save updated destinations list
    selectedBookmarkDestination.value = newDest; // Select the newly added destination
    newBookmarkDestination.value = ''; // Clear the input field
  }
};

const save = () => {
  if (localAppId.value === null) return; // Should not happen in normal flow
  
  let destinationToSave = selectedBookmarkDestination.value;
  const newDestTrimmed = newBookmarkDestination.value.trim();

  // Handle case where a new destination is typed but not explicitly added via button
  if (newDestTrimmed && !selectedBookmarkDestination.value) {
    if (!bookmarkDestinations.value.includes(newDestTrimmed)) {
       // Add the new destination if it doesn't exist
       addNewDestination(); // This will also select it and clear the input
       destinationToSave = newDestTrimmed; // Ensure it's set
    } else {
        // If it already exists (e.g., typed existing name), select it
        destinationToSave = newDestTrimmed;
        selectedBookmarkDestination.value = destinationToSave; // Update selection state
        newBookmarkDestination.value = ''; // Clear input
    }
  }

  // Final check if a destination is selected/determined
  if (!destinationToSave) {
    // Maybe add user feedback here (e.g., snackbar)
    console.error("BookmarkDialog: No valid destination selected or created.");
    return; 
  }

  // Emit the save event with appId and chosen destination
  emit('bookmark-saved', { appId: localAppId.value, destination: destinationToSave });
  close(); // Close dialog after emitting
};

const remove = () => {
  if (localAppId.value !== null) {
    // Emit the remove event with appId
    emit('bookmark-removed', { appId: localAppId.value });
  }
  close(); // Close dialog after emitting
};

// --- Watcher --- 
// Watch for the dialog opening (modelValue becomes true)
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadInitialData();
  }
});

// Watch for appId changes while the dialog is open
watch(() => props.appId, (newAppId, oldAppId) => {
    if (props.modelValue && newAppId !== oldAppId) {
        loadInitialData();
    }
});

// Load destinations initially when component mounts (in case needed before opening)
onMounted(() => {
    // Initial load for destinations and potentially current app state if needed immediately
    bookmarkDestinations.value = loadDataFromStorage().destinations;
    // If the dialog might be open on mount (e.g., due to state restoration), 
    // you might call loadInitialData() here conditionally based on props.modelValue
    if (props.modelValue) {
        loadInitialData();
    }
});

</script> 
