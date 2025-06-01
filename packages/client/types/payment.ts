export interface PlanFeature {
  includes: boolean;
  text: string;
}

export interface PlanFeatures {
  additionalFeatures: string[];
}

export interface Plan {
  id: string;
  name: string;
  amount: number;
  interval: 'month' | 'year';
  features: PlanFeatures;
  status: string;
  payjpPlanId: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodData {
  token: string;
  method: 'card' | 'apple_pay';
  cardInfo?: {
    brand?: string;
    last4?: string;
  };
}

// PaymentCardコンポーネントのref型定義
export interface PaymentCardComponent {
  handleCardSubmit: () => Promise<void>;
} 
