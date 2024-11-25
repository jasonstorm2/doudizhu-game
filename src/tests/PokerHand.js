class PokerHand {
    constructor(cards) {
        this.cards = cards;
        this.cardCount = this.countCards();
        this.valueMap = {
            'Big': 20, 'Small': 19,
            'A': 14, 'K': 13, 'Q': 12, 'J': 11
        };
    }

    countCards() {
        return this.cards.reduce((acc, card) => {
            acc[card] = (acc[card] || 0) + 1;
            return acc;
        }, {});
    }

    getCardValue(card) {
        return this.valueMap[card] || parseInt(card);
    }

    findStraights() {
        // 获取所有单张牌
        let values = Object.keys(this.cardCount)
            .filter(card => !['Big', 'Small'].includes(card))
            .map(card => this.getCardValue(card))
            .sort((a, b) => a - b);

        let straights = [];
        let current = [];
        let used = new Set();

        // 找出所有可能的顺子
        const findAllStraights = (start, remainingCards) => {
            if (current.length >= 5) {
                straights.push([...current]);
            }
            
            for (let i = start; i < remainingCards.length; i++) {
                let value = remainingCards[i];
                if (used.has(value)) continue;
                
                if (current.length === 0 || value === current[current.length - 1] + 1) {
                    used.add(value);
                    current.push(value);
                    findAllStraights(i + 1, remainingCards);
                    current.pop();
                    used.delete(value);
                }
            }
        };

        findAllStraights(0, values);
        return straights;
    }

    findTrips() {
        return Object.entries(this.cardCount)
            .filter(([_, count]) => count === 3)
            .map(([card, _]) => ({
                type: 'trip',
                cards: [card, card, card],
                value: this.getCardValue(card)
            }));
    }

    findPossibleCombinations() {
        let combinations = [];
        let trips = this.findTrips();
        let straights = this.findStraights();
        let kings = Object.keys(this.cardCount).filter(card => ['Big', 'Small'].includes(card));

        // 评估三带组合
        trips.forEach(trip => {
            combinations.push({
                type: 'trips_combination',
                pattern: [trip],
                score: this.evaluateTrips(trip),
                description: `三张${trip.cards[0]}`
            });
        });

        // 评估顺子组合
        straights.forEach(straight => {
            combinations.push({
                type: 'straight_combination',
                pattern: straight,
                score: this.evaluateStraight(straight),
                description: `顺子${straight.join(',')}`
            });
        });

        return this.findBestCombination(combinations);
    }

    evaluateTrips(trip) {
        // 基础分值
        let score = 60;
        // 根据牌值加分
        score += this.getCardValue(trip.cards[0]) * 2;
        return score;
    }

    evaluateStraight(straight) {
        // 基础分值
        let score = 80;
        // 顺子长度加分
        score += straight.length * 10;
        // 最大牌值加分
        score += Math.max(...straight) * 2;
        return score;
    }

    findBestCombination(combinations) {
        let bestScore = 0;
        let bestCombination = null;

        combinations.forEach(combo => {
            if (combo.score > bestScore) {
                bestScore = combo.score;
                bestCombination = combo;
            }
        });

        return bestCombination;
    }

    suggestPlaySequence() {
        let remainingCards = [...this.cards];
        let playSequence = [];
        let kings = remainingCards.filter(card => ['Big', 'Small'].includes(card));
        
        // 找出最佳组合
        let bestCombo = this.findPossibleCombinations();
        
        if (bestCombo) {
            if (bestCombo.type === 'straight_combination') {
                // 处理顺子
                playSequence.push({
                    type: 'straight',
                    cards: bestCombo.pattern.map(String),
                    description: `顺子: ${bestCombo.pattern.join(',')}`
                });
                
                // 移除已使用的牌
                bestCombo.pattern.forEach(value => {
                    let card = String(value);
                    let index = remainingCards.indexOf(card);
                    if (index !== -1) {
                        remainingCards.splice(index, 1);
                    }
                });
            } else if (bestCombo.type === 'trips_combination') {
                // 处理三张
                playSequence.push({
                    type: 'trips',
                    cards: bestCombo.pattern[0].cards,
                    description: `三张: ${bestCombo.pattern[0].cards[0]}`
                });
                
                // 移除已使用的牌
                bestCombo.pattern[0].cards.forEach(card => {
                    let index = remainingCards.indexOf(card);
                    if (index !== -1) {
                        remainingCards.splice(index, 1);
                    }
                });
            }
        }

        // 处理剩余的牌
        if (remainingCards.length > 0) {
            playSequence.push({
                type: 'remaining',
                cards: remainingCards,
                description: `剩余牌: ${remainingCards.join(',')}`
            });
        }

        return playSequence;
    }
}

// 测试代码
export function testPokerHand() {
    const cards = ['Big', '10', '10', '10', '9', '8', '7', '6', '5', '4', '4', '4'];
    const hand = new PokerHand(cards);
    
    console.log('当前手牌:', cards);
    console.log('\n分析结果:');
    
    const playSequence = hand.suggestPlaySequence();
    playSequence.forEach((play, index) => {
        console.log(`第${index + 1}手: ${play.description}`);
    });
}

// // 运行测试
testPokerHand();