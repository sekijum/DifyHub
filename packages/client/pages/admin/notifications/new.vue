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
                      :rules="[rules.required, rules.dateTimeFormat, rules.notInPast]"
                      hint="お知らせが表示される開始日時（今日以降）"
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
                      :min="todayStr"
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

              <!-- IsVisibleOnTop -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="newNotification.isVisibleOnTop"
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
          <v-btn variant="text" @click="cancelCreate">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="createNotification" :loading="loading">
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
import { useNuxtApp } from 'nuxt/app';
import PageTitle from '~/components/PageTitle.vue';

// 型定義（useNotificationApiから移行）
export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface CreateNotificationDto {
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: string;
  endAt: string | null;
  isVisibleOnTop?: boolean;
}

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const { $api } = useNuxtApp();

// ローディングとエラー状態
const loading = ref(false);
const error = ref<string | null>(null);

// 今日の日付
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = formatDate(today); // YYYY-MM-DD形式

// フォームと状態
const createForm = ref<any>(null);
const newNotification = reactive<Partial<CreateNotificationDto>>({
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
const selectedStartDate = ref<Date | null>(today);
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
    if (!value || !newNotification.startAt) return true;
    
    try {
      // より厳密な比較（時間も含む）
      const startDateStr = newNotification.startAt.split(' ')[0];
      const startTimeStr = newNotification.startAt.split(' ')[1];
      if (!startDateStr || !startTimeStr) return true;
      
      const startHourMin = startTimeStr.split(':');
      const startDateParts = startDateStr.split('-').map(Number);
      
      const endDateStr = value.split(' ')[0];
      const endTimeStr = value.split(' ')[1];
      if (!endDateStr || !endTimeStr) return true;
      
      const endHourMin = endTimeStr.split(':');
      const endDateParts = endDateStr.split('-').map(Number);
      
      // Dateオブジェクト作成
      const startDate = new Date(
        startDateParts[0],
        startDateParts[1] - 1,
        startDateParts[2],
        parseInt(startHourMin[0]),
        parseInt(startHourMin[1])
      );
      
      const endDate = new Date(
        endDateParts[0],
        endDateParts[1] - 1,
        endDateParts[2],
        parseInt(endHourMin[0]),
        parseInt(endHourMin[1])
      );
      
      return startDate < endDate || '終了日時は開始日時より後に設定してください。';
    } catch (e) {
      console.error('日付比較エラー:', e);
      return '日付比較中にエラーが発生しました。正しい形式か確認してください。';
    }
  },
  notInPast: (value: string | null | undefined) => {
    if (!value) return true;
    try {
      const dateParts = value.split(' ')[0].split('-').map(Number);
      const timeParts = value.split(' ')[1].split(':').map(Number);
      
      const inputDate = new Date(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2],
        timeParts[0],
        timeParts[1]
      );
      
      const now = new Date();
      return inputDate >= now || '現在以降の日時を設定してください。';
    } catch (e) {
      return true; // dateTimeFormatで日付形式のチェックをするので、ここではtrueを返す
    }
  },
  endDateNotInPast: (value: string | null | undefined) => {
    if (!value) return true;
    try {
      const dateParts = value.split(' ')[0].split('-').map(Number);
      const timeParts = value.split(' ')[1].split(':').map(Number);
      
      const inputDate = new Date(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2],
        timeParts[0],
        timeParts[1]
      );
      
      const now = new Date();
      return inputDate >= now || '現在以降の日時を設定してください。';
    } catch (e) {
      return true;
    }
  }
};

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
    if (newNotification.startAt) {
      const startDate = new Date(newNotification.startAt.split(' ')[0]);
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

// 終了日時のMinDate計算関数を追加
const getMinEndDate = () => {
  // 開始日があれば、それを最小値に
  if (newNotification.startAt) {
    try {
      const startDatePart = newNotification.startAt.split(' ')[0];
      if (startDatePart) return startDatePart;
    } catch (e) {
      // エラー時は今日を返す
    }
  }
  // デフォルトは今日
  return todayStr;
};

// 時間選択の確定
const confirmStartTime = () => {
  const dateToUse = selectedStartDate.value;
  if (!dateToUse) {
    startMenu.value = false;
    return;
  }
  
  // 今日より前の日付は設定不可
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateToUse < today) {
    snackbar.text = '開始日時は今日以降の日付を設定してください';
    snackbar.color = 'warning';
    snackbar.show = true;
    return;
  }
  
  const formattedDate = formatDate(dateToUse);
  newNotification.startAt = `${formattedDate} ${startHour.value}:${startMinute.value}`;
  
  // 開始日時が変更され、終了日時が設定されている場合、
  // 終了日時が開始日時より前になっていないかチェック
  if (newNotification.endAt) {
    const startDate = new Date(newNotification.startAt);
    const endDate = new Date(newNotification.endAt);
    
    if (startDate > endDate) {
      // 終了日時をクリアして警告表示
      newNotification.endAt = null;
      selectedEndDate.value = null;
      snackbar.text = '開始日時を変更したため、終了日時がクリアされました。新しく設定してください。';
      snackbar.color = 'info';
      snackbar.show = true;
    }
  }
  
  startMenu.value = false;
};

const confirmEndTime = () => {
  const dateToUse = selectedEndDate.value;
  if (!dateToUse) {
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
  if (newNotification.startAt) {
    try {
      const startDateStr = newNotification.startAt.split(' ')[0];
      const startTimeStr = newNotification.startAt.split(' ')[1];
      const startHourMin = startTimeStr.split(':');
      const startDateParts = startDateStr.split('-').map(Number);
      
      // 開始日時のDateオブジェクトを作成
      const startDate = new Date(
        startDateParts[0], 
        startDateParts[1] - 1, 
        startDateParts[2], 
        parseInt(startHourMin[0]), 
        parseInt(startHourMin[1])
      );
      
      // 終了日時のDateオブジェクトを作成
      const endDateStr = formatDate(dateToUse);
      const endTimeHour = parseInt(endHour.value);
      const endTimeMin = parseInt(endMinute.value);
      const endDateParts = endDateStr.split('-').map(Number);
      const endDate = new Date(
        endDateParts[0], 
        endDateParts[1] - 1, 
        endDateParts[2], 
        endTimeHour, 
        endTimeMin
      );
      
      // 開始日時と終了日時の比較
      if (endDate <= startDate) {
        snackbar.text = '終了日時は開始日時より後に設定してください';
        snackbar.color = 'warning';
        snackbar.show = true;
        return;
      }
    } catch (e) {
      console.error('日付処理エラー:', e);
    }
  }
  
  const formattedDate = formatDate(dateToUse);
  newNotification.endAt = `${formattedDate} ${endHour.value}:${endMinute.value}`;
  endMenu.value = false;
};

const clearEndTime = () => {
  newNotification.endAt = null;
  selectedEndDate.value = null;
  endMenu.value = false;
};

// 時間セレクト用のオプション計算（30分刻み）
const hourOptions = computed(() =>
  Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
);
const minuteOptions = computed(() => ['00', '30']);

// 今日より前の日付は選択不可に設定
const minDate = computed(() => {
  const date = new Date();
  return formatDate(date);
});

// メニューが開いたときに一時状態を初期化するウォッチャー
watch(startMenu, (isOpen) => {
  if (isOpen) {
    // 現在の値からDateオブジェクトを取得
    if (newNotification.startAt && rules.dateTimeFormat(newNotification.startAt) === true) {
      try {
        const date = new Date(newNotification.startAt);
        if (!isNaN(date.getTime())) {
          selectedStartDate.value = date;
          // 時間も抽出
          const timePart = newNotification.startAt.split(' ')[1];
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
    if (newNotification.endAt && rules.dateTimeFormat(newNotification.endAt) === true) {
      try {
        const date = new Date(newNotification.endAt);
        if (!isNaN(date.getTime())) {
          selectedEndDate.value = date;
          // 時間も抽出
          const timePart = newNotification.endAt.split(' ')[1];
          endHour.value = timePart?.split(':')[0] || '00';
          // 30分刻みに強制
          endMinute.value = Number(timePart?.split(':')[1] || 0) < 30 ? '00' : '30';
        } else {
          // 開始日時がある場合はそれを利用、なければ今日
          selectedEndDate.value = newNotification.startAt ? new Date(newNotification.startAt) : today;
          endHour.value = '23';
          endMinute.value = '30';
        }
      } catch (e) {
        selectedEndDate.value = newNotification.startAt ? new Date(newNotification.startAt) : today;
        endHour.value = '23';
        endMinute.value = '30';
      }
    } else {
      selectedEndDate.value = newNotification.startAt ? new Date(newNotification.startAt) : today;
      endHour.value = '23';
      endMinute.value = '30';
    }
  }
});

// アクション
const cancelCreate = () => {
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

const createNotification = async () => {
  if (!createForm.value) return;
  const { valid } = await createForm.value.validate();
  if (!valid) return;

  // 追加のバリデーション
  // 開始日時と終了日時の順序チェック
  if (newNotification.startAt && newNotification.endAt) {
    const startDate = new Date(newNotification.startAt);
    const endDate = new Date(newNotification.endAt);
    
    if (startDate > endDate) {
      snackbar.text = '終了日時は開始日時より後に設定してください';
      snackbar.color = 'error';
      snackbar.show = true;
      return;
    }
    
    // 今日より前の日付チェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
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

  loading.value = true;
  error.value = null;

  try {
    // 日付をISO 8601形式に変換
    const startAtISO = toISOString(newNotification.startAt);
    const endAtISO = toISOString(newNotification.endAt);
    
    if (!startAtISO) {
      throw new Error('開始日時の形式が不正です。正しい日付形式で入力してください。');
    }
    
    // APIにリクエスト送信
    const payload = {
      title: newNotification.title!,
      content: newNotification.content!,
      level: newNotification.level as NotificationLevel,
      startAt: startAtISO,
      endAt: endAtISO,
      isVisibleOnTop: newNotification.isVisibleOnTop || false,
    };

    console.log('送信データ:', payload); // デバッグ用
    const response = await $api.post('/admin/notifications', payload);

    if (response.data) {
      snackbar.text = 'お知らせを新規作成しました。';
      snackbar.color = 'success';
      snackbar.show = true;
      // 成功したら一覧ページにリダイレクト
      setTimeout(() => router.push('/admin/notifications'), 1000);
    } else {
      snackbar.text = 'お知らせの作成に失敗しました。';
      snackbar.color = 'error';
      snackbar.show = true;
    }
  } catch (err: any) {
    if (err.message) {
      error.value = err.message;
    } else {
      error.value = err.response?.data?.message || 'お知らせの作成中にエラーが発生しました';
    }
    console.error('お知らせ作成エラー:', err);
    snackbar.text = error.value || '作成中にエラーが発生しました';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Add styles if needed */
</style> 
