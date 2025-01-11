export const RANK_PROCESS_QUEUE = "rank-process-queue"
export const RANK_BROADCAST_QUEUE = "rank-broadcast-queue"
export enum Action_Type {
    updateRankByScore = "updateRankByScore",
    broadcastRank = "broadcastRank",
    firstRank = "firstRank", // 上榜通知
    overRank = "overRank", // 超越提示
}
