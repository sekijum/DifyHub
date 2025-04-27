<template>
  <v-container>
    <PageTitle :title="`お知らせ編集: ${editableNotification.title || '...'}`" />
    <v-form ref="editForm">
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
                 <v-text-field
                   v-model="editableNotification.startAt"
                   label="開始日時 (YYYY-MM-DD HH:MM) *"
                   placeholder="例: 2024-08-15 10:00"
                   required
                   variant="outlined" 
                   density="compact"
                   :rules="[rules.required, rules.dateTimeFormat]"
                   hint="お知らせが表示される開始日時"
                   persistent-hint
                 ></v-text-field>
               </v-col>

               <!-- EndAt -->
               <v-col cols="12" md="6">
                 <v-text-field
                   v-model="editableNotification.endAt"
                   label="終了日時 (YYYY-MM-DD HH:MM) *"
                   placeholder="例: 2024-08-31 23:59"
                   required
                   variant="outlined"
                   density="compact"
                   :rules="[rules.required, rules.dateTimeFormat, rules.dateOrder]"
                   hint="お知らせが表示される終了日時"
                   persistent-hint
                 ></v-text-field>
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
          <v-btn color="primary" variant="elevated" @click="saveNotification" :loading="isSaving">
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
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const notificationId = Number(route.params.id);

// Type definitions
type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: number;
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: string;
  endAt: string;
}

// --- Form and State ---
const editForm = ref<any>(null);
const editableNotification = reactive<Partial<Notification>>({});
const isSaving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

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
      const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
      return regex.test(value) || 'YYYY-MM-DD HH:MM 形式で入力してください。';
  },
  dateOrder: (value: string | null | undefined) => {
      if (!value || !editableNotification.startAt) return true;
      const start = new Date(editableNotification.startAt);
      const end = new Date(value);
      return start <= end || '終了日時は開始日時より後に設定してください。';
  }
};

// --- Fetch Notification Data (Simulation) ---
const fetchNotificationData = (id: number): Notification | null => {
    // Simulate finding notification data
    const sampleNotifications = generateSampleNotifications(20); // Use the updated generator
    const found = sampleNotifications.find(n => n.id === id);
    return found || null;
}

onMounted(() => {
  // TODO: Replace this with actual API call to fetch notification data by notificationId
  console.log(`Fetching data for notification ID: ${notificationId}`);
  const existingNotification = fetchNotificationData(notificationId);

  if (existingNotification) {
    Object.assign(editableNotification, existingNotification);
    // Ensure level is set, default to 'info' if not present in fetched data (safety measure)
    if (!editableNotification.level) {
        editableNotification.level = 'info';
    }
  } else {
    console.error(`Notification with ID ${notificationId} not found.`);
    snackbar.text = 'お知らせが見つかりません。';
    snackbar.color = 'error';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/notifications'), 2000);
  }
});


// --- Actions ---
const cancelEdit = () => {
  router.push('/admin/notifications');
};

const saveNotification = async () => {
  if (!editForm.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  isSaving.value = true;

  // Construct the payload (ensure all required fields are present)
  const payload: Notification = {
      id: editableNotification.id!,
      title: editableNotification.title!,
      content: editableNotification.content!,
      level: editableNotification.level!,
      startAt: editableNotification.startAt!,
      endAt: editableNotification.endAt!,
  };

  try {
    // --- Placeholder for Update Logic ---
    console.log('Saving notification data (simulation):', payload);
    // TODO: Replace with actual API call (e.g., PUT /api/notifications/{id})
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save

    snackbar.text = 'お知らせ情報を保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/notifications'), 1500); // Redirect after delay

  } catch (error) {
    console.error("Error during notification save simulation:", error);
    snackbar.text = '保存中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
};

// --- Helper: Sample Data Generation (Updated) ---
const generateSampleNotifications = (count: number): Notification[] => {
  const list: Notification[] = [];
  const titles = ['新機能リリースのお知らせ', 'メンテナンスのお知らせ', '利用規約改定', 'キャンペーン情報', '障害情報'];
  const contents = ['〇〇機能が追加されました。', 'サーバーメンテナンスを実施します。', 'プライバシーポリシーを更新しました。', '期間限定セール開催中！', '現在一部サービスが利用しづらい状況です。'];
  const levels: NotificationLevel[] = ['info', 'success', 'warning', 'error', 'info'];

  for (let i = 1; i <= count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const startDay = Math.floor(Math.random() * 28) + 1;
    const startMonth = Math.floor(Math.random() * 12) + 1;
    const startYear = 2024;
    const startHour = Math.floor(Math.random() * 24);
    const startMinute = Math.floor(Math.random() * 60);

    const startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
    const endDate = new Date(startDate.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}`;
    };

    list.push({
      id: i,
      title: `${titles[Math.floor(Math.random() * titles.length)]} #${i}`,
      content: `${contents[Math.floor(Math.random() * contents.length)]} 詳細はこちらをご覧ください。URL...`,
      level: level,
      startAt: formatDate(startDate),
      endAt: formatDate(endDate),
    });
  }
  return list.sort((a, b) => b.id - a.id);
};


</script>

<style scoped>
/* Add styles if needed */
</style> 
