import { Player } from './Player';
import { validateCardPattern, isGreaterThanLastPlay, getCardPatternType } from '../api/gameApi';

export class ProgramPlayer extends Player {
  constructor(id) {
    super(id, 'PROGRAM');
  }

  playCards(lastPlayedCards, gameState) {
    if (!lastPlayedCards || lastPlayedCards.length === 0) {
      return this.playAsFirstPlayer();
    } else {
      return this.respondToLastPlay(lastPlayedCards);
    }
  }

  playAsFirstPlayer() {
    // Implement logic for playing as the first player
    // For now, let's just play the smallest single card
    const smallestCard = this.findSmallestCard();
    return smallestCard ? [smallestCard] : null;
  }

  respondToLastPlay(lastPlayedCards) {
    const lastPlayType = getCardPatternType(lastPlayedCards);
    const possiblePlays = this.findPossiblePlays(lastPlayType, lastPlayedCards);

    if (possiblePlays.length > 0) {
      // For now, let's just play the first valid play
      return possiblePlays[0];
    }

    return null; // Pass if no valid play is found
  }
  findSmallestCard() {
    return this.cards.reduce((smallest, current) => {
      if (!smallest || this.compareCards(current, smallest) < 0) {
        return current;
      }
      return smallest;
    }, null);
  }

  findPossiblePlays(lastPlayType, lastPlayedCards) {
    // Implement logic to find all possible plays based on the last play type
    // This is a simplified version and needs to be expanded
    const possiblePlays = [];

    for (let i = 0; i < this.cards.length; i++) {
      for (let j = i + 1; j <= this.cards.length; j++) {
        const candidatePlay = this.cards.slice(i, j);
        if (validateCardPattern(candidatePlay) && 
            getCardPatternType(candidatePlay) === lastPlayType &&
            isGreaterThanLastPlay(candidatePlay, lastPlayedCards)) {
          possiblePlays.push(candidatePlay);
        }
      }
    }

    return possiblePlays;
  }

  compareCards(card1, card2) {
    const order = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big'];
    return order.indexOf(card1.value) - order.indexOf(card2.value);
  }
}
