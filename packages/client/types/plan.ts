/**
 * プラン関連の型定義
 */

/**
 * プランのステータス
 */
export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * 課金間隔
 */
export enum PlanInterval {
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * プラン機能の表現形式
 */
export interface PlanFeatures {
  additionalFeatures: string[]; // +/-プレフィックス付き機能リスト
}

/**
 * プラン基本情報（データベース保存情報）
 */
export interface PlanBase {
  id: number;
  name: string;
  payjpPlanId: string;
  features: PlanFeatures | string[];
  status: PlanStatus;
  isFree: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * PAY.JPから取得したプラン情報を含む拡張プラン情報
 */
export interface Plan extends PlanBase {
  amount: number;        // 価格（円）
  interval: PlanInterval; // 課金間隔
}

/**
 * プラン作成用DTO
 */
export interface CreatePlanDto {
  name: string;
  amount: number;
  billingPeriod: PlanInterval;
  features: string[];
  status: PlanStatus;
  isFree?: boolean;
}

/**
 * プラン更新用DTO
 */
export interface UpdatePlanDto {
  name?: string;
  amount?: number;
  billingPeriod?: PlanInterval;
  features?: string[];
  status?: PlanStatus;
  isFree?: boolean;
}

/**
 * フロントエンドでの機能入力用
 */
export interface PlanFeatureInput {
  id: number;
  text: string;
  type: 'included' | 'excluded';
} 
