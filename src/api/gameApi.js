// 这里应该使用真实的API调用，这只是一个模拟
const gameApi = {

  startGame() {
    return new Promise(resolve => {
      setTimeout(() => {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = ['2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
        let deck = suits.flatMap(suit => values.map(value => ({ suit, value })));
        // 添加大小王
        deck.unshift({ suit: 'Joker', value: 'Big' }, { suit: 'Joker', value: 'Small' });
        const shuffled = deck.sort(() => Math.random() - 0.5);
        resolve([
          shuffled.slice(0, 18),
          shuffled.slice(18, 36),
          shuffled.slice(36)
        ]);
      }, 1000);
    });
  },

    playCards(cards) {
      return new Promise(resolve => {
        setTimeout(() => {
          // 这里应该有真实的牌型判断逻辑
          const valid = Math.random() > 0.2;
          const winner = cards.length === 0 ? Math.floor(Math.random() * 3) : null;
          resolve({ valid, winner });
        }, 500);
      });
    }
  };
  
  export default gameApi;