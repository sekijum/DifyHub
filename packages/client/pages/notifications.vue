<template>
  <v-container>
    <PageTitle title="お知らせ" />

    <v-row>
      <v-col cols="12">
        <template v-if="displayedNotifications.length > 0">
          <v-card
            v-for="item in displayedNotifications"
            :key="item.id"
            :class="['mb-4', 'notification-card', `border-${item.level}`]"
            variant="outlined"
          >
            <v-card-title class="pb-1 d-flex flex-column align-start flex-sm-row justify-sm-space-between align-sm-center">
              <span class="text-body-1 font-weight-medium">{{ item.title }}</span>
              <v-chip label size="small" variant="tonal" class="mt-1 mt-sm-0 ms-sm-2 flex-shrink-0"> 
                {{ formatDate(item.startAt) }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pt-1 text-body-2 text-medium-emphasis">
              <div style="white-space: pre-wrap;">{{ item.content }}</div>
            </v-card-text>
          </v-card>

          <!-- Loading Indicator -->
          <div v-if="isLoadingMore" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <!-- All Loaded Message -->
          <div v-if="allItemsLoaded && !isLoadingMore" class="text-center text-medium-emphasis pa-4">
            すべてのお知らせを読み込みました。
          </div>
        </template>
        <v-card v-else variant="outlined">
          <v-card-text class="text-center text-medium-emphasis">
            現在表示できるお知らせはありません。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

// Define the layout for this page
definePageMeta({
  layout: 'default', // Adjust layout name if needed (e.g., 'app')
});

// Interface for a notification item
interface NotificationItem {
  id: number;
  title: string;
  content: string;
  level: 'info' | 'success' | 'warning' | 'error';
  startAt: string; // ISO 8601 format or YYYY-MM-DD HH:MM
  endAt: string;   // ISO 8601 format or YYYY-MM-DD HH:MM
}

// --- Infinite Scroll State ---
const displayedNotifications = ref<NotificationItem[]>([]);
const currentPage = ref(1);
const pageSize = 10; // Number of items to load per page
const isLoadingMore = ref(false);

// Sample notification data
const sampleNotifications = ref<NotificationItem[]>([
  {
    id: 1,
    title: 'システムメンテナンスのお知らせ',
    content: '以下の日時にシステムメンテナンスを実施いたします。\n期間中はサービスをご利用いただけません。\nご不便をおかけしますが、ご理解とご協力をお願いいたします。\n\n日時: 2024年09月15日 02:00 - 04:00',
    level: 'warning',
    startAt: '2024-09-10 00:00',
    endAt: '2024-09-15 02:00', // Future
  },
  {
    id: 2,
    title: '新機能「ダークモード」を追加しました！',
    content: 'ユーザー設定画面からダークモードへの切り替えが可能になりました。ぜひお試しください。',
    level: 'success',
    startAt: '2024-08-01 10:00',
    endAt: '2024-09-30 23:59', // Active
  },
  {
    id: 3,
    title: '【重要】利用規約改定のお知らせ',
    content: '2024年10月1日より利用規約を改定いたします。詳細はリンク先をご確認ください。',
    level: 'error',
    startAt: '2024-08-15 00:00',
    endAt: '2024-09-30 23:59', // Active
  },
   {
    id: 4,
    title: '夏季休業のお知らせ',
    content: '誠に勝手ながら、以下の期間を夏季休業とさせていただきます。\n期間: 2023年08月11日～2023年08月15日\n期間中はご不便をおかけしますが、何卒ご了承くださいますようお願い申し上げます。',
    level: 'info',
    startAt: '2023-08-01 00:00',
    endAt: '2023-08-15 23:59', // Past
  },
   {
    id: 5, // Future notification example
    title: '年末年始のサポート体制について',
    content: '年末年始期間中のカスタマーサポートの対応時間について、後日改めてご案内いたします。',
    level: 'info',
    startAt: '2024-12-01 00:00',
    endAt: '2024-12-31 23:59', // Future
  },
  {
    id: 6,
    title: '新プラン「エンタープライズ」提供開始',
    content: '大規模利用向けのエンタープライズプランの提供を開始しました。詳細は料金プランページをご確認ください。',
    level: 'info',
    startAt: '2024-07-15 00:00',
    endAt: '2024-10-31 23:59', // Active
  },
  {
    id: 7,
    title: '軽微な不具合の修正',
    content: 'ダッシュボード表示に関する軽微な不具合を修正しました。ご利用中の皆様にはご迷惑をおかけいたしました。',
    level: 'success',
    startAt: '2024-08-20 15:00',
    endAt: '2024-08-27 15:00', // Past
  },
   {
    id: 8,
    title: '【復旧済み】一部APIの遅延について',
    content: '本日午前中に発生しておりました一部APIのレスポンス遅延は、14:30頃に復旧いたしました。ご迷惑をおかけし大変申し訳ございませんでした。',
    level: 'info',
    startAt: '2024-08-28 14:30',
    endAt: '2024-08-30 14:30', // Active (assuming today is Aug 28-30)
  },
   {
    id: 9,
    title: 'セキュリティ強化のためのパスワードポリシー変更',
    content: 'セキュリティ向上のため、パスワードの最低文字数を変更しました。次回ログイン時にパスワードの再設定をお願いする場合がございます。',
    level: 'warning',
    startAt: '2024-08-01 00:00',
    endAt: '2024-09-15 23:59', // Active
  },
  // --- Start of additional 20 samples ---
  {
    id: 10,
    title: '新APIエンドポイントのベータテスト参加者募集',
    content: '新しい分析APIのエンドポイントに関するベータテストを実施します。ご興味のある開発者様は、開発者ポータルよりお申し込みください。',
    level: 'info',
    startAt: '2024-08-25 09:00',
    endAt: '2024-09-10 18:00', // Active
  },
  {
    id: 11,
    title: '【障害情報】画像アップロード機能の遅延（解消済み）',
    content: '一時的に画像アップロードに時間がかかる事象が発生しておりましたが、現在は解消しております。ご迷惑をおかけしました。',
    level: 'success',
    startAt: '2024-08-26 11:00',
    endAt: '2024-08-26 18:00', // Past
  },
  {
    id: 12,
    title: '開発者向けドキュメントサイト リニューアルのお知らせ',
    content: 'より使いやすく、情報を探しやすいように開発者向けドキュメントサイトをリニューアルしました。',
    level: 'info',
    startAt: '2024-08-10 00:00',
    endAt: '2024-09-30 23:59', // Active
  },
  {
    id: 13,
    title: '【注意】古いバージョンのSDKサポート終了予定',
    content: 'バージョン1.x系のSDKは、2024年12月末をもってサポートを終了いたします。お早めに最新バージョンへのアップデートをお願いします。',
    level: 'warning',
    startAt: '2024-08-01 00:00',
    endAt: '2024-12-31 23:59', // Active
  },
  {
    id: 14,
    title: 'サーバー増強作業完了のお知らせ',
    content: 'サービスの安定性向上のため、先日告知いたしましたサーバー増強作業が完了いたしました。ご協力ありがとうございました。',
    level: 'success',
    startAt: '2024-08-18 06:00',
    endAt: '2024-08-25 06:00', // Past
  },
  {
    id: 15,
    title: 'パートナープログラム開始のお知らせ',
    content: '弊社のサービスを活用したソリューションを提供するパートナー様向けのプログラムを開始しました。詳細はWebサイトをご覧ください。',
    level: 'info',
    startAt: '2024-09-01 00:00',
    endAt: '2024-11-30 23:59', // Future
  },
  {
    id: 16,
    title: '【重要】不正アクセス試行の増加に関する注意喚起',
    content: '最近、不正アクセスを試みる行為が増加しております。パスワードの定期的な変更と二段階認証の設定を強く推奨します。',
    level: 'error',
    startAt: '2024-08-20 00:00',
    endAt: '2024-09-20 23:59', // Active
  },
  {
    id: 17,
    title: 'ユーザーインターフェース改善アンケートのお願い',
    content: '今後のサービス改善のため、UIに関する簡単なアンケートにご協力いただけますと幸いです。所要時間は約3分です。',
    level: 'info',
    startAt: '2024-08-22 10:00',
    endAt: '2024-09-05 23:59', // Active
  },
  {
    id: 18,
    title: '料金プラン改定の事前告知（2025年1月より）',
    content: '2025年1月1日より、一部料金プランの価格および内容を改定させていただく予定です。詳細は後日改めてご案内いたします。',
    level: 'warning',
    startAt: '2024-09-01 00:00',
    endAt: '2024-12-31 23:59', // Future
  },
  {
    id: 19,
    title: '特定条件下でのデータ不整合の可能性について（修正対応中）',
    content: '特定の操作を行った場合に、まれにデータの不整合が発生する可能性があることが判明しました。現在修正対応を進めております。進捗は追ってご報告いたします。',
    level: 'error',
    startAt: '2024-08-29 18:00',
    endAt: '2024-09-12 18:00', // Active (assuming today is Aug 29-Sep 12)
  },
  {
    id: 20,
    title: 'Webinar開催のお知らせ「最新API活用術」',
    content: '最新APIの効果的な活用方法について解説するWebinarを開催します。参加は無料です。奮ってご参加ください。\n日時: 2024年09月25日 14:00 - 15:00',
    level: 'info',
    startAt: '2024-09-05 00:00',
    endAt: '2024-09-25 14:00', // Future
  },
  {
    id: 21,
    title: 'コミュニティフォーラム開設のお知らせ',
    content: 'ユーザー様同士で情報交換や質問ができるコミュニティフォーラムを開設しました。ぜひご活用ください。',
    level: 'success',
    startAt: '2024-07-01 00:00',
    endAt: '2024-12-31 23:59', // Active
  },
  {
    id: 22,
    title: '【事前告知】大規模アップデート（10月予定）',
    content: '10月に大規模な機能アップデートを予定しております。詳細機能については、準備が整い次第お知らせいたします。',
    level: 'info',
    startAt: '2024-09-01 00:00',
    endAt: '2024-09-30 23:59', // Future
  },
  {
    id: 23,
    title: '一部機能のパフォーマンス改善',
    content: '特定のデータ処理に関するパフォーマンスを改善しました。より快適にご利用いただけるようになりました。',
    level: 'success',
    startAt: '2024-08-15 12:00',
    endAt: '2024-08-31 12:00', // Active (assuming today is Aug 15-31)
  },
  {
    id: 24,
    title: '【注意】フィッシング詐欺にご注意ください',
    content: '弊社を装ったフィッシングメールや偽サイトが確認されています。不審なメールやサイトにはアクセスしないようご注意ください。',
    level: 'error',
    startAt: '2024-06-01 00:00',
    endAt: '2024-12-31 23:59', // Active
  },
  {
    id: 25,
    title: '新しいチュートリアル動画を公開しました',
    content: '基本的な使い方から応用的なテクニックまで学べる新しいチュートリアル動画をヘルプセンターにて公開しました。',
    level: 'info',
    startAt: '2024-08-27 00:00',
    endAt: '2024-10-31 23:59', // Active
  },
  {
    id: 26,
    title: 'サポート窓口混雑に関するお詫び',
    content: '現在、多くのお問い合わせをいただいており、回答までにお時間をいただく場合がございます。順次対応しておりますので、今しばらくお待ちください。',
    level: 'warning',
    startAt: '2024-08-28 00:00',
    endAt: '2024-09-04 23:59', // Active (assuming today is Aug 28 - Sep 4)
  },
  {
    id: 27,
    title: '導入事例インタビュー記事を公開',
    content: '弊社のサービスをご活用いただいている企業様の導入事例インタビュー記事をブログにて公開しました。',
    level: 'info',
    startAt: '2024-08-10 00:00',
    endAt: '2024-09-10 23:59', // Active
  },
  {
    id: 28,
    title: '【復旧】ログイン障害について (08/15 10:00-10:30)',
    content: '本日10:00頃より発生しておりましたログインしにくい状況は、10:30に復旧いたしました。ご迷惑をおかけし申し訳ございませんでした。',
    level: 'success',
    startAt: '2024-08-15 10:30',
    endAt: '2024-08-16 10:30', // Past
  },
  {
    id: 29,
    title: '【未来】来年のイベント出展予定',
    content: '来年開催予定の「Tech Conference 2025」への出展が決定しました。詳細が決まり次第、改めてご案内いたします。',
    level: 'info',
    startAt: '2025-01-15 00:00',
    endAt: '2025-03-31 23:59', // Future
  },
  // --- End of additional 20 samples ---
]); // Define without sorting here

// --- Computed property for Infinite Scroll ---
const allItemsLoaded = computed(() => {
  // Compare displayed count with the total count of *all* notifications
  return displayedNotifications.value.length >= sampleNotifications.value.length;
});

// --- Load More Logic ---
const loadMoreNotifications = async () => {
  if (isLoadingMore.value || allItemsLoaded.value) return;

  isLoadingMore.value = true;
  console.log(`[Infinite Scroll] Loading page ${currentPage.value}`);

  // Simulate API delay (remove in real implementation)
  await new Promise(resolve => setTimeout(resolve, 500));

  const startIndex = (currentPage.value - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  // Slice from the *entire sorted* list of notifications
  const nextItems = sampleNotifications.value.slice(startIndex, endIndex);

  if (nextItems.length > 0) {
    displayedNotifications.value = [...displayedNotifications.value, ...nextItems];
    currentPage.value++;
  }

  isLoadingMore.value = false;
  console.log(`[Infinite Scroll] Loaded page ${currentPage.value - 1}. Total items: ${displayedNotifications.value.length}`);
};

// --- Scroll Event Handler ---
const handleScroll = () => {
  // Check if scrolled to near bottom
  const threshold = 200; // Pixels from bottom
  const bottomOfWindow = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;

  if (bottomOfWindow) {
    loadMoreNotifications();
  }
};

// Helper function to format date (display only date part)
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '日付不明';
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return '日付不明';
    }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // Sort the initial data once mounted
  sampleNotifications.value.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  // Load initial data
  loadMoreNotifications();
  // Attach scroll listener
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  // Remove scroll listener
  window.removeEventListener('scroll', handleScroll);
});

</script>

<style scoped>
/* Add styles if needed */
.notification-card {
  border-left-width: 4px;
  border-left-style: solid;
}

/* Define border colors based on notification level using CSS variables for theme colors */
.border-info {
  border-left-color: rgb(var(--v-theme-info));
}
.border-success {
  border-left-color: rgb(var(--v-theme-success));
}
.border-warning {
  border-left-color: rgb(var(--v-theme-warning));
}
.border-error {
  border-left-color: rgb(var(--v-theme-error));
}
</style> 
