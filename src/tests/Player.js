class Player {
    constructor(cards, name = '') {
        this.cards = cards;
        this.name = name;
    }

    // 选择要打出的牌
    selectCard(topCard = null) {
        // 如果没有顶牌，选择最优先出的牌
        if (!topCard) {
            return this.getFirstCard();
        }
        // 有顶牌时，找出能压制的最小牌
        return this.getSmallestValidCard(topCard);
    }

    // 获取第一次出牌的最佳选择
    getFirstCard() {
        // 找出除最大牌外的最大牌
        let maxCard = Math.max(...this.cards);
        let secondMaxCard = -1;
        
        for (let card of this.cards) {
            if (card < maxCard && card > secondMaxCard) {
                secondMaxCard = card;
            }
        }
        
        return secondMaxCard > 0 ? secondMaxCard : this.cards[0];
    }

    // 获取能压制顶牌的最小牌
    getSmallestValidCard(topCard) {
        let validCard = -1;
        for (let card of this.cards) {
            if (card > topCard && (validCard === -1 || card < validCard)) {
                validCard = card;
            }
        }
        return validCard;
    }

    // 打出一张牌
    playCard(card) {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
        return card;
    }
}

export function playGame(player1Cards, player2Cards, player3Cards) {
    const player1 = new Player(player1Cards, 'Player 1');
    const player2 = new Player(player2Cards, 'Player 2');
    const player3 = new Player(player3Cards, 'Player 3');
    
    let players = [player1, player2, player3];
    let currentPlayerIndex = 0;
    let topCard = null;
    let lastValidPlayerIndex = -1;
    let round = 1;
    
    console.log("Game starts!");
    
    while (players.some(p => p.cards.length > 0)) {
        let currentPlayer = players[currentPlayerIndex];
        
        // 如果是新的回合开始
        if (lastValidPlayerIndex === -1 || currentPlayerIndex === lastValidPlayerIndex) {
            topCard = null;
        }
        
        let selectedCard = currentPlayer.selectCard(topCard);
        
        if (selectedCard === -1) {
            console.log(`${currentPlayer.name} passes`);
        } else {
            if (topCard === null || selectedCard > topCard) {
                currentPlayer.playCard(selectedCard);
                topCard = selectedCard;
                lastValidPlayerIndex = currentPlayerIndex;
                console.log(`${currentPlayer.name} plays ${selectedCard}`);
            }
        }
        
        // 移动到下一个玩家
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        
        // 如果回到第一个玩家，增加回合数
        if (currentPlayerIndex === 0) {
            console.log(`\nRound ${++round}`);
        }
    }
    
    // 打印游戏结果
    console.log("\nGame Over!");
    players.forEach(player => {
        console.log(`${player.name} remaining cards: ${player.cards}`);
    });
}

// 测试游戏
const player1Cards = [14, 10, 3];  // 你的牌
const player2Cards = [11, 5];      // 对手1的牌
const player3Cards = [13, 8, 6];   // 对手2的牌

playGame(player1Cards, player2Cards, player3Cards);