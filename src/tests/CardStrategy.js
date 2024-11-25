class CardStrategy {
    static analyzeHand(myCards, otherPlayers) {
        // 对手的牌信息
        const allOpponentCards = otherPlayers.flat();
        
        // 基础牌型分析
        const handAnalysis = {
            maxCard: Math.max(...myCards),
            minCard: Math.min(...myCards),
            cards: [...myCards].sort((a, b) => a - b),
            controlCards: this.findControlCards(myCards, allOpponentCards)
        };

        return this.calculateBestStrategy(handAnalysis, otherPlayers);
    }

    // 找出控制牌（能压制大部分对手牌的牌）
    static findControlCards(myCards, opponentCards) {
        return myCards.filter(card => {
            const cardsCanControl = opponentCards.filter(oCard => oCard < card).length;
            return cardsCanControl >= opponentCards.length / 2;
        });
    }

    // 计算最佳策略
    static calculateBestStrategy(handAnalysis, otherPlayers) {
        const strategy = {
            firstMove: null,    // 第一张要出的牌
            controlCards: [],   // 控制牌序列
            lastCards: []       // 最后出的牌序列
        };

        // 计算出牌序列
        const cards = [...handAnalysis.cards];
        const numPlayers = otherPlayers.length + 1;

        // 1. 找出最佳首牌
        strategy.firstMove = this.findBestFirstCard(cards, otherPlayers);

        // 2. 识别控制牌
        strategy.controlCards = handAnalysis.controlCards;

        // 3. 安排出牌顺序
        strategy.playSequence = this.calculatePlaySequence(cards, otherPlayers);

        return strategy;
    }

    // 找出最佳首牌
    static findBestFirstCard(cards, otherPlayers) {
        const allOpponentCards = otherPlayers.flat();
        const maxOpponentCard = Math.max(...allOpponentCards);
        
        // 找出比最大对手牌小的最大牌
        let bestFirstCard = -1;
        for (let card of cards) {
            if (card < maxOpponentCard && card > bestFirstCard) {
                bestFirstCard = card;
            }
        }

        // 如果没有合适的牌，则选择中等大小的牌
        if (bestFirstCard === -1) {
            const sortedCards = [...cards].sort((a, b) => a - b);
            bestFirstCard = sortedCards[Math.floor(sortedCards.length / 2)];
        }

        return bestFirstCard;
    }

    // 计算完整的出牌序列
    static calculatePlaySequence(cards, otherPlayers) {
        const sequence = [];
        const remainingCards = [...cards];
        
        // 分析对手牌力分布
        const opponentCardRanges = otherPlayers.map(playerCards => ({
            min: Math.min(...playerCards),
            max: Math.max(...playerCards),
            count: playerCards.length
        }));

        // 1. 首张牌的选择
        const firstCard = this.findBestFirstCard(remainingCards, otherPlayers);
        sequence.push({
            card: firstCard,
            reason: "首牌策略：选择合适的中等大小牌，引导对手出牌"
        });
        remainingCards.splice(remainingCards.indexOf(firstCard), 1);

        // 2. 控制牌的安排
        const controlCards = this.findControlCards(remainingCards, otherPlayers.flat());
        for (let controlCard of controlCards) {
            sequence.push({
                card: controlCard,
                reason: "控制牌：用于压制对手的大牌"
            });
            remainingCards.splice(remainingCards.indexOf(controlCard), 1);
        }

        // 3. 剩余牌的安排
        for (let card of remainingCards) {
            sequence.push({
                card: card,
                reason: "常规牌：根据场上形势灵活使用"
            });
        }

        return sequence;
    }

    // 实时策略建议
    static getPlayAdvice(hand, topCard, otherPlayers) {
        if (!topCard) {
            return this.getFirstPlayAdvice(hand, otherPlayers);
        }
        return this.getResponsePlayAdvice(hand, topCard, otherPlayers);
    }

    // 首次出牌建议
    static getFirstPlayAdvice(hand, otherPlayers) {
        const strategy = this.analyzeHand(hand, otherPlayers);
        return {
            card: strategy.firstMove,
            reason: "首张牌策略执行"
        };
    }

    // 响应出牌建议
    static getResponsePlayAdvice(hand, topCard, otherPlayers) {
        const validCards = hand.filter(card => card > topCard);
        if (validCards.length === 0) return { card: -1, reason: "无法出牌" };

        // 找出最小的可用控制牌
        const minValidCard = Math.min(...validCards);
        return {
            card: minValidCard,
            reason: "使用最小的有效牌响应"
        };
    }
}

// 使用示例
export function demonstrateStrategy() {
    const myCards = [14, 10, 3];
    const player2Cards = [11, 5];
    const player3Cards = [13, 8, 6];
    
    const strategy = CardStrategy.analyzeHand(myCards, [player2Cards, player3Cards]);
    console.log("策略分析结果：", strategy);

    // 模拟游戏进程中的决策
    console.log("\n模拟游戏进程：");
    
    // 第一手牌
    const firstPlay = CardStrategy.getPlayAdvice(myCards, null, [player2Cards, player3Cards]);
    console.log("首次出牌建议：", firstPlay);

    // 模拟对手出11后的决策
    const responsePlay = CardStrategy.getPlayAdvice([14, 3], 11, [player2Cards, player3Cards]);
    console.log("对手出11后的建议：", responsePlay);
}

// 运行示例
demonstrateStrategy();