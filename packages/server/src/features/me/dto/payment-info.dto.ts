// 支払い情報関連DTOをtypesファイルへ移動し、こちらは後方互換性のために再エクスポートする
import { PaymentHistoryEntry, PaymentInfo } from "../types";

export type PaymentHistoryItemDto = PaymentHistoryEntry;
export type PaymentInfoResponseDto = PaymentInfo;
