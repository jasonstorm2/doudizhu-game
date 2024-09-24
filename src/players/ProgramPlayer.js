import { Player } from './Player';
import { isGreaterThanLastPlay, getCardPatternType, validateCardPattern } from '../api/gameApi';

export class ProgramPlayer extends Player {
    constructor(id) {
        super(id, 'PROGRAM');
        this.opponentCards = new Set(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big']);
    }

    playCards(lastPlayedCards, gameState) {
        console.log('ProgramPlayer playCards called', { lastPlayedCards, gameState });
        let cardsToPlay;
        if (!lastPlayedCards || lastPlayedCards.length === 0) {
            cardsToPlay = this.playAsFirstPlayer();
        } else {
            cardsToPlay = this.respondToLastPlay(lastPlayedCards, gameState);
        }

        console.log('ProgramPlayer decided to play:', cardsToPlay);

        // 如果没有可以出的牌，则过牌
        if (!cardsToPlay || cardsToPlay.length === 0) {
            console.log('ProgramPlayer decides to pass');
            return null;
        }

        // 确保 cardsToPlay 是一个数组
        if (!Array.isArray(cardsToPlay)) {
            cardsToPlay = [cardsToPlay];
        }

        // 更新选中的卡片
        this.updateSelectedCards(cardsToPlay);

        return cardsToPlay;
    }

    playAsFirstPlayer() {
        const combinations = this.identifyCombinations();
        
        // 优先出单张
        if (combinations.singles.length > 0) {
            // 如果有2或者大小王，先出其他的单张
            const nonPowerfulSingles = combinations.singles.filter(card => !['2', 'Small', 'Big'].includes(card.value));
            if (nonPowerfulSingles.length > 0) {
                return [nonPowerfulSingles[0]];
            }
            return [combinations.singles[0]];
        }
        
        // 其次出对子
        if (combinations.pairs.length > 0) {
            return combinations.pairs[0];
        }
        
        // 再次出三张
        if (combinations.triples.length > 0) {
            return combinations.triples[0];
        }
        
        // 最后考虑出顺子
        if (combinations.straights.length > 0) {
            return combinations.straights[0];
        }
        
        // 如果都没有，出炸弹
        if (combinations.bombs.length > 0) {
            return combinations.bombs[0];
        }
        
        // 默认出最小的牌
        return [this.findSmallestCard()];
    }

    respondToLastPlay(lastPlayedCards, gameState) {
        this.updateOpponentCards(lastPlayedCards);
        const lastPlayType = getCardPatternType(lastPlayedCards);
        console.log('Last play type:', lastPlayType);
        const possiblePlays = this.findPossiblePlays(lastPlayType, lastPlayedCards);
        console.log('Possible plays:', possiblePlays);

        if (possiblePlays.length === 0) {
            console.log('No valid plays found, passing');
            return null; // Pass if no valid play is found
        }

        // 强制出牌逻辑
        if (this.mustPlay(lastPlayedCards)) {
            return this.selectForcedPlay(possiblePlays, lastPlayType);
        }

        // 原有的策略逻辑
        if (this.shouldPlayBomb(possiblePlays)) {
            return this.findBomb(possiblePlays);
        }

        if (this.cards.length <= 5) {
            return this.playAggressively(possiblePlays);
        }

        if (this.shouldControl(possiblePlays, gameState)) {
            return this.playControlStrategy(possiblePlays);
        }

        if (this.shouldBait(possiblePlays, gameState)) {
            return this.playBaitStrategy(possiblePlays);
        }

        return this.playConservatively(possiblePlays);
    }

    mustPlay(lastPlayedCards) {
        // 如果是第一个出牌的玩家，必须出牌
        if (!lastPlayedCards || lastPlayedCards.length === 0) {
            return true;
        }
        // 如果有大于上家的牌，必须出牌
        return this.findPossiblePlays(getCardPatternType(lastPlayedCards), lastPlayedCards).length > 0;
    }

    selectForcedPlay(possiblePlays, lastPlayType) {
        // 在强制出牌的情况下，选择最小的符合条件的牌组
        const validPlays = possiblePlays.filter(play => {
            // 确保 play 是一个数组
            const playArray = Array.isArray(play) ? play : [play];
            return getCardPatternType(playArray) === lastPlayType;
        });

        if (validPlays.length > 0) {
            return this.playConservatively(validPlays);
        }
        // 如果没有完全匹配的牌型，就选择炸弹或者最小的可能出牌
        return this.findBomb(possiblePlays) || this.playConservatively(possiblePlays);
    }

    identifyCombinations() {
        const combinations = {
            singles: [],
            pairs: [],
            triples: [],
            straights: [],
            bombs: []
        };

        for (let i = 0; i < this.cards.length; i++) {
            if (i + 3 < this.cards.length &&
                this.cards[i].value === this.cards[i + 1].value &&
                this.cards[i].value === this.cards[i + 2].value &&
                this.cards[i].value === this.cards[i + 3].value) {
                combinations.bombs.push(this.cards.slice(i, i + 4));
                i += 3;
            } else if (i + 2 < this.cards.length &&
                this.cards[i].value === this.cards[i + 1].value &&
                this.cards[i].value === this.cards[i + 2].value) {
                combinations.triples.push(this.cards.slice(i, i + 3));
                i += 2;
            } else if (i + 1 < this.cards.length &&
                this.cards[i].value === this.cards[i + 1].value) {
                combinations.pairs.push(this.cards.slice(i, i + 2));
                i += 1;
            } else {
                combinations.singles.push(this.cards[i]);
            }
        }

        // Identify straights
        for (let length = 5; length <= this.cards.length; length++) {

            for (let i = 0; i <= this.cards.length - length; i++) {
                const potentialStraight = this.cards.slice(i, i + length);
                if (this.isStraight(potentialStraight)) {
                    combinations.straights.push(potentialStraight);
                }
            }
        }
        return combinations;
    }

    isStraight(cards) {
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let i = 1; i < cards.length; i++) {
            if (values.indexOf(cards[i].value) !== values.indexOf(cards[i - 1].value) + 1) {
                return false;
            }
        }
        return true;
    }

    shouldPlayBomb(possiblePlays) {
        const handStrength = this.evaluateHandStrength();
        const opponentCardsCount = this.opponentCards.size;
        
        // 如果手牌很强或者对手牌很少，才出炸弹
        return (handStrength > 20 || opponentCardsCount < 5) && possiblePlays.some(play => getCardPatternType(play) === 'bomb');
    }
    findBomb(possiblePlays) {
        return possiblePlays.find(play => getCardPatternType(play) === 'bomb');
    }

    playAggressively(possiblePlays) {
        // Play the largest valid combination
        return possiblePlays[possiblePlays.length - 1];
    }
    playConservatively(possiblePlays) {
        // Play the smallest valid combination
        return possiblePlays[0];
    }

    findPossiblePlays(lastPlayType, lastPlayedCards) {
        const possiblePlays = [];
        const combinations = this.identifyCombinations();

        // 根据上一次出牌的类型来筛选可能的出牌
        switch(lastPlayType) {
            case 'single':
                possiblePlays.push(...combinations.singles.map(card => [card]).filter(play => isGreaterThanLastPlay(play, lastPlayedCards)));
                break;
            case 'pair':
                possiblePlays.push(...combinations.pairs.filter(pair => isGreaterThanLastPlay(pair, lastPlayedCards)));
                break;
            case 'triple':
                possiblePlays.push(...combinations.triples.filter(triple => isGreaterThanLastPlay(triple, lastPlayedCards)));
                break;
            case 'straight':
                possiblePlays.push(...combinations.straights.filter(straight => 
                    straight.length === lastPlayedCards.length && isGreaterThanLastPlay(straight, lastPlayedCards)
                ));
                break;
            // 可以根据需要添加其他牌型的处理
        }

        // 总是考虑炸弹
        possiblePlays.push(...combinations.bombs);

        // 如果没有找到合适的组合，尝试拆牌
        if (possiblePlays.length === 0) {
            possiblePlays.push(...this.findSplitPlays(lastPlayType, lastPlayedCards));
        }

        // 移除重复的出牌选择
        return Array.from(new Set(possiblePlays.map(JSON.stringify))).map(JSON.parse);
    }

    findSplitPlays(lastPlayType, lastPlayedCards) {
        const possiblePlays = [];
        const cardCount = lastPlayedCards.length;

        // 尝试拆分手牌来满足出牌要求
        for (let i = 0; i <= this.cards.length - cardCount; i++) {
            const candidatePlay = this.cards.slice(i, i + cardCount);
            if (validateCardPattern(candidatePlay) && getCardPatternType(candidatePlay) === lastPlayType && isGreaterThanLastPlay(candidatePlay, lastPlayedCards)) {
                possiblePlays.push(candidatePlay);
            }
        }

        return possiblePlays;
    }

    // 新增方法：更新选中的卡片
    updateSelectedCards(cardsToPlay) {
        // 清除之前的选择
        this.cards.forEach(card => card.selected = false);
        this.selectedCards = []; // 清空之前选中的卡片

        // 确保 cardsToPlay 是一个数组
        if (!Array.isArray(cardsToPlay)) {
            cardsToPlay = [cardsToPlay];
        }

        // 更新新选中的卡片
        cardsToPlay.forEach(cardToPlay => {
            const cardInHand = this.cards.find(card => 
                card.suit === cardToPlay.suit && card.value === cardToPlay.value
            );
            if (cardInHand) {
                cardInHand.selected = true;
                this.selectedCards.push(cardInHand); // 将选中的卡片添加到 selectedCards 数组
            }
        });

        console.log('Updated selected cards:', this.selectedCards);
    }

    findSmallestCard() {
        return this.cards.reduce((smallest, current) => {
            if (!smallest || this.compareCards(current, smallest) < 0) {
                return current;
            }
            return smallest;
        }, null);
    }

    compareCards(card1, card2) {
        const order = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big'];
        return order.indexOf(card1.value) - order.indexOf(card2.value);
    }

    evaluateHandStrength() {
        const combinations = this.identifyCombinations();
        let score = 0;
        
        score += combinations.singles.length * 1;
        score += combinations.pairs.length * 3;
        score += combinations.triples.length * 6;
        score += combinations.straights.length * 10;
        score += combinations.bombs.length * 15;
        
        // 考虑剩余牌数
        score -= this.cards.length * 0.5;
        
        return score;
    }

    updateOpponentCards(playedCards) {
        playedCards.forEach(card => this.opponentCards.delete(card.value));
    }

    shouldControl(possiblePlays) {
        // 如果我们有多个选择，并且对手牌数较少，考虑控制
        return possiblePlays.length > 2 && this.opponentCards.size < 10;
    }

    playControlStrategy(possiblePlays) {
        // 出中等大小的牌，保留最大的
        return possiblePlays[Math.floor(possiblePlays.length / 2)];
    }

    shouldBait() {
        // 如果我们手牌很好，考虑诱导对手出大牌
        return this.evaluateHandStrength() > 25 && this.cards.length < 10;
    }

    playBaitStrategy(possiblePlays) {
        // 出较小的牌，诱导对手出大牌
        return possiblePlays[0];
    }
}
