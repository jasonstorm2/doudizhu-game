export class GameManager {
    constructor() {
        this.playedCards = [];
        this.playerMoves = []; // 新增：记录每个玩家的出牌
        // 未来可以在这里添加更多游戏状态
        // this.gameState = 'WAITING';
        // this.playerCount = 0;
        // 等等...
    }

    addPlayedCards(cards, playerIndex) {
        this.playedCards = this.playedCards.concat(cards);
        // 确保 playerIndex 是有效的
        const safePlayerIndex = playerIndex !== undefined ? playerIndex : 'Unknown';
        this.playerMoves.push({ playerIndex: safePlayerIndex, cards });
        // 打印到控制台
        console.log(`Player ${safePlayerIndex} played:`, cards.map(card => card.value).join(', '));
    }

    getPlayedCards() {
        return this.playedCards;
    }

    resetPlayedCards() {
        this.playedCards = [];
        this.playerMoves = []; // 重置玩家出牌记录
    }

    // 新增：获取玩家出牌记录
    getPlayerMoves() {
        return this.playerMoves;
    }

    // 未来可以添加更多方法来管理游戏状态
}

// 创建一个单例实例
export const gameManager = new GameManager();
