import { Player } from './Player';
import { validateCardPattern, isGreaterThanLastPlay, getCardPatternType, sortCards } from '../api/gameApi';

export class ProgramPlayer extends Player {
    constructor(id) {
        super(id, 'PROGRAM');
    }

    playCards(lastPlayedCards, gameState) {
        this.cards = sortCards(this.cards);

        if (!lastPlayedCards || lastPlayedCards.length === 0) {
            return this.playAsFirstPlayer();
        } else {
            return this.respondToLastPlay(lastPlayedCards, gameState);
        }
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
        const possiblePlays = this.findPossiblePlays(lastPlayType, lastPlayedCards);

        if (possiblePlays.length === 0) {
            return null; // Pass if no valid play is found
        }

        // Strategic decision making
        if (this.shouldPlayBomb(possiblePlays, gameState)) {
            return this.findBomb(possiblePlays);
        }

        if (this.cards.length <= 5) {
            return this.playAggressively(possiblePlays);
        }

        return this.playConservatively(possiblePlays);
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

    shouldPlayBomb(possiblePlays, gameState) {
        // Play bomb if we're losing or if opponent has very few cards
        return this.cards.length > 10 && (gameState.opponentCardCount <= 3 || gameState.isLosing);
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
        for (let i = 0; i < this.cards.length; i++) {
            for (let j = i + 1; j <= this.cards.length; j++) {
                const candidatePlay = this.cards.slice(i, j);
                if (validateCardPattern(candidatePlay) &&
                    (getCardPatternType(candidatePlay) === lastPlayType || getCardPatternType(candidatePlay) === 'bomb') &&
                    isGreaterThanLastPlay(candidatePlay, lastPlayedCards)) {
                    possiblePlays.push(candidatePlay);
                }
            }
        }
        return possiblePlays;
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
