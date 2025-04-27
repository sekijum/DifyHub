<template>
  <v-container>
    <PageTitle title="お知らせ作成" />
    <v-form ref="createForm">
      <v-card variant="outlined">
        <v-card-text>
          <v-container>
            <v-row>
              <!-- Title -->
              <v-col cols="12">
                <v-text-field
                  v-model="newNotification.title"
                  label="タイトル *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>

              <!-- Content -->
              <v-col cols="12">
                <v-textarea
                  v-model="newNotification.content"
                  label="内容 *"
                  required
                  rows="5"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-textarea>
              </v-col>

              <!-- StartAt -->
              <v-col cols="12" md="6">
                <v-menu
                  v-model="startMenu"
                  :close-on-content-click="false"
                  location="bottom start"
                  transition="scale-transition"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="newNotification.startAt"
                      label="開始日時 (YYYY-MM-DD HH:MM) *"
                      placeholder="例: 2024-08-15 10:00"
                      required
                      variant="outlined"
                      density="compact"
                      :rules="[rules.required, rules.dateTimeFormat]"
                      hint="お知らせが表示される開始日時"
                      persistent-hint
                      prepend-inner-icon="mdi-calendar-clock"
                      readonly
                      v-bind="props"
                    ></v-text-field>
                  </template>
                  <v-sheet rounded="lg" border class="pa-2" width="300">
                    <v-date-picker
                      @update:model-value="selectStartDate"
                      :model-value="selectedStartDate"
                      hide-header
                      color="primary"
                    ></v-date-picker>
                    <v-row no-gutters class="mt-2">
                      <v-col cols="6" class="pr-1">
                        <v-select
                          v-model="startHour"
                          :items="hourOptions"
                          label="時"
                          variant="outlined"
                          density="compact"
                          hide-details
                        ></v-select>
                      </v-col>
                      <v-col cols="6" class="pl-1">
                        <v-select
                          v-model="startMinute"
                          :items="minuteOptions"
                          label="分"
                          variant="outlined"
                          density="compact"
                          hide-details
                        ></v-select>
                      </v-col>
                    </v-row>
                    <v-btn
                      block
                      color="primary"
                      @click="confirmStartTime"
                      class="mt-3"
                      variant="flat"
                      size="small"
                    >時間設定</v-btn>
                  </v-sheet>
                </v-menu>
              </v-col>

              <!-- EndAt -->
              <v-col cols="12" md="6">
                <v-menu
                  v-model="endMenu"
                  :close-on-content-click="false"
                  location="bottom start"
                  transition="scale-transition"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="newNotification.endAt"
                      label="終了日時 (YYYY-MM-DD HH:MM) *"
                      placeholder="例: 2024-08-31 23:59"
                      required
                      variant="outlined"
                      density="compact"
                      :rules="[rules.required, rules.dateTimeFormat, rules.dateOrder]"
                      hint="お知らせが表示される終了日時"
                      persistent-hint
                      prepend-inner-icon="mdi-calendar-clock"
                      readonly
                      v-bind="props"
                    ></v-text-field>
                  </template>
                  <v-sheet rounded="lg" border class="pa-2" width="300">
                    <v-date-picker
                      @update:model-value="selectEndDate"
                      :model-value="selectedEndDate"
                      :min="newNotification.startAt?.split(' ')[0]"
                      hide-header
                      color="primary"
                    ></v-date-picker>
                    <v-row no-gutters class="mt-2">
                      <v-col cols="6" class="pr-1">
                        <v-select
                          v-model="endHour"
                          :items="hourOptions"
                          label="時"
                          variant="outlined"
                          density="compact"
                          hide-details
                        ></v-select>
                      </v-col>
                      <v-col cols="6" class="pl-1">
                        <v-select
                          v-model="endMinute"
                          :items="minuteOptions"
                          label="分"
                          variant="outlined"
                          density="compact"
                          hide-details
                        ></v-select>
                      </v-col>
                    </v-row>
                    <v-btn
                      block
                      color="primary"
                      @click="confirmEndTime"
                      class="mt-3"
                      variant="flat"
                      size="small"
                    >時間設定</v-btn>
                  </v-sheet>
                </v-menu>
              </v-col>

              <!-- Level -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="newNotification.level"
                  :items="levelOptions"
                  item-title="title"
                  item-value="value"
                  label="レベル *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>

            </v-row>
          </v-container>
          <small>*必須入力項目</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelCreate">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createNotification" :loading="isCreating">
            作成する
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
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();

// Type definitions
type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

// Interface for the payload to create a notification
interface NotificationPayload {
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: string;
  endAt: string;
}

// --- Form and State ---
const createForm = ref<any>(null);
const newNotification = reactive<Partial<NotificationPayload>>({
    title: '',
    content: '',
    level: 'info',
    startAt: '',
    endAt: '',
});
const isCreating = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// --- Date Picker Menu State ---
const startMenu = ref(false);
const endMenu = ref(false);

// --- Temp state for pickers ---
const selectedStartDate = ref<Date | null>(null);
const selectedEndDate = ref<Date | null>(null);
const startHour = ref<string>('00');
const startMinute = ref<string>('00');
const endHour = ref<string>('00');
const endMinute = ref<string>('00');

// Options
const levelOptions = ref([
    { title: '一般お知らせ (青)', value: 'info' },
    { title: '完了・成功 (緑)', value: 'success' },
    { title: '注意・警告 (黄)', value: 'warning' },
    { title: '重要・エラー (赤)', value: 'error' },
]);

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  dateTimeFormat: (value: string | null | undefined) => {
      if (!value) return true;
      const regex = /^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}(:\\d{2})?$/;
      return regex.test(value) || 'YYYY-MM-DD HH:MM 形式で入力してください。';
  },
  dateOrder: (value: string | null | undefined) => {
      if (!value || !newNotification.startAt) return true;
      const start = new Date(newNotification.startAt);
      const end = endMenu.value && selectedEndDate.value
                  ? new Date(`${formatDate(selectedEndDate.value)} ${endHour.value}:${endMinute.value}`)
                  : new Date(value);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return true; // Let dateTimeFormat handle invalid formats
      }
      return start.getTime() <= end.getTime() || '終了日時は開始日時以降に設定してください。';
  }
};

// --- Computed properties for Date Pickers ---
// Parse date string to Date object for v-date-picker model-value
const computedStartDate = computed(() => {
    if (newNotification.startAt && rules.dateTimeFormat(newNotification.startAt) === true) {
        try {
            return new Date(newNotification.startAt.split(' ')[0]);
        } catch (e) { return null; }
    }
    return null;
});

const computedEndDate = computed(() => {
    if (newNotification.endAt && rules.dateTimeFormat(newNotification.endAt) === true) {
        try {
            return new Date(newNotification.endAt.split(' ')[0]);
        } catch (e) { return null; }
    }
    return null;
});

// --- Date Formatting Helper ---
const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// --- Date Picker Update Handlers ---
const selectStartDate = (date: Date | null) => {
    selectedStartDate.value = date;
};

const selectEndDate = (date: Date | null) => {
    selectedEndDate.value = date;
};

// --- Confirm Time Selection ---
const confirmStartTime = () => {
    const dateToUse = selectedStartDate.value;
    if (!dateToUse) {
        startMenu.value = false;
        return;
    }
    const formattedDate = formatDate(dateToUse);
    newNotification.startAt = `${formattedDate} ${startHour.value}:${startMinute.value}`;
    startMenu.value = false;
};

const confirmEndTime = () => {
    const dateToUse = selectedEndDate.value;
    if (!dateToUse) {
        endMenu.value = false;
        return;
    }
    const formattedDate = formatDate(dateToUse);
    newNotification.endAt = `${formattedDate} ${endHour.value}:${endMinute.value}`;
    endMenu.value = false;
};

// --- Computed options for time selects ---
const hourOptions = computed(() =>
    Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
);
const minuteOptions = computed(() =>
    Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
);

// --- Watchers to initialize temp state when menu opens ---
watch(startMenu, (isOpen) => {
  if (isOpen) {
    selectedStartDate.value = computedStartDate.value;
    // Also reset time based on current value when opening
    if (newNotification.startAt && rules.dateTimeFormat(newNotification.startAt) === true) {
        const timePart = newNotification.startAt.split(' ')[1];
        startHour.value = timePart?.split(':')[0] || '00';
        startMinute.value = timePart?.split(':')[1] || '00';
    } else {
        startHour.value = '00';
        startMinute.value = '00';
    }
  }
});

watch(endMenu, (isOpen) => {
  if (isOpen) {
    selectedEndDate.value = computedEndDate.value;
    if (newNotification.endAt && rules.dateTimeFormat(newNotification.endAt) === true) {
        const timePart = newNotification.endAt.split(' ')[1];
        endHour.value = timePart?.split(':')[0] || '00';
        endMinute.value = timePart?.split(':')[1] || '00';
    } else {
        endHour.value = '00';
        endMinute.value = '00';
    }
    // Ensure the temp end date is not before the start date
    if(selectedEndDate.value && computedStartDate.value && selectedEndDate.value < computedStartDate.value) {
        selectedEndDate.value = computedStartDate.value;
    }
  }
});

// --- Actions ---
const cancelCreate = () => {
  router.push('/admin/notifications');
};

const createNotification = async () => {
  if (!createForm.value) return;
  const { valid } = await createForm.value.validate();
  if (!valid) return;

  isCreating.value = true;

  // Construct the payload
  const payload: NotificationPayload = {
    title: newNotification.title!,
    content: newNotification.content!,
    level: newNotification.level!,
    startAt: newNotification.startAt!,
    endAt: newNotification.endAt!,
  };

  try {
    // --- Placeholder for Create Logic ---
    console.log('Creating notification (simulation):', payload);
    // TODO: Replace with actual API call (e.g., POST /api/notifications)
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    snackbar.text = 'お知らせを新規作成しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    // Redirect to the list page after successful creation
    setTimeout(() => router.push('/admin/notifications'), 1500);

  } catch (error) {
    console.error("Error during notification creation simulation:", error);
    snackbar.text = '作成中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isCreating.value = false;
  }
};

</script>

<style scoped>
/* Add styles if needed */
</style> 
