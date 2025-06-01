/**
 * 評価に関するユーティリティ関数
 */

/**
 * 正の評価率を計算する
 * @param likeCount いいねの数
 * @param dislikeCount 悪い評価の数
 * @returns 0-100の評価率（小数点切り上げ）
 */
export const calculatePositiveRatingRate = (likeCount: number, dislikeCount: number): number => {
  const totalRatings = likeCount + dislikeCount;
  if (totalRatings === 0) return 0;
  return Math.ceil((likeCount / totalRatings) * 100);
}; 
