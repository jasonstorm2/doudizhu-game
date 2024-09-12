export class Player {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.cards = [];
    this.selectedCards = [];
  }

  selectCard(cardIndex) {
    const card = this.cards[cardIndex];
    card.selected = !card.selected;
    if (card.selected) {
      this.selectedCards.push(card);
    } else {
      const index = this.selectedCards.findIndex(c => c === card);
      if (index !== -1) {
        this.selectedCards.splice(index, 1);
      }
    }
  }

  playCards() {
    throw new Error("Method 'playCards()' must be implemented.");
  }

  canPass(lastPlayedCards) {
    console.log(lastPlayedCards);
    throw new Error("Method 'canPass()' must be implemented.");
  }
}