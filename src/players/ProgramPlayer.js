import { Player } from './Player';
import { isGreaterThanLastPlay, getCardPatternType, validateCardPattern, sortCards, isConsecutivePairs } from '../api/gameApi';

export class ProgramPlayer extends Player {
    constructor(id) {
        super(id, 'PROGRAM');
        this.opponentCards = new Set(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big']);
        this.gamePhase = 'early'; // 新增：游戏阶段跟踪
        this.playedCards = []; // 添加这行来初始化 playedCards
    }

    playCards(lastPlayedCards, gameState) {
        console.log('ProgramPlayer playCards called with gameState:', gameState);
        let cardsToPlay;
        if (!lastPlayedCards || lastPlayedCards.length === 0) {
            cardsToPlay = this.playAsFirstPlayer();
        } else {
            cardsToPlay = this.respondToLastPlay(lastPlayedCards, gameState);
        }

        console.log('ProgramPlayer decided to play:', cardsToPlay);

        // 如果是首家出牌，确保一定会出牌
        if ((!lastPlayedCards || lastPlayedCards.length === 0) && (!cardsToPlay || cardsToPlay.length === 0)) {
            console.log('First player must play cards, selecting smallest card');
            cardsToPlay = [this.findSmallestCard()];
        }

        // 确保 cardsToPlay 是一个数组
        if (!Array.isArray(cardsToPlay)) {
            cardsToPlay = [cardsToPlay];
        }

        // 过滤掉无效的卡牌
        cardsToPlay = cardsToPlay.filter(card => card && card.value);

        if (cardsToPlay.length === 0) {
            console.error('No valid cards to play');
            return null;
        }

        // 更新选中的卡片
        this.updateSelectedCards(cardsToPlay);

        return cardsToPlay;
    }

    playAsFirstPlayer() {
        const combinations = this.identifyCombinations();
        const handStrength = this.evaluateHandStrength();
        const remainingCards = this.estimateRemainingCards();

        if (handStrength > 25 || this.cards.length <= 5) {
            return this.playAggressiveStrategy(combinations);
        }

        if (handStrength < 15) {
            return this.playControlStrategy(combinations);
        }

        return this.playBalancedStrategy(combinations, remainingCards);
    }

    playAggressiveStrategy(combinations) {
        if (combinations.bombs.length > 0) return combinations.bombs[0];
        if (combinations.consecutivePairs.length > 0) return combinations.consecutivePairs[0];
        if (combinations.tripleWithTwo.length > 0) return combinations.tripleWithTwo[0];
        if (combinations.tripleWithOne.length > 0) return combinations.tripleWithOne[0];
        if (combinations.triples.length > 0) return combinations.triples[0];
        if (combinations.straights.length > 0) return combinations.straights[0];
        if (combinations.pairs.length > 0) return combinations.pairs[0];
        if (combinations.singles.length > 0) return [combinations.singles[0]];
        return [this.findSmallestCard()];
    }

    playControlStrategy(combinations) {
        if (combinations.singles.length > 0) {
            const smallSingles = combinations.singles.filter(card => ['3', '4', '5', '6', '7'].includes(card.value));
            if (smallSingles.length > 0) return [smallSingles[0]];
        }
        if (combinations.pairs.length > 0) {
            const smallPairs = combinations.pairs.filter(pair => ['3', '4', '5', '6', '7'].includes(pair[0].value));
            if (smallPairs.length > 0) return smallPairs[0];
        }
        if (combinations.consecutivePairs.length > 0) {
            const smallConsecutivePairs = combinations.consecutivePairs.filter(pairs => ['3', '4', '5', '6', '7'].includes(pairs[0].value));
            if (smallConsecutivePairs.length > 0) return smallConsecutivePairs[0];
        }
        if (combinations.straights.length > 0) return combinations.straights[0];
        if (combinations.tripleWithOne.length > 0) return combinations.tripleWithOne[0];
        if (combinations.triples.length > 0) return combinations.triples[0];
        return [this.findSmallestCard()];
    }

    playBalancedStrategy(combinations, remainingCards) {
        if (remainingCards.singles > remainingCards.pairs && remainingCards.singles > remainingCards.triples) {
            if (combinations.pairs.length > 0) return combinations.pairs[0];
            if (combinations.consecutivePairs.length > 0) return combinations.consecutivePairs[0];
            if (combinations.triples.length > 0) return combinations.triples[0];
        } else if (remainingCards.pairs > remainingCards.singles && remainingCards.pairs > remainingCards.triples) {
            if (combinations.singles.length > 0) return [combinations.singles[0]];
            if (combinations.triples.length > 0) return combinations.triples[0];
        } else {
            if (combinations.singles.length > 0) return [combinations.singles[0]];
            if (combinations.pairs.length > 0) return combinations.pairs[0];
        }

        if (combinations.consecutivePairs.length > 0) {
            return combinations.consecutivePairs.reduce((longest, current) => current.length > longest.length ? current : longest);
        }
        if (combinations.straights.length > 0) {
            return combinations.straights.reduce((longest, current) => current.length > longest.length ? current : longest);
        }
        return [this.findSmallestCard()];
    }

    estimateRemainingCards() {
        const remainingCards = {
            singles: 0,
            pairs: 0,
            triples: 0
        };

        this.opponentCards.forEach(card => {
            const count = this.countCardInOpponentHands(card);
            if (count === 1) remainingCards.singles++;
            else if (count === 2) remainingCards.pairs++;
            else if (count === 3) remainingCards.triples++;
        });

        return remainingCards;
    }

    countCardInOpponentHands(card) {
        const inHand = this.cards.filter(c => c.value === card).length;
        const played = this.playedCards.filter(c => c.value === card).length;
        return 4 - inHand - played;
    }

    getCardValue(card) {
        const order = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big'];
        return order.indexOf(card.value);
    }

    respondToLastPlay(lastPlayedCards, gameState) {
        this.updateOpponentCards(lastPlayedCards);
        
        if (gameState) {
            this.updateGamePhase(gameState);
        } else {
            console.warn('gameState is undefined in respondToLastPlay');
        }

        const lastPlayType = getCardPatternType(lastPlayedCards);
        console.log('Last play type:', lastPlayType);
        const possiblePlays = this.findPossiblePlays(lastPlayType, lastPlayedCards);
        console.log('Possible plays:', possiblePlays);

        if (!Array.isArray(possiblePlays) || possiblePlays.length === 0) {
            console.log('No valid plays found, must pass');
            return null;
        }

        let selectedPlay;

        if (this.shouldPlayBomb(possiblePlays, gameState)) {
            selectedPlay = this.findBomb(possiblePlays);
        } else if (this.gamePhase === 'late' && this.cards.length <= 5) {
            selectedPlay = this.playAggressively(possiblePlays);
        } else if (this.shouldControl(possiblePlays, gameState)) {
            selectedPlay = this.playStrategicControl(possiblePlays, gameState);
        } else if (this.shouldBait(possiblePlays, gameState)) {
            selectedPlay = this.playBaitStrategy(possiblePlays);
        } else {
            selectedPlay = this.playStrategically(possiblePlays, gameState);
        }

        console.log('Selected play:', selectedPlay);
        return selectedPlay;
    }

    mustPlay(lastPlayedCards) {
        if (!lastPlayedCards || lastPlayedCards.length === 0) {
            return true;
        }
        return this.findPossiblePlays(getCardPatternType(lastPlayedCards), lastPlayedCards).length > 0;
    }

    selectForcedPlay(possiblePlays, lastPlayType) {
        const validPlays = possiblePlays.filter(play => {
            const playArray = Array.isArray(play) ? play : [play];
            return getCardPatternType(playArray) === lastPlayType;
        });

        if (validPlays.length > 0) {
            return this.playConservatively(validPlays);
        }
        return this.findBomb(possiblePlays) || this.playConservatively(possiblePlays);
    }

    identifyCombinations() {
        const combinations = {
            singles: [],
            pairs: [],
            triples: [],
            tripleWithOne: [],
            tripleWithTwo: [],
            straights: [],
            bombs: [],
            consecutivePairs: []
        };

        const tripleSets = new Set();
        for (let i = 0; i < this.cards.length - 2; i++) {
            if (this.cards[i].value === this.cards[i + 1].value && this.cards[i].value === this.cards[i + 2].value) {
                tripleSets.add(this.cards[i].value);
                combinations.triples.push(this.cards.slice(i, i + 3));
                i += 2;
            }
        }

        for (let i = 0; i < this.cards.length; i++) {
            if (i + 3 < this.cards.length &&
                this.cards[i].value === this.cards[i + 1].value &&
                this.cards[i].value === this.cards[i + 2].value &&
                this.cards[i].value === this.cards[i + 3].value) {
                combinations.bombs.push(this.cards.slice(i, i + 4));
                i += 3;
            } else if (!tripleSets.has(this.cards[i].value)) {
                if (i + 1 < this.cards.length && this.cards[i].value === this.cards[i + 1].value) {
                    combinations.pairs.push(this.cards.slice(i, i + 2));
                    i += 1;
                } else {
                    combinations.singles.push(this.cards[i]);
                }
            }
        }

        combinations.triples.forEach(triple => {
            const remainingCards = this.cards.filter(card => !triple.includes(card));
            if (remainingCards.length >= 1) {
                combinations.tripleWithOne.push([...triple, remainingCards[0]]);
            }
            if (remainingCards.length >= 2) {
                combinations.tripleWithTwo.push([...triple, remainingCards[0], remainingCards[1]]);
            }
        });

        combinations.straights = this.findStraights();
        combinations.consecutivePairs = this.findConsecutivePairs();

        return combinations;
    }

    findStraights() {
        const straights = [];
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const sortedCards = this.cards.filter(card => values.includes(card.value))
                                .sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));

        for (let length = 5; length <= sortedCards.length; length++) {
            for (let i = 0; i <= sortedCards.length - length; i++) {
                const potentialStraight = sortedCards.slice(i, i + length);
                if (this.isStraight(potentialStraight)) {
                    straights.push(potentialStraight);
                }
            }
        }
        return straights;
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

    shouldPlayBomb(possiblePlays, gameState) {
        if (!Array.isArray(possiblePlays)) {
            console.error('possiblePlays is not an array:', possiblePlays);
            return false;
        }

        const handStrength = this.evaluateHandStrength();
        const opponentCardsCount = this.opponentCards.size;
        const hasBomb = possiblePlays.some(play => getCardPatternType(play) === 'bomb');
        
        if (this.gamePhase === 'late' && opponentCardsCount <= 5 && hasBomb) {
            return true;
        }
        
        if (gameState && gameState.players && Array.isArray(gameState.players)) {
            if (gameState.players.some(player => player.id !== this.id && player.cardCount <= 2) && hasBomb) {
                return true;
            }
        }
        
        return (handStrength > 20 || opponentCardsCount < 5) && hasBomb;
    }
    findBomb(possiblePlays) {
        return possiblePlays.find(play => getCardPatternType(play) === 'bomb');
    }

    playAggressively(possiblePlays) {
        return possiblePlays[possiblePlays.length - 1];
    }
    playConservatively(possiblePlays) {
        return possiblePlays[0];
    }

    findPossiblePlays(lastPlayType, lastPlayedCards) {
        const possiblePlays = [];
        const combinations = this.identifyCombinations();

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
            case 'tripleWithOne':
                possiblePlays.push(...combinations.tripleWithOne.filter(play => isGreaterThanLastPlay(play, lastPlayedCards)));
                possiblePlays.push(...combinations.tripleWithTwo.filter(play => isGreaterThanLastPlay(play.slice(0, 4), lastPlayedCards)));
                break;
            case 'tripleWithTwo':
                possiblePlays.push(...combinations.tripleWithTwo.filter(play => isGreaterThanLastPlay(play, lastPlayedCards)));
                break;
            case 'straight':
                possiblePlays.push(...combinations.straights.filter(straight => 
                    straight.length === lastPlayedCards.length && isGreaterThanLastPlay(straight, lastPlayedCards)
                ));
                break;
            case 'consecutivePairs':
                possiblePlays.push(...this.findConsecutivePairs(lastPlayedCards.length).filter(pairs => 
                    isGreaterThanLastPlay(pairs, lastPlayedCards)
                ));
                break;
        }

        // 总是考虑炸弹
        possiblePlays.push(...combinations.bombs);

        // 如果没有找到合适的组合，尝试拆牌
        if (possiblePlays.length === 0) {
            possiblePlays.push(...this.findSplitPlays(lastPlayType, lastPlayedCards));
        }

        return Array.from(new Set(possiblePlays.map(JSON.stringify))).map(JSON.parse);
    }

    findConsecutivePairs(length) {
        const consecutivePairs = [];
        const sortedCards = sortCards([...this.cards]);
        const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        // 特殊处理 KKAA 的情况
        if (length === 4) {
            const kingsAndAces = sortedCards.filter(card => card.value === 'K' || card.value === 'A');
            if (kingsAndAces.length === 4 && kingsAndAces[0].value === 'K' && kingsAndAces[2].value === 'A') {
                consecutivePairs.push(kingsAndAces);
            }
        }
        
        for (let i = 0; i < sortedCards.length - length + 1; i++) {
            const potentialPairs = sortedCards.slice(i, i + length);
            if (isConsecutivePairs(potentialPairs)) {
                // 检查是否是有效的连对（不包括2和大小王）
                const pairValues = potentialPairs.map(card => card.value);
                const uniquePairValues = [...new Set(pairValues)];
                if (uniquePairValues.every(value => cardOrder.includes(value))) {
                    consecutivePairs.push(potentialPairs);
                }
            }
        }
        
        return consecutivePairs;
    }

    findSplitPlays(lastPlayType, lastPlayedCards) {
        const possiblePlays = [];
        const cardCount = lastPlayedCards.length;

        for (let i = 0; i <= this.cards.length - cardCount; i++) {
            const candidatePlay = this.cards.slice(i, i + cardCount);
            if (validateCardPattern(candidatePlay, false) && getCardPatternType(candidatePlay) === lastPlayType && isGreaterThanLastPlay(candidatePlay, lastPlayedCards)) {
                possiblePlays.push(candidatePlay);
            }
        }

        return possiblePlays;
    }

    updateSelectedCards(cardsToPlay) {
        this.cards.forEach(card => card.selected = false);
        this.selectedCards = [];

        if (!Array.isArray(cardsToPlay)) {
            cardsToPlay = [cardsToPlay];
        }

        cardsToPlay.forEach(cardToPlay => {
            const cardInHand = this.cards.find(card => {
                if (typeof cardToPlay === 'string') {
                    return card.value === cardToPlay;
                }
                else if (typeof cardToPlay === 'object' && cardToPlay !== null) {
                    return card.value === cardToPlay.value && 
                           (cardToPlay.suit ? card.suit === cardToPlay.suit : true);
                }
                return false;
            });

            if (cardInHand) {
                cardInHand.selected = true;
                this.selectedCards.push(cardInHand);
            } else {
                console.warn('Card not found in hand:', cardToPlay);
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
        
        score -= this.cards.length * 0.5;
        
        return score;
    }

    updateOpponentCards(playedCards) {
        playedCards.forEach(card => this.opponentCards.delete(card.value));
        this.playedCards = this.playedCards.concat(playedCards);
    }

    updateGamePhase(gameState) {
        if (!gameState || typeof gameState !== 'object') {
            console.error('Invalid gameState:', gameState);
            this.gamePhase = 'unknown';
            return;
        }

        const playerCards = gameState["你目前的手牌"] || [];
        const lastPlayedCards = gameState["上家出牌"] || [];
        const playHistory = gameState["玩家出牌历史"] || [];

        const totalCards = playerCards.length + lastPlayedCards.length + playHistory.flat().length;

        if (totalCards > 40) {
            this.gamePhase = 'early';
        } else if (totalCards > 20) {
            this.gamePhase = 'mid';
        } else {
            this.gamePhase = 'late';
        }

        console.log('Current game phase:', this.gamePhase, 'Estimated total cards:', totalCards);
    }

    shouldControl(possiblePlays, gameState) {
        if (!gameState || typeof gameState !== 'object') {
            console.error('Invalid gameState in shouldControl:', gameState);
            return false;
        }

        const playerCards = gameState["你目前的手牌"] || [];
        const playHistory = gameState["玩家出牌历史"] || [];

        const estimatedOpponentCards = 54 - playerCards.length - playHistory.flat().length;

        return this.gamePhase !== 'late' && possiblePlays.length > 2 && estimatedOpponentCards < 10;
    }

    playStrategicControl(possiblePlays, gameState) {
        if (!gameState || typeof gameState !== 'object') {
            console.error('Invalid gameState in playStrategicControl:', gameState);
            return this.playConservatively(possiblePlays);
        }

        const playerCards = gameState["你目前的手牌"] || [];
        const playHistory = gameState["玩家出牌历史"] || [];

        const estimatedOpponentCards = 54 - playerCards.length - playHistory.flat().length;

        if (estimatedOpponentCards <= 5) {
            return this.playModerateLarge(possiblePlays);
        } else {
            return possiblePlays[Math.floor(possiblePlays.length / 2)];
        }
    }

    shouldBait(possiblePlays, gameState) {
        if (!gameState || typeof gameState !== 'object') {
            console.error('Invalid gameState in shouldBait:', gameState);
            return false;
        }

        const handStrength = this.evaluateHandStrength();
        const playerCards = gameState["你目前的手牌"] || [];
        const playHistory = gameState["玩家出牌历史"] || [];

        const estimatedOpponentCards = 54 - playerCards.length - playHistory.flat().length;

        return handStrength > estimatedOpponentCards * 3 && this.cards.length < 10;
    }

    playBaitStrategy(possiblePlays) {
        return possiblePlays[0];
    }

    playStrategically(possiblePlays, gameState) {
        if (!gameState || typeof gameState !== 'object') {
            console.error('Invalid gameState in playStrategically:', gameState);
            return this.playConservatively(possiblePlays);
        }

        const handStrength = this.evaluateHandStrength();
        const playerCards = gameState["你目前的手牌"] || [];
        const playHistory = gameState["玩家出牌历史"] || [];

        const estimatedOpponentCards = 54 - playerCards.length - playHistory.flat().length;

        if (this.gamePhase === 'early') {
            return this.playConservatively(possiblePlays);
        } else if (this.gamePhase === 'mid') {
            if (handStrength > estimatedOpponentCards * 2) {
                return this.playModerateLarge(possiblePlays);
            } else {
                return this.playModerateSmall(possiblePlays);
            }
        } else {
            if (handStrength > estimatedOpponentCards) {
                return this.playAggressively(possiblePlays);
            } else {
                return this.playModerateLarge(possiblePlays);
            }
        }
    }

    playModerateLarge(possiblePlays) {
        const index = Math.floor(possiblePlays.length * 0.75);
        return possiblePlays[index];
    }

    playModerateSmall(possiblePlays) {
        const index = Math.floor(possiblePlays.length * 0.25);
        return possiblePlays[index];
    }
}
