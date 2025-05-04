<template>
  <v-container>
    <PageTitle :title="`お知らせ編集: ${editableNotification.title || '...'}`" />
    <div v-if="loading && !editableNotification.id" class="d-flex justify-center align-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <v-form ref="editForm" v-else>
      <v-card variant="outlined">
        <v-card-text>
          <v-container>
            <v-row>
              <!-- Title -->
              <v-col cols="12">
                <v-text-field
                  v-model="editableNotification.title"
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
                  v-model="editableNotification.content"
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
                      v-model="editableNotification.startAt"
                      label="開始日時 (YYYY-MM-DD HH:MM) *"
                      placeholder="例: 2024-08-15 10:00"
                      required
                      variant="outlined"
                      density="compact"
                      :rules="[rules.required, rules.dateTimeFormat, rules.notInPastOrOriginal]"
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
                      :min="isOriginalDateBeforeToday ? originalStartDate : todayStr"
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
                      v-model="editableNotification.endAt"
                      label="終了日時 (YYYY-MM-DD HH:MM)"
                      placeholder="例: 2024-08-31 23:59"
                      variant="outlined"
                      density="compact"
                      :rules="[rules.dateTimeFormat, rules.dateOrder, rules.endDateNotInPast]"
                      hint="空白の場合は無期限"
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
                      :min="getMinEndDate()"
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
                    <v-btn
                      block
                      color="grey"
                      @click="clearEndTime"
                      class="mt-2"
                      variant="flat"
                      size="small"
                    >クリア（無期限）</v-btn>
                  </v-sheet>
                </v-menu>
              </v-col>

              <!-- Level -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editableNotification.level"
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

              <!-- IsVisibleOnTop -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editableNotification.isVisibleOnTop"
                  color="primary"
                  label="トップページに表示する"
                  inset
                  hint="重要なお知らせのみトップに表示してください"
                  persistent-hint
                ></v-switch>
              </v-col>

            </v-row>
          </v-container>
          <small>*必須入力項目</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelEdit">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveNotification" :loading="saving" :disabled="loading">
            保存
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
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from 'nuxt/app';
import PageTitle from '~/components/PageTitle.vue';

// 型定義（useNotificationApiから移行）
export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Notification {
  id: number;
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: string;
  endAt: string | null;
  isVisibleOnTop: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationDto {
  title?: string;
  content?: string;
  level?: NotificationLevel;
  startAt?: string;
  endAt?: string | null;
  isVisibleOnTop?: boolean;
}

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const notificationId = Number(route.params.id);

// ローディングとエラー状態
const loading = ref(false);
const error = ref<string | null>(null);

// 今日の日付
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = formatDate(today); // YYYY-MM-DD形式

// 編集前のオリジナルの開始日
const originalStartDate = ref('');
const isOriginalDateBeforeToday = ref(false);

// ローカル状態
const saving = ref(false);
const editForm = ref<any>(null);
const editableNotification = reactive<{
  id?: number;
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: string;
  endAt: string | null;
  isVisibleOnTop: boolean;
}>({
  title: '',
  content: '',
  level: 'INFO',
  startAt: '',
  endAt: null,
  isVisibleOnTop: false,
});

const snackbar = reactive({ show: false, text: '', color: 'success' });

// 日付ピッカーのメニュー状態
const startMenu = ref(false);
const endMenu = ref(false);

// ピッカー用の一時状態
const selectedStartDate = ref<Date | null>(null);
const selectedEndDate = ref<Date | null>(null);
const startHour = ref<string>('00');
const startMinute = ref<string>('00');
const endHour = ref<string>('00');
const endMinute = ref<string>('00');

// オプション
const levelOptions = [
  { title: '一般お知らせ (青)', value: 'INFO' },
  { title: '完了・成功 (緑)', value: 'SUCCESS' },
  { title: '注意・警告 (黄)', value: 'WARNING' },
  { title: '重要・エラー (赤)', value: 'ERROR' },
];

// バリデーションルール
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  dateTimeFormat: (value: string | null | undefined) => {
    if (!value) return true;
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    return regex.test(value) || 'YYYY-MM-DD HH:MM 形式で入力してください。';
  },
  dateOrder: (value: string | null | undefined) => {
    if (!value || !editableNotification.startAt) return true;
    const start = new Date(editableNotification.startAt);
    const end = new Date(value);
    return start <= end || '終了日時は開始日時より後に設定してください。';
  },
  notInPastOrOriginal: (value: string | null | undefined) => {
    if (!value) return true;
    try {
      // 元の日付の場合は許可する
      if (value === originalStartDate.value) {
        return true;
      }
      
      const date = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // 今日の0時0分に設定
      return date >= now || '今日以降の日付を設定してください。';
    } catch (e) {
      return true; // dateTimeFormatで日付形式のチェックをするので、ここではtrueを返す
    }
  },
  endDateNotInPast: (value: string | null | undefined) => {
    if (!value) return true;
    try {
      const date = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // 今日の0時0分に設定
      return date >= now || '今日以降の日付を設定してください。';
    } catch (e) {
      return true;
    }
  }
};

// お知らせデータを取得
const fetchNotificationData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await $api.get(`/admin/notifications/${notificationId}`);
    const notification = response.data;

    if (notification) {
      // オリジナルの開始日を保存
      originalStartDate.value = formatDateTimeForDisplay(notification.startAt);
      
      // オリジナルの開始日が今日より前かチェック
      try {
        const startDate = new Date(notification.startAt);
        isOriginalDateBeforeToday.value = startDate < today;
      } catch (e) {
        isOriginalDateBeforeToday.value = false;
      }
      
      Object.assign(editableNotification, {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        level: notification.level,
        startAt: formatDateTimeForDisplay(notification.startAt),
        endAt: notification.endAt ? formatDateTimeForDisplay(notification.endAt) : null,
        isVisibleOnTop: notification.isVisibleOnTop
      });
    } else {
      snackbar.text = 'お知らせが見つかりません。';
      snackbar.color = 'error';
      snackbar.show = true;
      setTimeout(() => router.push('/admin/notifications'), 2000);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || `お知らせID ${notificationId} の取得中にエラーが発生しました`;
    console.error(`お知らせ詳細取得エラー (ID: ${notificationId}):`, err);
    snackbar.text = error.value || 'お知らせの取得中にエラーが発生しました';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

// ISOフォーマットの日付を YYYY-MM-DD HH:MM 形式に変換する関数
function formatDateTimeForDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    return `${y}-${m}-${d} ${h}:${min}`;
  } catch (e) {
    console.error('日付変換エラー:', e);
    return '';
  }
}

// 日付フォーマットのヘルパー
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 日付ピッカーの更新ハンドラー
const selectStartDate = (date: Date | null) => {
  selectedStartDate.value = date;
};

const selectEndDate = (date: Date | null) => {
  // 今日より前の日付は選択不可
  if (date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今日より前の日付は選択不可
    if (date < today) {
      snackbar.text = '今日以降の日付を選択してください';
      snackbar.color = 'warning';
      snackbar.show = true;
      return;
    }
    
    // 開始日より前の日付は選択不可
    if (editableNotification.startAt) {
      const startDate = new Date(editableNotification.startAt.split(' ')[0]);
      if (date < startDate) {
        snackbar.text = '開始日より後の日付を選択してください';
        snackbar.color = 'warning';
        snackbar.show = true;
        return;
      }
    }
  }
  
  selectedEndDate.value = date;
};

// 時間選択の確定
const confirmStartTime = () => {
  const dateToUse = selectedStartDate.value;
  if (!dateToUse) {
    startMenu.value = false;
    return;
  }
  const formattedDate = formatDate(dateToUse);
  editableNotification.startAt = `${formattedDate} ${startHour.value}:${startMinute.value}`;
  startMenu.value = false;
};

const confirmEndTime = () => {
  const dateToUse = selectedEndDate.value;
  if (!dateToUse) {
    editableNotification.endAt = null;
    endMenu.value = false;
    return;
  }
  
  // 日付のバリデーション
  // 今日より前の日付は設定不可
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateToUse < today) {
    snackbar.text = '終了日時は今日以降の日付を設定してください';
    snackbar.color = 'warning';
    snackbar.show = true;
    return;
  }
  
  // 開始日より前の日付は設定不可
  if (editableNotification.startAt) {
    const startDatePart = editableNotification.startAt.split(' ')[0];
    const startDate = new Date(startDatePart);
    startDate.setHours(0, 0, 0, 0);
    
    if (dateToUse < startDate) {
      snackbar.text = '終了日時は開始日時より後に設定してください';
      snackbar.color = 'warning';
      snackbar.show = true;
      return;
    }
  }
  
  const formattedDate = formatDate(dateToUse);
  editableNotification.endAt = `${formattedDate} ${endHour.value}:${endMinute.value}`;
  endMenu.value = false;
};

const clearEndTime = () => {
  editableNotification.endAt = null;
  selectedEndDate.value = null;
  endMenu.value = false;
};

// 時間セレクト用のオプション計算（30分刻み）
const hourOptions = computed(() =>
  Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
);
const minuteOptions = computed(() => ['00', '30']);

// メニューが開いたときに一時状態を初期化するウォッチャー
watch(startMenu, (isOpen) => {
  if (isOpen) {
    // 現在の値からDateオブジェクトを取得
    if (editableNotification.startAt && rules.dateTimeFormat(editableNotification.startAt) === true) {
      try {
        const date = new Date(editableNotification.startAt);
        if (!isNaN(date.getTime())) {
          selectedStartDate.value = date;
          // 時間も抽出
          const timePart = editableNotification.startAt.split(' ')[1];
          startHour.value = timePart?.split(':')[0] || '00';
          // 30分刻みに強制
          startMinute.value = Number(timePart?.split(':')[1] || 0) < 30 ? '00' : '30';
        } else {
          selectedStartDate.value = today;
          startHour.value = '00';
          startMinute.value = '00';
        }
      } catch (e) {
        selectedStartDate.value = today;
        startHour.value = '00';
        startMinute.value = '00';
      }
    } else {
      selectedStartDate.value = today;
      startHour.value = '00';
      startMinute.value = '00';
    }
  }
});

watch(endMenu, (isOpen) => {
  if (isOpen) {
    // 現在の値からDateオブジェクトを取得
    if (editableNotification.endAt && rules.dateTimeFormat(editableNotification.endAt) === true) {
      try {
        const date = new Date(editableNotification.endAt);
        if (!isNaN(date.getTime())) {
          selectedEndDate.value = date;
          // 時間も抽出
          const timePart = editableNotification.endAt.split(' ')[1];
          endHour.value = timePart?.split(':')[0] || '00';
          // 30分刻みに強制
          endMinute.value = Number(timePart?.split(':')[1] || 0) < 30 ? '00' : '30';
        } else {
          // 開始日時がある場合はそれを利用、なければ今日
          selectedEndDate.value = editableNotification.startAt ? new Date(editableNotification.startAt) : today;
          endHour.value = '23';
          endMinute.value = '30';
        }
      } catch (e) {
        selectedEndDate.value = editableNotification.startAt ? new Date(editableNotification.startAt) : today;
        endHour.value = '23';
        endMinute.value = '30';
      }
    } else {
      selectedEndDate.value = editableNotification.startAt ? new Date(editableNotification.startAt) : today;
      endHour.value = '23';
      endMinute.value = '30';
    }
  }
});

// アクション
const cancelEdit = () => {
  router.push('/admin/notifications');
};

// 日付をISO 8601形式に変換する関数
const toISOString = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  try {
    // YYYY-MM-DD HH:MM 形式からISO文字列に変換
    const [datePart, timePart] = dateString.split(' ');
    if (!datePart || !timePart) return null;
    
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // JavaScriptの月は0-11なので、月から1を引く
    const date = new Date(year, month - 1, day, hour, minute);
    return date.toISOString();
  } catch (e) {
    console.error('日付変換エラー:', e);
    return null;
  }
};

const saveNotification = async () => {
  if (!editForm.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  // 追加のバリデーション
  // 開始日時と終了日時の順序チェック
  if (editableNotification.startAt && editableNotification.endAt) {
    const startDate = new Date(editableNotification.startAt);
    const endDate = new Date(editableNotification.endAt);
    
    if (startDate > endDate) {
      snackbar.text = '終了日時は開始日時より後に設定してください';
      snackbar.color = 'error';
      snackbar.show = true;
      return;
    }
    
    // 今日より前の日付チェック（オリジナル開始日以外）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (editableNotification.startAt !== originalStartDate.value && startDate < today) {
      snackbar.text = '開始日時は今日以降の日付を設定してください';
      snackbar.color = 'error';
      snackbar.show = true;
      return;
    }
    
    if (endDate < today) {
      snackbar.text = '終了日時は今日以降の日付を設定してください';
      snackbar.color = 'error';
      snackbar.show = true;
      return;
    }
  }

  saving.value = true;
  error.value = null;

  try {
    // 日付をISO 8601形式に変換
    const startAtISO = toISOString(editableNotification.startAt);
    const endAtISO = toISOString(editableNotification.endAt);
    
    if (!startAtISO) {
      throw new Error('開始日時の形式が不正です。正しい日付形式で入力してください。');
    }

    // APIにリクエスト送信
    const updateDto: UpdateNotificationDto = {
      title: editableNotification.title,
      content: editableNotification.content,
      level: editableNotification.level,
      startAt: startAtISO,
      endAt: endAtISO,
      isVisibleOnTop: editableNotification.isVisibleOnTop
    };

    console.log('送信データ:', updateDto); // デバッグ用
    const response = await $api.patch(`/admin/notifications/${notificationId}`, updateDto);

    if (response.data) {
      snackbar.text = 'お知らせを更新しました。';
      snackbar.color = 'success';
      snackbar.show = true;
      // 成功したら一覧ページにリダイレクト
      setTimeout(() => router.push('/admin/notifications'), 1000);
    } else {
      snackbar.text = 'お知らせの更新に失敗しました。';
      snackbar.color = 'error';
      snackbar.show = true;
    }
  } catch (err: any) {
    if (err.message) {
      error.value = err.message;
    } else {
      error.value = err.response?.data?.message || `お知らせID ${notificationId} の更新中にエラーが発生しました`;
    }
    console.error('お知らせ更新エラー:', err);
    snackbar.text = error.value || '更新中にエラーが発生しました';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    saving.value = false;
  }
};

// 終了日時のMinDate計算関数を追加
const getMinEndDate = () => {
  // 開始日があれば、それを最小値に
  if (editableNotification.startAt) {
    try {
      const startDatePart = editableNotification.startAt.split(' ')[0];
      if (startDatePart) return startDatePart;
    } catch (e) {
      // エラー時は今日を返す
    }
  }
  // デフォルトは今日
  return todayStr;
};

// 初期化
onMounted(() => {
  fetchNotificationData();
});
</script>

<style scoped>
/* スタイルが必要な場合に追加 */
</style> 
