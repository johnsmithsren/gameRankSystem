export const RANK_BROADCAST_QUEUE = "rank-broadcast-queue";
export enum Action_Type {
  updateRankByScore = "updateRankByScore",
  broadcastRank = "broadcastRank", // 广播
  firstRank = "firstRank", // 上榜通知
  overRank = "overRank", // 超越提示
}
