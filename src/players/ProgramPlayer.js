import { Player } from './Player';
import { isGreaterThanLastPlay, getCardPatternType } from '../api/gameApi';

export class ProgramPlayer extends Player {
    constructor(id) {
        super(id, 'PROGRAM');
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

        // Play the smallest single card if we have many cards
        if (this.cards.length > 10 && combinations.singles.length > 0) {
            return [combinations.singles[0]];
        }

        // Play a small pair if available
        if (combinations.pairs.length > 0) {
            return combinations.pairs[0];
        }

        // Play a straight if we have one
        if (combinations.straights.length > 0) {
            return combinations.straights[0];
        }

        // Default to smallest single card
        return [this.cards[0]];
    }

    respondToLastPlay(lastPlayedCards, gameState) {
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
        if (this.shouldPlayBomb(possiblePlays, gameState)) {
            return this.findBomb(possiblePlays);
        }

        if (this.cards.length <= 5) {
            return this.playAggressively(possiblePlays);
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
        // Play bomb if we're losing or if opponent has very few cards
        return this.cards.length > 10 && possiblePlays.some(play => {
            const playArray = Array.isArray(play) ? play : [play];
            return getCardPatternType(playArray) === 'bomb';
        });
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
                possiblePlays.push(...combinations.singles.filter(card => isGreaterThanLastPlay([card], lastPlayedCards)));
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

        // 移除重复的出牌选择
        return Array.from(new Set(possiblePlays.map(JSON.stringify))).map(JSON.parse);
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
}
