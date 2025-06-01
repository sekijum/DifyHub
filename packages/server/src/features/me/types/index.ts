// 支払い情報の型定義
export interface PaymentInfo {
  subscription: {
    id: string;
    planName: string;
    planDisplayName: string;
    amount: number;
    nextBillingDate: string | null;
  } | null;
  paymentHistory: PaymentHistoryEntry[];
}

// 支払い履歴エントリーの型定義
export interface PaymentHistoryEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
} 
