<template>
    <v-container>
      <PageTitle title="開発者申請管理" />
      <v-row>
        <v-col>
          <v-card variant="outlined">

            <!-- Filter Controls Row -->
            <v-row dense class="pa-4 pt-2">
              <v-col cols="12" sm="4" md="3">
                <v-select
                  v-model="selectedStatus"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス"
                  density="compact"
                  outlined
                  hide-details
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="8" md="5">
                <v-text-field
                  v-model="search"
                  append-inner-icon="mdi-magnify"
                  label="検索 (申請者名, Email)"
                  single-line
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredApplications"
              :items-per-page="itemsPerPage"
              @update:items-per-page="itemsPerPage = $event"
              :sort-by="sortBy"
              @update:sort-by="sortBy = $event"
              :multi-sort="false"
              class="elevation-0"
              density="compact"
              :loading="loading"
              loading-text="データを読み込み中..."
              :hover="true"
              items-per-page-text="表示行数"
               :items-per-page-options="itemsPerPageOptions"
            >
              <template v-slot:item.applicant="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="32" class="mr-2">
                    <v-img :src="item.applicantAvatarUrl" v-if="item.applicantAvatarUrl">
                      <template v-slot:placeholder>
                        <v-row class="fill-height ma-0" align="center" justify="center">
                          <v-progress-circular indeterminate color="grey-lighten-5" size="20"></v-progress-circular>
                        </v-row>
                      </template>
                    </v-img>
                    <v-icon v-else>mdi-account-circle</v-icon>
                  </v-avatar>
                  <div>
                    <div>{{ item.applicantName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.applicantEmail }}</div>
                  </div>
                </div>
              </template>

              <template v-slot:item.reason="{ item }">
                <div class="text-truncate" style="max-width: 250px;" :title="item.reason">
                   {{ item.reason }}
                </div>
              </template>

              <template v-slot:item.portfolioUrl="{ item }">
                <a v-if="item.portfolioUrl" :href="item.portfolioUrl" target="_blank" rel="noopener noreferrer">
                  {{ item.portfolioUrl.length > 30 ? item.portfolioUrl.substring(0, 30) + '...' : item.portfolioUrl }}
                   <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                </a>
                <span v-else class="text-grey">-</span>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" density="compact" label>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <template v-if="item.status === 'pending'">
                  <v-btn icon="mdi-check-circle-outline" color="success" variant="text" density="compact" @click="openApproveDialog(item)"></v-btn>
                  <v-btn icon="mdi-close-circle-outline" color="error" variant="text" density="compact" @click="openRejectDialog(item)"></v-btn>
                </template>
                <span v-else class="text-grey">-</span>
              </template>

              <template v-slot:no-data>
                条件に一致する申請が見つかりません。
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- Confirmation Dialogs -->
      <ConfirmationDialog
        v-model="isApproveDialogOpen"
        title="申請承認確認"
        :message="`申請者「${selectedApplication?.applicantName}」の開発者登録を承認しますか？`"
        confirm-text="承認する"
        confirm-color="success"
        @confirm="confirmApproveApplication"
      />
      <ConfirmationDialog
        v-model="isRejectDialogOpen"
        title="申請却下確認"
        :message="`申請者「${selectedApplication?.applicantName}」の開発者申請を却下しますか？`"
        confirm-text="却下する"
        confirm-color="error"
        @confirm="confirmRejectApplication"
      />

    </v-container>
  </template>

  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { VDataTable } from 'vuetify/components';
  import PageTitle from '~/components/PageTitle.vue';
  import ConfirmationDialog from '~/components/ConfirmationDialog.vue';

  definePageMeta({
    layout: 'admin', // Use admin layout
  });

  type DeveloperApplicationStatus = 'pending' | 'approved' | 'rejected';
  type SortItem = { key: string; order: 'asc' | 'desc' };

  // Interface for developer application entry
  interface DeveloperApplicationEntry {
    id: number;
    applicantId: number;
    applicantName: string;
    applicantEmail: string;
    applicantAvatarUrl?: string;
    reason: string;
    portfolioUrl?: string;
    status: DeveloperApplicationStatus;
    appliedAt: string;
  }

  // --- State ---
  const search = ref('');
  const selectedStatus = ref<DeveloperApplicationStatus | null>(null);
  const itemsPerPage = ref(10);
  const sortBy = ref<SortItem[]>([{ key: 'appliedAt', order: 'desc' }]);
  const loading = ref(false);
  const isApproveDialogOpen = ref(false);
  const isRejectDialogOpen = ref(false);
  const selectedApplication = ref<DeveloperApplicationEntry | null>(null);

  // Options
  const statusOptions = ref([
    { title: '未対応', value: 'pending' },
    { title: '承認済み', value: 'approved' },
    { title: '却下済み', value: 'rejected' },
  ]);

  const itemsPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
  ];

  // --- Data Table Headers ---
  type ReadonlyHeaders = VDataTable['$props']['headers'];

  const headers: ReadonlyHeaders = [
    { title: '申請者', key: 'applicant', align: 'start', sortable: false },
    { title: '理由/概要', key: 'reason', align: 'start', sortable: false },
    { title: 'ポートフォリオ', key: 'portfolioUrl', align: 'start', sortable: false },
    { title: 'ステータス', key: 'status', align: 'center', width: 120 },
    { title: '申請日時', key: 'appliedAt', align: 'start', width: 150 },
    { title: 'アクション', key: 'actions', sortable: false, align: 'center', width: 100 },
  ];

  // --- Sample Data Generation ---
  const generateSampleApplications = (count: number): DeveloperApplicationEntry[] => {
    const applications: DeveloperApplicationEntry[] = [];
    const names = ['申請者 太郎', '開発 希望子', 'クリエイター 鈴木', 'コード 職人', 'アプリ メーカー'];
    const emails = ['apply@example.com', 'dev@sample.net', 'creator@mail.org', 'code@test.jp', 'maker@dummy.co'];
    const statuses: DeveloperApplicationStatus[] = ['pending', 'pending', 'approved', 'rejected'];
    const reasons = [
      'AIチャットボットを開発・公開し、多くの人に使ってもらいたいです。',
      '画像生成アプリを作成しました。ぜひ公開させてください。',
      '業務効率化ツールを開発中です。ベータ版を公開したい。',
      '新しい技術を使った実験的なアプリを作りました。',
      '収益化を目指してアプリ開発に取り組んでいます。',
    ];
    const portfolios = [
        'https://github.com/user1',
        'https://gitlab.com/user2',
        undefined,
        'https://bitbucket.org/user3',
        'https://portfolio.example.com/user4',
    ];

    for (let i = 1; i <= count; i++) {
      const date = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Within last 60 days
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const nameIndex = Math.floor(Math.random() * names.length);
      const applicantId = 100 + i; // Dummy user ID

      applications.push({
        id: i,
        applicantId: applicantId,
        applicantName: names[nameIndex],
        applicantEmail: emails[nameIndex].replace('@', `${applicantId}@`),
        applicantAvatarUrl: status !== 'rejected' && Math.random() > 0.3 ? `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${i}.jpg` : undefined,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        portfolioUrl: portfolios[Math.floor(Math.random() * portfolios.length)],
        status: status,
        appliedAt: date.toISOString().substring(0, 16).replace('T', ' '), // YYYY-MM-DD HH:MM
      });
    }
    return applications;
  };

  const applications = ref<DeveloperApplicationEntry[]>(generateSampleApplications(25)); // Generate sample data

  // --- Computed Properties ---
  const filteredApplications = computed(() => {
    return applications.value.filter(app => {
      const statusMatch = !selectedStatus.value || app.status === selectedStatus.value;
      const searchMatch = !search.value ||
                          app.applicantName.toLowerCase().includes(search.value.toLowerCase()) ||
                          app.applicantEmail.toLowerCase().includes(search.value.toLowerCase());
      return statusMatch && searchMatch;
    });
  });

  // --- Methods ---
  const getStatusColor = (status: DeveloperApplicationStatus): string => {
    switch (status) {
      case 'pending': return 'blue';
      case 'approved': return 'green';
      case 'rejected': return 'grey';
      default: return 'default';
    }
  };

  const getStatusText = (status: DeveloperApplicationStatus): string => {
    const option = statusOptions.value.find(o => o.value === status);
    return option ? option.title : status;
  };

  const openApproveDialog = (application: DeveloperApplicationEntry) => {
    selectedApplication.value = application;
    isApproveDialogOpen.value = true;
  };

  const openRejectDialog = (application: DeveloperApplicationEntry) => {
    selectedApplication.value = application;
    isRejectDialogOpen.value = true;
  };

  const confirmApproveApplication = () => {
    if (selectedApplication.value) {
      console.log('Approving application:', selectedApplication.value.id);
      // TODO: API call to approve application
      const index = applications.value.findIndex(a => a.id === selectedApplication.value!.id);
      if (index !== -1) {
        applications.value[index].status = 'approved';
      }
    }
    selectedApplication.value = null;
    isApproveDialogOpen.value = false;
  };

  const confirmRejectApplication = () => {
    if (selectedApplication.value) {
      console.log('Rejecting application:', selectedApplication.value.id);
      // TODO: API call to reject application
      const index = applications.value.findIndex(a => a.id === selectedApplication.value!.id);
      if (index !== -1) {
        applications.value[index].status = 'rejected';
      }
    }
    selectedApplication.value = null;
    isRejectDialogOpen.value = false;
  };

  // TODO: Add function to fetch applications from API
  // onMounted(() => { fetchApplications(); });

  </script>

  <style scoped>
  .v-data-table {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
  .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: help; /* Indicate that full text is available on hover (via title) */
  }
  </style> 
