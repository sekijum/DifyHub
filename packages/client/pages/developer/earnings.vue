<template>
  <v-container>
    <PageTitle title="収益管理" />
    <p class="text-medium-emphasis mb-4">
      ここでは、あなたのアプリから得られた収益の月次レポート、出金履歴、および出金口座の設定を確認・管理できます。
    </p>

    <!-- Revenue Calculation Explanation - Moved Here -->
    <v-row class="mb-2">
      <v-col cols="12">
        <v-card variant="tonal" color="info">
          <v-card-title class="text-subtitle-1">収益の計算方法について</v-card-title>
          <v-card-text>
            <p>アプリ収益は「<strong>利用回数</strong>」と「<strong>高評価率</strong>」に応じて計算されます。</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Overview Cards - Updated Responsive Cols -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>総利益</v-card-title>
          <v-card-text class="text-h4">
            {{ formatCurrency(totalGrossEarnings) }}
          </v-card-text>
          <v-card-subtitle class="pb-2">
            (これまでの収益合計)
          </v-card-subtitle>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>出金可能額</v-card-title>
          <v-card-text class="text-h4">
            {{ formatCurrency(totalWithdrawableFromFinalized) }}
          </v-card-text>
          <v-card-subtitle class="pb-2">
            (現在出金できる収益合計)
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Monthly Earnings Report - Added Horizontal Scroll -->
    <v-row>
       <v-col cols="12">
            <v-card variant="outlined" class="mt-6">
                <v-card-title>月次収益レポート</v-card-title>
                <v-card-text>
                    <div style="overflow-x: auto;"> <!-- Added scroll wrapper -->
                      <v-data-table
                        :headers="monthlyHeaders"
                        :items="monthlyEarnings"
                        item-value="month"
                        show-select
                        v-model="selectedMonthsToWithdraw"
                        :items-per-page="5"
                        density="compact"
                        :hover="true"
                        :item-selectable="(item) => item.status === 'finalized' && item.isWithdrawable"
                        class="text-no-wrap"
                      >
                         <template v-slot:item.totalRevenue="{ item }">
                            <strong>{{ formatCurrency(item.totalRevenue) }}</strong>
                         </template>
                         <template v-slot:item.status="{ item }">
                            <v-chip :color="getMonthlyStatusColor(item.status)" density="compact" label size="small">
                               {{ getMonthlyStatusText(item.status) }}
                            </v-chip>
                         </template>
                         <template v-slot:no-data>
                             月次収益レポートはありません。
                         </template>
                      </v-data-table>
                    </div> <!-- End scroll wrapper -->
                </v-card-text>
                <v-card-actions class="justify-end px-4 pb-4">
                    <span class="text-body-2 mr-4">選択合計: <strong>{{ formatCurrency(selectedWithdrawalAmount) }}</strong></span>
                    <v-btn
                       variant="outlined"
                       @click="openWithdrawDialog(false)"
                       :disabled="!canWithdrawSelected || !isBankAccountRegistered"
                       class="mr-2"
                       size="small"
                    >
                       選択した月を出金申請
                    </v-btn>
                    <v-btn
                       color="primary"
                       @click="openWithdrawDialog(true)"
                       :disabled="!canWithdrawAllAvailable || !isBankAccountRegistered"
                       size="small"
                     >
                       可能な全額を出金申請
                     </v-btn>
                </v-card-actions>
                <v-card-text v-if="!isBankAccountRegistered" class="pt-0 px-4 pb-3">
                    <v-alert type="warning" density="compact" variant="tonal" class="text-caption">
                       出金申請を行うには、まず下のフォームから出金口座情報を登録してください。
                    </v-alert>
                </v-card-text>
                <!-- Add withdrawal notes here -->
                <v-card-text class="pt-0 px-4 pb-3 text-caption">
                    <p>※ 収益の出金時には、所定の手数料（申請額の10% + 200円）が適用されます。</p>
                    <p>※ 10,000円以上から出金可能です。</p>
                </v-card-text>
            </v-card>
       </v-col>
    </v-row>

    <!-- Withdrawal History - Added Horizontal Scroll -->
    <v-row>
        <v-col cols="12">
            <v-card variant="outlined" class="mt-6">
                <v-card-title>出金履歴</v-card-title>
                <v-card-text>
                   <div style="overflow-x: auto;"> <!-- Added scroll wrapper -->
                      <v-data-table
                        :headers="withdrawalHeaders"
                        :items="withdrawalHistory"
                        :items-per-page="5"
                        density="compact"
                        :hover="true"
                        show-expand
                        item-value="id"
                        class="text-no-wrap"
                      >
                         <!-- Updated slots for new columns -->
                         <template v-slot:item.amount="{ item }">
                           {{ formatCurrency(item.amount) }}
                         </template>
                         <template v-slot:item.feeAmount="{ item }">
                           {{ formatCurrency(item.feeAmount) }}
                         </template>
                         <template v-slot:item.transferredAmount="{ item }">
                           <strong>{{ formatCurrency(item.transferredAmount) }}</strong>
                         </template>
                         <template v-slot:item.status="{ item }">
                           <v-chip :color="getWithdrawalStatusColor(item.status)" density="compact" label>
                             {{ getWithdrawalStatusText(item.status) }}
                           </v-chip>
                         </template>
                         <template v-slot:no-data>
                           出金履歴はありません。
                         </template>
                         
                         <!-- Expanded Row Slot - Updated -->
                         <template v-slot:expanded-row="{ columns, item }">
                           <tr>
                             <td :colspan="columns.length">
                               <!-- Monthly Earnings Breakdown -->
                               <v-card variant="tonal" class="my-2">
                                  <v-card-text>
                                   <p class="text-subtitle-2 mb-2">出金対象月 内訳 (申請額ベース):</p> 
                                   <v-table density="compact">
                                     <thead>
                                       <tr>
                                         <th class="text-left">年月</th>
                                         <th class="text-right">収益額</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       <tr v-for="earning in item.associatedMonthlyEarnings" :key="earning.month">
                                         <td>{{ earning.month }}</td>
                                         <td class="text-right">{{ formatCurrency(earning.totalRevenue) }}</td>
                                       </tr>
                                     </tbody>
                                   </v-table>
                                  </v-card-text>
                               </v-card>

                               <!-- Destination Bank Account Info -->
                               <v-card variant="outlined" class="my-2">
                                  <v-card-text>
                                   <p class="text-subtitle-2 mb-2">振込先口座情報 (申請時)</p>
                                   <v-list density="compact">
                                      <v-list-item density="compact">
                                        <v-list-item-title class="text-caption">銀行名:</v-list-item-title>
                                        <template v-slot:append><span class="text-caption">{{ item.destinationAccount?.bankName || '-' }}</span></template>
                                      </v-list-item>
                                      <v-list-item density="compact">
                                        <v-list-item-title class="text-caption">支店名:</v-list-item-title>
                                        <template v-slot:append><span class="text-caption">{{ item.destinationAccount?.branchName || '-' }}</span></template>
                                      </v-list-item>
                                      <v-list-item density="compact">
                                        <v-list-item-title class="text-caption">口座種別:</v-list-item-title>
                                        <template v-slot:append><span class="text-caption">{{ item.destinationAccount?.accountType || '-' }}</span></template>
                                      </v-list-item>
                                      <v-list-item density="compact">
                                        <v-list-item-title class="text-caption">口座番号:</v-list-item-title>
                                        <template v-slot:append><span class="text-caption">{{ item.destinationAccount?.maskedAccountNumber || '-' }}</span></template>
                                      </v-list-item>
                                      <v-list-item density="compact">
                                        <v-list-item-title class="text-caption">口座名義:</v-list-item-title>
                                        <template v-slot:append><span class="text-caption">{{ item.destinationAccount?.accountHolderName || '-' }}</span></template>
                                      </v-list-item>
                                   </v-list>
                                  </v-card-text>
                               </v-card>
                             </td>
                           </tr>
                         </template>
                      </v-data-table>
                   </div> <!-- End scroll wrapper -->
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <!-- Bank Account Registration - Updated Responsive Cols -->
    <v-row>
      <v-col cols="12">
        <v-card variant="outlined" class="mt-6">
          <v-card-title>出金口座設定</v-card-title>
          <v-card-text>
            <v-form ref="bankAccountForm" @submit.prevent="saveBankAccount">
              <v-row>
                <v-col cols="12" md="6"> <!-- Already responsive -->
                  <v-text-field
                    v-model="bankAccount.bankName"
                    label="銀行名 *"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6"> <!-- Already responsive -->
                  <v-text-field
                    v-model="bankAccount.branchName"
                    label="支店名 *"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6"> <!-- Already responsive -->
                  <v-select
                    v-model="bankAccount.accountType"
                    :items="accountTypeOptions"
                    label="口座種別 *"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6"> <!-- Already responsive -->
                  <v-text-field
                    v-model="bankAccount.accountNumber"
                    label="口座番号 *"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required, rules.numeric]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12"> <!-- Already full width -->
                  <v-text-field
                    v-model="bankAccount.accountHolderName"
                    label="口座名義人 (カタカナ) *"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required, rules.katakana]"
                    hint="全角カタカナで入力してください"
                    persistent-hint
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn 
                type="submit" 
                color="primary" 
                class="mt-4"
              >
                口座情報を保存
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Withdrawal Request Dialog - Updated -->
     <v-dialog v-model="isWithdrawDialogOpen" max-width="500px">
       <v-card>
         <v-card-title>出金申請</v-card-title>
         <v-card-text>
           <!-- Updated Selected Months Display -->
           <div class="mb-3">
             <span class="text-subtitle-2">選択中の月:</span>
             <template v-if="selectedMonthsToWithdraw.length > 0">
               <v-chip 
                 v-for="month in selectedMonthsToWithdraw" 
                 :key="month" 
                 density="compact" 
                 class="ma-1"
                 label
                 size="small"
                >
                 {{ month }}
               </v-chip>
             </template>
             <span v-else class="text-caption ml-2">なし</span>
           </div>

           <!-- Bank Account Confirmation -->
           <v-card variant="outlined" class="my-3 pa-3">
             <p class="text-subtitle-2 mb-2">振込先口座情報</p>
             <v-list density="compact">
               <v-list-item density="compact">
                 <v-list-item-title class="text-caption">銀行名:</v-list-item-title>
                 <template v-slot:append><span class="text-caption">{{ bankAccount.bankName }}</span></template>
               </v-list-item>
               <v-list-item density="compact">
                 <v-list-item-title class="text-caption">支店名:</v-list-item-title>
                 <template v-slot:append><span class="text-caption">{{ bankAccount.branchName }}</span></template>
               </v-list-item>
               <v-list-item density="compact">
                 <v-list-item-title class="text-caption">口座種別:</v-list-item-title>
                 <template v-slot:append><span class="text-caption">{{ bankAccount.accountType }}</span></template>
               </v-list-item>
               <v-list-item density="compact">
                 <v-list-item-title class="text-caption">口座番号:</v-list-item-title>
                 <template v-slot:append><span class="text-caption">{{ maskedAccountNumber }}</span></template>
               </v-list-item>
               <v-list-item density="compact">
                 <v-list-item-title class="text-caption">口座名義:</v-list-item-title>
                 <template v-slot:append><span class="text-caption">{{ bankAccount.accountHolderName }}</span></template>
               </v-list-item>
             </v-list>
             <v-checkbox 
                v-model="isBankAccountConfirmed"
                label="上記の振込先口座情報が正しいことを確認しました"
                density="compact"
                hide-details
                class="mt-2"
             ></v-checkbox>
           </v-card>
           
           <!-- Display withdrawal details with fees -->
           <v-list density="compact" class="my-3">
             <v-list-item>
               <v-list-item-title>申請額</v-list-item-title>
               <template v-slot:append>
                 {{ formatCurrency(selectedWithdrawalAmount) }}
               </template>
             </v-list-item>
             <v-list-item>
               <v-list-item-title>
                  出金手数料 <span class="text-caption">(10% + 200円)</span>
               </v-list-item-title>
               <template v-slot:append>
                 - {{ formatCurrency(calculatedFee) }}
               </template>
             </v-list-item>
             <v-divider></v-divider>
             <v-list-item class="font-weight-bold">
               <v-list-item-title>振込予定額</v-list-item-title>
               <template v-slot:append>
                 {{ formatCurrency(finalTransferAmount) }}
               </template>
             </v-list-item>
           </v-list>

           <p class="text-caption font-weight-bold text-error mt-3">※ 申請後は取り消しできません。</p>
           <p class="text-caption mt-2">上記で登録された銀行口座に出金します。</p>
           <p class="text-caption">原則として、月末締め・翌月末の振込となります。</p>
           <p class="text-caption">今回の申請分の振込予定日: <strong>{{ estimatedTransferDateFormatted }}</strong></p>
         </v-card-text>
         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn variant="text" @click="closeWithdrawDialog">キャンセル</v-btn>
           <v-btn 
             color="primary" 
             @click="submitWithdrawRequest" 
             :loading="isWithdrawing"
             :disabled="!isBankAccountConfirmed || isWithdrawing"
            >
             申請する
           </v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>

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
import { ref, computed, reactive, watch, onMounted } from 'vue';
import PageTitle from '~/components/PageTitle.vue';
import type { VDataTable } from 'vuetify/components';

// Define type alias earlier
type ReadonlyHeaders = VDataTable['$props']['headers'];

definePageMeta({
  layout: 'developer',
});

// --- Interfaces ---
interface MonthlyEarning {
  month: string; // YYYY-MM format
  totalRevenue: number;
  status: 'pending' | 'finalized' | 'processing' | 'paid_out';
  isWithdrawable: boolean;
}

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';
// Define BankAccount type for reuse
interface BankAccountInfo {
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string; // Keep original number here if needed elsewhere
    accountHolderName: string;
}
// Define structure for destination account in history (includes masked number)
interface DestinationAccountInfo {
    bankName: string;
    branchName: string;
    accountType: string;
    maskedAccountNumber: string; // Store masked number
    accountHolderName: string;
}
interface WithdrawalHistoryEntry {
    id: number;
    amount: number; 
    feeAmount: number; 
    transferredAmount: number; 
    status: WithdrawalStatus;
    requestedAt: string;
    processedAt?: string;
    associatedMonthlyEarnings: { month: string, totalRevenue: number }[];
    destinationAccount?: DestinationAccountInfo; // Add destination account
}

// --- State ---
const totalWithdrawnAmount = ref(123456); 
const monthlyEarnings = ref<MonthlyEarning[]>([]); 
const selectedMonthsToWithdraw = ref<string[]>([]); 

const isWithdrawDialogOpen = ref(false);
const isWithdrawing = ref(false);
const isBankAccountConfirmed = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });
const isBankAccountRegistered = ref(false); 
const bankAccountForm = ref<any>(null);
const isSavingBankAccount = ref(true);
const isLoading = ref(true); 
// Use the BankAccountInfo type for the reactive bankAccount
const bankAccount = reactive<BankAccountInfo>({
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolderName: ''
});
const accountTypeOptions = ['普通', '当座'];
const withdrawalHistory = ref<WithdrawalHistoryEntry[]>([]); 

// --- Withdrawal Status Options ---
interface WithdrawalStatusOption { title: string; value: WithdrawalStatus; }
const withdrawalStatusOptions: WithdrawalStatusOption[] = [
    { title: '処理中', value: 'pending' }, { title: '処理中', value: 'processing' },
    { title: '完了', value: 'completed' }, { title: '失敗', value: 'failed' },
];

// --- Computed Properties ---
// Total Gross Earnings (Sum of all monthly earnings)
const totalGrossEarnings = computed(() => {
  return monthlyEarnings.value.reduce((sum, e) => sum + e.totalRevenue, 0);
});

// Total Withdrawable from finalized months
const totalWithdrawableFromFinalized = computed(() => {
  return monthlyEarnings.value
    .filter(e => e.status === 'finalized' && e.isWithdrawable)
    .reduce((sum, e) => sum + e.totalRevenue, 0);
});

// Selected withdrawal amount (Gross)
const selectedWithdrawalAmount = computed(() => {
  return monthlyEarnings.value
    .filter(e => selectedMonthsToWithdraw.value.includes(e.month))
    .reduce((sum, e) => sum + e.totalRevenue, 0);
});

// Calculated fee for the selected amount
const calculatedFee = computed(() => {
  if (!selectedWithdrawalAmount.value || selectedWithdrawalAmount.value < 0) return 0;
  // Ensure fee doesn't exceed the amount itself, although unlikely with positive amounts
  const fee = Math.max(0, Math.floor(selectedWithdrawalAmount.value * 0.10) + 200); 
  return fee;
});

// Final transfer amount after fee deduction
const finalTransferAmount = computed(() => {
  return Math.max(0, selectedWithdrawalAmount.value - calculatedFee.value);
});

// Check if the selected amount meets the minimum withdrawal threshold
const canWithdrawSelected = computed(() => {
    // Base condition on the requested amount meeting minimum
    return selectedWithdrawalAmount.value >= 10000; 
    // We could also check if finalTransferAmount > 0, but minimum applies to gross
});

// Check if the total available meets the minimum threshold
const canWithdrawAllAvailable = computed(() => {
    return totalWithdrawableFromFinalized.value >= 10000;
});

// Masked account number
const maskedAccountNumber = computed(() => {
  const num = bankAccount.accountNumber;
  if (!num || num.length <= 4) return num; // Don't mask if too short
  return '*'.repeat(num.length - 4) + num.slice(-4);
});

// Estimated Transfer Date Calculation
const estimatedTransferDateFormatted = computed(() => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Calculate the year and month of the month *after* the next month
  let targetYear = currentYear;
  let targetMonth = currentMonth + 2; // Month after next

  if (targetMonth > 11) {
    targetMonth = targetMonth - 12;
    targetYear += 1;
  }

  // Get the first day of the month *after* the next month
  const firstDayOfSecondNextMonth = new Date(targetYear, targetMonth, 1);

  // Subtract one day to get the last day of the next month
  const lastDayOfNextMonth = new Date(firstDayOfSecondNextMonth.getTime() - (24 * 60 * 60 * 1000));

  // Format the date
  const y = lastDayOfNextMonth.getFullYear();
  const m = String(lastDayOfNextMonth.getMonth() + 1).padStart(2, '0'); // +1 because getMonth is 0-indexed
  const d = String(lastDayOfNextMonth.getDate()).padStart(2, '0');
  
  return `${y}年${m}月${d}日頃`;
});

// --- Sample Data Generation ---
const generateSampleMonthlyEarnings = (monthsCount: number): MonthlyEarning[] => {
    const earnings: MonthlyEarning[] = [];
    const today = new Date();
    let currentBalance = 78900; 
    let hasProcessing = false; 

    for (let i = 0; i < monthsCount; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const totalRevenue = Math.floor(Math.random() * 35000) + 5000; 
        let status: MonthlyEarning['status'];
        let isWithdrawable = false;

        if (i === 0) { status = 'pending'; } 
        else if (i === 1 && currentBalance > 0) { 
            status = 'finalized'; isWithdrawable = true; currentBalance -= totalRevenue;
             if (!hasProcessing && Math.random() < 0.3) { status = 'processing'; isWithdrawable = false; hasProcessing = true; }
        } else if (currentBalance > 0) { 
            status = 'finalized'; isWithdrawable = true; currentBalance -= totalRevenue;
             if (!hasProcessing && Math.random() < 0.15) { status = 'processing'; isWithdrawable = false; hasProcessing = true; }
        } else { status = 'paid_out'; }
         if(currentBalance < 0 && status !== 'processing') { 
            isWithdrawable = false; if(status === 'finalized') status = 'paid_out'; currentBalance = 0;
         }
        earnings.push({ month: monthStr, totalRevenue, status, isWithdrawable });
    }
    return earnings;
};

// Updated generateSampleWithdrawals to include destinationAccount
const generateSampleWithdrawals = (count: number): WithdrawalHistoryEntry[] => {
   const history: WithdrawalHistoryEntry[] = [];
    const statuses: WithdrawalStatus[] = ['completed', 'completed', 'completed', 'failed', 'processing', 'pending'];
    let placeholderGrossWithdrawn = 123456; 
    const availableMonths = monthlyEarnings.value 
                            .filter(e => e.status === 'paid_out') 
                            .map(e => ({ month: e.month, totalRevenue: e.totalRevenue }))
                            .sort(() => 0.5 - Math.random()); 
    let monthIndex = 0;
    let accumulatedGross = 0; 

    // Sample bank details for history
    const sampleBankAccounts: DestinationAccountInfo[] = [
        { bankName: 'サンプル銀行', branchName: '本店', accountType: '普通', maskedAccountNumber: '***1234', accountHolderName: 'ﾃﾞｨﾌｨｰ ﾀﾛｳ' },
        { bankName: 'テスト銀行', branchName: '渋谷支店', accountType: '当座', maskedAccountNumber: '***5678', accountHolderName: 'ﾃﾞｨﾌｨｰ ﾊﾅｺ' },
        { bankName: '架空信金', branchName: '新宿西口', accountType: '普通', maskedAccountNumber: '***9012', accountHolderName: 'ﾃﾞｨﾌｨｰ ｼﾞﾛｳ' },
    ];
    let bankIndex = 0;

    for (let i = 1; i <= count; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const requestedDate = new Date(Date.now() - (Math.random() * 365 + 5) * 24 * 60 * 60 * 1000); 
        let processedDate: Date | undefined = undefined;
        
        const numAssociated = Math.floor(Math.random() * 3) + 1;
        const associatedEarnings: { month: string, totalRevenue: number }[] = [];
        let requestedAmount = 0; 
        for (let j = 0; j < numAssociated && monthIndex < availableMonths.length; j++) {
            const earning = availableMonths[monthIndex++];
            associatedEarnings.push(earning);
            requestedAmount += earning.totalRevenue;
        }

        if (requestedAmount < 10000) continue; 

        const fee = Math.floor(requestedAmount * 0.10) + 200;
        const transferred = Math.max(0, requestedAmount - fee);

        // Get sample destination account details
        const destination = sampleBankAccounts[bankIndex % sampleBankAccounts.length];
        bankIndex++;

        if (status === 'completed' || status === 'failed') {
            processedDate = new Date(requestedDate.getTime() + (Math.random() * 25 + 2) * 24 * 60 * 60 * 1000);
            if (status === 'completed') {
               accumulatedGross += requestedAmount; 
            }
        }

        history.push({
            id: Date.now() + i, 
            amount: requestedAmount, 
            feeAmount: fee, 
            transferredAmount: transferred, 
            status: status,
            requestedAt: requestedDate.toISOString().substring(0, 16).replace('T', ' '),
            processedAt: processedDate?.toISOString().substring(0, 16).replace('T', ' '),
            associatedMonthlyEarnings: associatedEarnings, 
            destinationAccount: destination, // Add destination account info
        });
    }
    totalWithdrawnAmount.value = accumulatedGross; 
    return history.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
};

// --- Headers for Tables ---
const monthlyHeaders: ReadonlyHeaders = [
    { title: '年月', key: 'month', width: '30%' },
    { title: '合計収益', key: 'totalRevenue', align: 'end', width: '40%' },
    { title: 'ステータス', key: 'status', align: 'center', width: '30%' },
];

// Updated withdrawalHeaders
const withdrawalHeaders: ReadonlyHeaders = [
    { title: '', key: 'data-table-expand', sortable: false, width: '5%' }, 
    { title: '申請日時', key: 'requestedAt', width: '20%' },
    { title: '申請額', key: 'amount', align: 'end', width: '18%' }, // Renamed from 金額
    { title: '手数料', key: 'feeAmount', align: 'end', width: '15%' }, // Added Fee column
    { title: '振込額', key: 'transferredAmount', align: 'end', width: '18%' }, // Added Transferred Amount column
    { title: '振込完了日時', key: 'processedAt', width: '20%' },
    { title: 'ステータス', key: 'status', align: 'center', width: '10%' }, 
];

// --- Validation Rules --- 
const rules = {
    required: (value: any) => value !== null && value !== '' || '必須項目です。',
    minValue: (min: number) => (value: number) => value >= min || `${min.toLocaleString()}円以上で入力してください。`,
    maxValue: (max: number) => (value: number) => value <= max || `出金可能額（¥${max.toLocaleString()}）を超えています。`,
    numeric: (value: string) => /^[0-9]+$/.test(value) || '半角数字で入力してください。',
    katakana: (value: string) => /^[ァ-ヶー　]+$/.test(value) || '全角カタカナで入力してください。',
};

// --- Methods --- 
// Updated openWithdrawDialog to reset confirmation
const openWithdrawDialog = (withdrawAll: boolean = false) => {
    if (withdrawAll) {
        selectedMonthsToWithdraw.value = monthlyEarnings.value
            .filter(e => e.status === 'finalized' && e.isWithdrawable)
            .map(e => e.month);
    } 
    if (canWithdrawSelected.value) {
       isBankAccountConfirmed.value = false; // Reset checkbox on open
       isWithdrawDialogOpen.value = true;
    } else if (selectedMonthsToWithdraw.value.length > 0) {
        snackbar.text = '選択された月の合計出金額が最低出金額（¥10,000）に達していません。';
        snackbar.color = 'warning';
        snackbar.show = true;
    } else if (!withdrawAll) {
        snackbar.text = '出金する月を選択してください。';
        snackbar.color = 'warning';
        snackbar.show = true;
    }
};

// Updated closeWithdrawDialog to also reset confirmation
const closeWithdrawDialog = () => {
    isWithdrawDialogOpen.value = false;
    isBankAccountConfirmed.value = false; // Reset checkbox on close/cancel
    // Optionally reset selection if dialog is cancelled
    // selectedMonthsToWithdraw.value = []; 
};

// Updated submitWithdrawRequest to save destinationAccount
const submitWithdrawRequest = async () => {
    if (!canWithdrawSelected.value) { 
        snackbar.text = '出金可能な条件を満たしていません。';
        snackbar.color = 'error';
        snackbar.show = true;
        return;
    }
    if (finalTransferAmount.value <= 0) {
        snackbar.text = '手数料を差し引いた後の振込額が0円以下になります。';
        snackbar.color = 'warning';
        snackbar.show = true;
        return;
    }

    isWithdrawing.value = true;
    const amountToRequest = selectedWithdrawalAmount.value; 
    const feeToCharge = calculatedFee.value;
    const amountToTransfer = finalTransferAmount.value; 
    const monthsBeingWithdrawn = [...selectedMonthsToWithdraw.value]; 
    
    const associatedEarningsDetails = monthlyEarnings.value
        .filter(e => monthsBeingWithdrawn.includes(e.month))
        .map(e => ({ month: e.month, totalRevenue: e.totalRevenue }));
    
    // --- Capture destination account details at time of request --- 
    const currentDestinationAccount: DestinationAccountInfo = {
        bankName: bankAccount.bankName,
        branchName: bankAccount.branchName,
        accountType: bankAccount.accountType,
        maskedAccountNumber: maskedAccountNumber.value, // Use computed masked value
        accountHolderName: bankAccount.accountHolderName,
    };
    // -------------------------------------------------------------

    console.log('Submitting withdrawal request to:', currentDestinationAccount, 'Amount:', amountToRequest);
    try {
        // Update monthly earnings status
        monthlyEarnings.value = monthlyEarnings.value.map(e => {
            if (monthsBeingWithdrawn.includes(e.month) && e.status === 'finalized' && e.isWithdrawable) {
                   return { ...e, status: 'processing', isWithdrawable: false };
            }
            return e;
        });
        const originalSelection = [...selectedMonthsToWithdraw.value]; 
        selectedMonthsToWithdraw.value = []; 
        closeWithdrawDialog(); 

        await new Promise(resolve => setTimeout(resolve, 2500)); 

        snackbar.text = '出金申請を受け付けました。処理完了までお待ちください。';
        snackbar.color = 'success';
        snackbar.show = true;

        await new Promise(resolve => setTimeout(resolve, 3000)); 

        totalWithdrawnAmount.value += amountToRequest; 
        monthlyEarnings.value = monthlyEarnings.value.map(e => {
            if (originalSelection.includes(e.month) && e.status === 'processing') {
                return { ...e, status: 'paid_out' }; 
            }
            return e;
        });
        
        // Add to withdrawal history with destination account
        withdrawalHistory.value.unshift({ 
            id: Date.now(), 
            amount: amountToRequest, 
            feeAmount: feeToCharge, 
            transferredAmount: amountToTransfer, 
            status: 'completed', 
            requestedAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
            processedAt: new Date().toISOString().substring(0, 16).replace('T', ' '), 
            associatedMonthlyEarnings: associatedEarningsDetails,
            destinationAccount: currentDestinationAccount, // Save captured destination
        });
         console.log('Withdrawal marked as completed for months:', originalSelection);

    } catch (error) {
        console.error('Failed to submit withdrawal request:', error);
        snackbar.text = '出金申請中にエラーが発生しました。';
        snackbar.color = 'error';
        snackbar.show = true;
    } finally {
        isWithdrawing.value = false;
    }
};

const saveBankAccount = async () => {
     if (!bankAccountForm.value) return;
    const { valid } = await bankAccountForm.value.validate();

    if (valid) {
        isSavingBankAccount.value = true;
        console.log('Saving bank account info:', bankAccount);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            snackbar.text = '出金口座情報を保存しました。';
            snackbar.color = 'success';
            snackbar.show = true;
            isBankAccountRegistered.value = true; 
        } catch (error) {
            console.error('Failed to save bank account info:', error);
            snackbar.text = '口座情報の保存中にエラーが発生しました。';
            snackbar.color = 'error';
            snackbar.show = true;
        } finally {
            isSavingBankAccount.value = false;
        }
    } else {
        console.log('Bank account form validation failed');
    }
};

// --- Status Formatting Helpers ---
const getMonthlyStatusColor = (status: MonthlyEarning['status']): string => {
  switch (status) {
    case 'pending': return 'grey';
    case 'finalized': return 'success';
    case 'processing': return 'blue';
    case 'paid_out': return 'blue-grey';
    default: return 'default';
  }
};
const getMonthlyStatusText = (status: MonthlyEarning['status']): string => {
  switch (status) {
    case 'paid_out': return '支払済';
    case 'processing': return '処理中';
    case 'pending': case 'finalized': default: return '未精算';
  }
};
const getWithdrawalStatusColor = (status: WithdrawalStatus): string => {
  switch (status) {
    case 'pending': return 'orange';
    case 'processing': return 'blue';
    case 'completed': return 'green';
    case 'failed': return 'red';
    default: return 'default';
  }
};
const getWithdrawalStatusText = (status: WithdrawalStatus): string => {
   switch (status) {
     case 'pending': return '処理中';
     case 'processing': return '処理中';
     case 'completed': return '完了';
     case 'failed': return '失敗';
     default: return status;
   }
};

// Format currency helper
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '¥0';
  // Ensure we handle potential floating point issues if fees were not integers
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
};

// --- Lifecycle Hooks ---
// Updated onMounted to call updated withdrawal generator
onMounted(async () => {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 500)); 

  monthlyEarnings.value = generateSampleMonthlyEarnings(12); 
  withdrawalHistory.value = generateSampleWithdrawals(10); 

  await new Promise(resolve => setTimeout(resolve, 200)); 
  const fetchedBankAccount = {
    bankName: 'サンプル銀行', branchName: '本店営業部', accountType: '普通',
    accountNumber: '1234567', accountHolderName: 'ﾃﾞｨﾌｨｰ ﾀﾛｳ'
  };
  isBankAccountRegistered.value = true; 
  Object.assign(bankAccount, fetchedBankAccount);

  isLoading.value = false;
});

</script>

<style scoped>
/* Add specific styles if needed */
</style> 
