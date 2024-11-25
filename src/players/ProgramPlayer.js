import { Player } from './Player';
import {identifyCombinations, isGreaterThanLastPlay, getCardPatternType, validateCardPattern, sortCards, isConsecutivePairs } from '../api/gameApi';
import { gameManager } from '../managers/GameManager';

class PokerHandAnalyzer {
    constructor(cards) {
        this.cards = cards;
        this.cardCount = this.countCards();
        this.valueMap = {
            'Big': 17, 'Small': 16, '2': 15,
            'A': 14, 'K': 13, 'Q': 12, 'J': 11,
            '10': 10, '9': 9, '8': 8, '7': 7,
            '6': 6, '5': 5, '4': 4, '3': 3
        };
    }

    countCards() {
        return this.cards.reduce((acc, card) => {
            const value = card.value;
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }

    findStraights() {
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const validCards = this.cards.filter(card => !['2', 'Big', 'Small'].includes(card.value))
            .sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));

        const straights = [];
        for (let len = 5; len <= validCards.length; len++) {
            for (let i = 0; i <= validCards.length - len; i++) {
                const potential = validCards.slice(i, i + len);
                if (this.isValidStraight(potential)) {
                    straights.push(potential);
                }
            }
        }
        return straights;
    }

    isValidStraight(cards) {
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let i = 1; i < cards.length; i++) {
            if (values.indexOf(cards[i].value) !== values.indexOf(cards[i - 1].value) + 1) {
                return false;
            }
        }
        return true;
    }

    findTriples() {
        const triples = [];
        Object.entries(this.cardCount).forEach(([value, count]) => {
            if (count >= 3) {
                const cards = this.cards.filter(card => card.value === value).slice(0, 3);
                triples.push({
                    type: 'triple',
                    cards: cards,
                    value: this.valueMap[value]
                });
            }
        });
        return triples;
    }

    findBombs() {
        const bombs = [];
        Object.entries(this.cardCount).forEach(([value, count]) => {
            if (count === 4) {
                const cards = this.cards.filter(card => card.value === value);
                bombs.push({
                    type: 'bomb',
                    cards: cards,
                    value: this.valueMap[value]
                });
            }
        });

        // 检查王炸
        if (this.cardCount['Big'] && this.cardCount['Small']) {
            const cards = this.cards.filter(card => ['Big', 'Small'].includes(card.value));
            bombs.push({
                type: 'rocket',
                cards: cards,
                value: 999
            });
        }
        return bombs;
    }

    findPossibleCombinations() {
        let combinations = [];
        
        // 找出所有可能的组合
        const triples = this.findTriples();
        const straights = this.findStraights();
        const bombs = this.findBombs();

        // 评估三带组合
        triples.forEach(triple => {
            combinations.push({
                type: 'triple',
                pattern: triple.cards,
                score: this.evaluateTriple(triple),
                description: `三张${triple.cards[0].value}`
            });
        });

        // 评估顺子组合
        straights.forEach(straight => {
            combinations.push({
                type: 'straight',
                pattern: straight,
                score: this.evaluateStraight(straight),
                description: `顺子${straight.map(c => c.value).join(',')}`
            });
        });

        // 评估炸弹
        bombs.forEach(bomb => {
            combinations.push({
                type: bomb.type,
                pattern: bomb.cards,
                score: this.evaluateBomb(bomb),
                description: `${bomb.type === 'rocket' ? '王炸' : '炸弹'}${bomb.cards[0].value}`
            });
        });

        return combinations;
    }

    evaluateTriple(triple) {
        return 60 + this.valueMap[triple.cards[0].value] * 2;
    }

    evaluateStraight(straight) {
        return 80 + straight.length * 10 + this.valueMap[straight[0].value] * 2;
    }

    evaluateBomb(bomb) {
        return bomb.type === 'rocket' ? 200 : 150 + this.valueMap[bomb.cards[0].value] * 3;
    }

    findBestPlay() {
        const combinations = this.findPossibleCombinations();
        if (combinations.length === 0) {
            // 如果没有找到组合，返回最小的单牌
            const smallestCard = this.findSmallestCard();
            return {
                type: 'single',
                pattern: [smallestCard],
                score: this.valueMap[smallestCard.value],
                description: `单牌${smallestCard.value}`
            };
        }

        return combinations.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }

    findSmallestCard() {
        return this.cards.reduce((smallest, current) => {
            if (!smallest || this.valueMap[current.value] < this.valueMap[smallest.value]) {
                return current;
            }
            return smallest;
        });
    }
}

export class ProgramPlayer extends Player {
    constructor(id) {
        super(id, 'PROGRAM');
        this.opponentCards = new Set(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big']);
        this.gamePhase = 'early'; // 新增：游戏阶段跟踪
        this.playedCards = []; // 添加这行来初始化 playedCards /
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

        // 如果是首家出牌或者有可以出的牌，确保一定会出牌
        if ((!lastPlayedCards || lastPlayedCards.length === 0 || cardsToPlay) && (!cardsToPlay || cardsToPlay.length === 0)) {
            console.log('Must play cards, selecting smallest card');
            cardsToPlay = [this.findSmallestCard()];
        }

        // 确保 cardsToPlay 是一个数组
        if (!Array.isArray(cardsToPlay)) {
            cardsToPlay = [cardsToPlay];
        }

        // 过滤掉无效的卡牌
        cardsToPlay = cardsToPlay.filter(card => card && card.value);

        if (cardsToPlay.length === 0) {
            console.error('No valid cards to play, this should not happen');
            return null;
        }

        // 更新选中的卡片
        this.updateSelectedCards(cardsToPlay);

        return cardsToPlay;
    }

    playAsFirstPlayer() {
        const analyzer = new PokerHandAnalyzer(this.cards);
        const bestPlay = analyzer.findBestPlay();
        console.log('Best play found:', bestPlay.description);
        return bestPlay.pattern;
    }

    analyzeProbabilities(combinations, remainingCards) {
        const analysis = [];
        
        combinations.forEach(pattern => {
            const patternType = getCardPatternType(pattern);
            const patternScore = this.calculatePatternScore(pattern);
            
            // 计算对手可能持有的更大牌的概率
            const probability = this.calculateCounterProbability(pattern, remainingCards);
            
            // 计算期望值 = 分数 * (1 - 被大牌打败的概率)
            const expectedValue = patternScore * (1 - probability);
            
            analysis.push({
                pattern,
                patternType,
                patternScore,
                counterProbability: probability,
                expectedValue
            });
        });
        
        return analysis;
    }

    calculateCounterProbability(pattern, remainingCards) {
        const patternType = getCardPatternType(pattern);
        const patternValue = this.getPatternValue(pattern);
        
        // 计算剩余牌中可以打过这个牌型的组合数量
        const counterPatterns = this.findCounterPatterns(patternType, patternValue, remainingCards);
        
        // 根据对手手牌数量和剩余牌数量计算概率
        const totalPossibilities = this.calculateCombinations(remainingCards.length, pattern.length);
        const counterPossibilities = counterPatterns.length;
        
        return counterPossibilities / totalPossibilities;
    }

    selectBestPlay(probabilityAnalysis) {
        // 根据游戏阶段调整策略
        const gamePhaseWeight = this.gamePhase === 'early' ? 0.7 : 
                               this.gamePhase === 'mid' ? 0.5 : 0.3;
        
        // 计算每种组合的综合得分
        const scoredPlays = probabilityAnalysis.map(analysis => ({
            ...analysis,
            finalScore: analysis.expectedValue * gamePhaseWeight + 
                       (1 - analysis.counterProbability) * (1 - gamePhaseWeight)
        }));
        
        // 选择得分最高的组合
        const bestPlay = scoredPlays.reduce((best, current) => {
            return current.finalScore > best.finalScore ? current : best;
        }, scoredPlays[0]);
        
        return bestPlay.pattern;
    }

    calculateCombinations(n, r) {
        if (r > n) return 0;
        if (r === 0) return 1;
        
        let result = 1;
        for (let i = 1; i <= r; i++) {
            result *= (n - i + 1) / i;
        }
        return Math.floor(result);
    }

    findCounterPatterns(patternType, patternValue, remainingCards) {
        // 根据牌型找出所有可能打过当前牌的组合
        const counterPatterns = [];
        
        switch (patternType) {
            case 'single':
                counterPatterns.push(...this.findBiggerSingles(patternValue, remainingCards));
                break;
            case 'pair':
                counterPatterns.push(...this.findBiggerPairs(patternValue, remainingCards));
                break;
            case 'straight':
                counterPatterns.push(...this.findBiggerStraights(patternValue, remainingCards));
                break;
            // ... 其他牌型的处理
        }
        
        // 炸弹总是可以打过非炸弹牌型
        if (patternType !== 'bomb' && patternType !== 'rocket') {
            counterPatterns.push(...this.findBombs(remainingCards));
        }
        
        return counterPatterns;
    }

    getPatternValue(pattern) {
        // 获取牌型的基础值
        const patternType = getCardPatternType(pattern);
        switch (patternType) {
            case 'single':
            case 'pair':
            case 'triple':
                return pattern[0].value;
            case 'straight':
            case 'consecutivePairs':
                return pattern[0].value; // 最大的那张牌的值
            case 'bomb':
                return pattern[0].value;
            case 'rocket':
                return Infinity;
            default:
                return pattern[0].value;
        }
    }

    findDisconnectedSingles(singles) {
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const sortedSingles = singles.sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
        const disconnected = [];

        for (let i = 0; i < sortedSingles.length; i++) {
            if (i === 0 || i === sortedSingles.length - 1) {
                if (sortedSingles.length < 5) {
                    disconnected.push(sortedSingles[i]);
                }
            } else {
                const prev = values.indexOf(sortedSingles[i - 1].value);
                const curr = values.indexOf(sortedSingles[i].value);
                const next = values.indexOf(sortedSingles[i + 1].value);
                if (curr - prev > 1 && next - curr > 1) {
                    disconnected.push(sortedSingles[i]);
                }
            }
        }

        return disconnected;
    }

    playAggressiveStrategy(combinations) {
        if (combinations.bombs.length > 0) return combinations.bombs[0];
        if (combinations.consecutivePairs.length > 0) return combinations.consecutivePairs[0];
        if (combinations.tripleWithTwo.length > 0) return combinations.tripleWithTwo[0];
        if (combinations.tripleWithOne.length > 0) return combinations.tripleWithOne[0];
        if (combinations.triples.length > 0) return combinations.triples[0];
        if (combinations.straights.length > 0) return combinations.straights[0];
        if (combinations.pairs.length > 0) return combinations.pairs[0];
        if (combinations.singles.length > 0) {
            const smallSingles = combinations.singles.filter(card => ['3', '4', '5', '6', '7'].includes(card.value));
            if (smallSingles.length > 0) return [smallSingles[0]];
            return [combinations.singles[0]];
        }
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
        // 优先出不能形成顺子的小牌
        const disconnectedSingles = this.findDisconnectedSingles(combinations.singles);
        if (disconnectedSingles.length > 0) {
            return [disconnectedSingles[0]];
        }

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
            console.log('No valid plays found, checking for bomb');
            const bomb = this.findBomb(this.cards);
            if (bomb) {
                console.log('Found bomb:', bomb);
                return bomb;
            }
            console.log('No bomb found, must pass');
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

    canFormBetterHandAfterSplittingPair(pair) {
        const remainingCards = this.cards.filter(card => !pair.includes(card));
        const potentialStraight = this.findLongestPotentialStraight([...remainingCards, pair[0]]);
        return potentialStraight.length >= 5;
    }

    findLongestPotentialStraight(cards) {
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const sortedCards = cards.sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
        let longestStraight = [];
        let currentStraight = [sortedCards[0]];

        // 排除2和大小王
        const validCards = sortedCards.filter(card => !['2', 'Big', 'Small'].includes(card.value));
        if (validCards.length < 5) {
            return []; // 如果有效牌小于5张，直接返回空数组
        }

        for (let i = 1; i < validCards.length; i++) {
            const prevIndex = values.indexOf(validCards[i - 1].value);
            const currIndex = values.indexOf(validCards[i].value);

            if (currIndex - prevIndex === 1) {
                currentStraight.push(validCards[i]);
            } else if (currIndex - prevIndex === 0) {
                // 跳过重复的牌
                continue;
            } else {
                if (currentStraight.length >= 5) {
                    // 只有当前顺子长度大于等于5时才更新最长顺子
                    if (currentStraight.length > longestStraight.length) {
                        longestStraight = [...currentStraight];
                    }
                }
                currentStraight = [validCards[i]];
            }
        }

        // 检查最后一个顺子
        if (currentStraight.length >= 5 && currentStraight.length > longestStraight.length) {
            longestStraight = [...currentStraight];
        }

        // 如果最长顺子小于5，返回空数组
        return longestStraight.length >= 5 ? longestStraight : [];
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
    findBomb(cards) {
        // 检查王炸
        const jokers = cards.filter(card => card.value === 'Small' || card.value === 'Big');
        if (jokers.length === 2) {
            return jokers;
        }

        // 检查普通炸弹
        for (let i = 0; i < cards.length - 3; i++) {
            if (cards[i].value === cards[i+1].value && 
                cards[i].value === cards[i+2].value && 
                cards[i].value === cards[i+3].value) {
                return cards.slice(i, i+4);
            }
        }

        return null;
    }

    playAggressively(possiblePlays) {
        return possiblePlays[possiblePlays.length - 1];
    }
    playConservatively(possiblePlays) {
        return possiblePlays[0];
    }

    findPossiblePlays(lastPlayType, lastPlayedCards) {
        const possiblePlays = [];
        const combinations = identifyCombinations(this.cards);

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
        const combinations = identifyCombinations(this.cards);
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
        gameManager.addPlayedCards(playedCards, this.id);  // 使用 this.id 作为 playerIndex
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
        const playedCards = gameManager.getPlayedCards();

        const estimatedOpponentCards = 54 - playerCards.length - playedCards.length;

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