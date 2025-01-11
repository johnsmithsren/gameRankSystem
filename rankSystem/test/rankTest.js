// Test script for rank system API
const API_BASE_URL = "http://localhost:3000"; // Adjust this according to your server configuration

// Function to update a user's score
async function updateScore(userId, score) {
    try {
        const response = await fetch(`${API_BASE_URL}/rank/score`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                score,
            }),
        });
    } catch (error) {
        console.error("Error updating score:", error);
    }
}

// Function to get rankings
async function getRankings(page = 1, limit = 10) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/rank/rankings?page=${page}&limit=${limit}`
        );
        const data = await response.json();
        console.log("Rankings:", data);
        return data;
    } catch (error) {
        console.error("Error getting rankings:", error);
    }
}

// Function to get personal rank
async function getPersonalRank(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/rank/personal/${userId}`);
        const data = await response.json();
        console.log("Personal Rank:", data);
        return data;
    } catch (error) {
        console.error("Error getting personal rank:", error);
    }
}

// Function to get neighbor ranks
async function getNeighborRanks(userId, neighborCount = 5) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/rank/neighbors/${userId}?neighborCount=${neighborCount}`
        );
        const data = await response.json();
        console.log("Neighbor Ranks:", data);
        return data;
    } catch (error) {
        console.error("Error getting neighbor ranks:", error);
    }
}

async function main() {
    // 插入100个玩家的数据
    for (let i = 1; i <= 5; i++) {
        const userId = `user${i}`;
        const score = Math.floor(Math.random() * 1000); // 随机分数 0-999
        await updateScore(userId, score);
    }

    // 等待一会儿让数据更新
    // await new Promise(resolve => setTimeout(resolve, 1000));

    // // 获取排行榜
    // console.log("\nTop 10 Rankings:");
    // await getRankings(1, 10);

    // // 获取某个用户的个人排名（例如第50个用户）
    // console.log("\nPersonal Rank for user50:");
    // await getPersonalRank('user50');

    // // 获取某个用户的邻居排名
    // console.log("\nNeighbor Ranks for user50:");
    // await getNeighborRanks('user50', 3);
}

// 运行测试
main().catch(console.error);