import { createStore } from 'vuex';
import { EventBus } from '../eventBus';
import { validateCardPattern, isGreaterThanLastPlay,sortCards } from '../api/gameApi.js';



// 辅助函数
function createDeck() {
  const suits = ['♠', '♥', '♣', '♦'];
  const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  let deck = suits.flatMap(suit => values.map(value => ({ suit, value, selected: false })));
  //大小鬼，特殊的牌型定义
  deck.push({ suit: 'Joker', value: 'Small', selected: false });
  deck.push({ suit: 'Joker', value: 'Big', selected: false });
  return deck;
}

//给玩家的手牌排序
function compareCards(a, b) {
  const order = ['Big', 'Small', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
  if (a.suit === 'Joker' && b.suit === 'Joker') {
    return order.indexOf(a.value) - order.indexOf(b.value);
  }
  if (a.suit === 'Joker') return -1;
  if (b.suit === 'Joker') return 1;
  return order.indexOf(a.value) - order.indexOf(b.value);
}

//打乱牌
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default createStore({
  state: {
    gameState: 'START',
    players: [
      { cards: [], selectedCards: [] },
      { cards: [], selectedCards: [] },
      { cards: [], selectedCards: [] }
    ],
    currentPlayer: 0,
    playedCards: [],
    lastPlayedCards: null,
    lastValidPlay: null,
    passCount: 0,
    winner: null,
    lastValidPlayPlayer: null, // 记录最后一个有效出牌的玩家
    currentRoundStartPlayer: null, // 记录当前小轮的首发玩家
  },

  mutations: {
    SET_GAME_STATE(state, newState) {
      state.gameState = newState;
    },
    DEAL_CARDS(state, shuffledDeck) {
      state.players.forEach((player, index) => {
        player.cards = shuffledDeck.slice(index * 18, (index + 1) * 18).sort(compareCards);
        player.selectedCards = [];
      });
    },
    SELECT_CARD(state, { playerIndex, cardIndex }) {
      const player = state.players[playerIndex];
      const card = player.cards[cardIndex];
      card.selected = !card.selected;
      
      if (card.selected) {
        player.selectedCards.push(card);
        player.selectedCards = sortCards(player.selectedCards);
      } else {
        const index = player.selectedCards.findIndex(c => c.value === card.value && c.suit === card.suit);
        if (index !== -1) {
          player.selectedCards.splice(index, 1);
        }
      }
    },
    PLAY_CARDS(state, playerIndex) {
      const player = state.players[playerIndex];
      if (player.selectedCards.length > 0 && validateCardPattern(player.selectedCards)) {
        state.playedCards = [...player.selectedCards];
        sortCards(state.playedCards);
        state.lastPlayedCards = [...player.selectedCards];
        state.lastValidPlayPlayer = playerIndex;
        player.cards = player.cards.filter(card => !card.selected);
        player.selectedCards = [];
        state.currentPlayer = (state.currentPlayer + 1) % 3;
        state.passCount = 0;
    
        // 如果其他两名玩家都没有牌，开始新的小轮
        if (state.players[(playerIndex + 1) % 3].cards.length === 0 &&
            state.players[(playerIndex + 2) % 3].cards.length === 0) {
          state.currentRoundStartPlayer = playerIndex;
        }
      }
    },

    PASS_PLAY(state) {
      state.passCount++;
      if (state.passCount === 2) {
        // 两家都过牌，最后出牌的玩家成为新小轮的首发玩家
        state.passCount = 0;
        state.currentPlayer = state.lastValidPlayPlayer;
        state.currentRoundStartPlayer = state.lastValidPlayPlayer;
        state.lastPlayedCards = null;
      } else {
        state.currentPlayer = (state.currentPlayer + 1) % 3;
      }
    },
    SET_WINNER(state, playerIndex) {
      state.winner = playerIndex;
      state.gameState = 'END';
    },
    RESET_GAME(state) {
      state.gameState = 'START';
      state.players.forEach(player => {
        player.cards = [];
        player.selectedCards = [];
      });
      state.currentPlayer = 0;
      state.playedCards = [];
      state.lastPlayedCards = null;
      state.lastValidPlay = null;
      state.passCount = 0;
      state.winner = null;
    },
    SORT_PLAYER_CARDS(state, playerIndex) {
      state.players[playerIndex].cards.sort(compareCards);
    },
  },

  actions: {
    startGame({ commit }) {
      let deck = createDeck();
      deck = shuffleDeck(deck);
      commit('DEAL_CARDS', deck);
      commit('SET_GAME_STATE', 'PLAYING');
    },
    selectCard({ commit }, payload) {
      commit('SELECT_CARD', payload);
    },
    playCards({ commit, state, dispatch }, playerIndex) {
      const selectedCards = state.players[playerIndex].selectedCards;
      sortCards(selectedCards);
      
      if (validateCardPattern(selectedCards)) {
        if (!state.lastPlayedCards || isGreaterThanLastPlay(selectedCards, state.lastPlayedCards)) {
          commit('PLAY_CARDS', playerIndex);
          if (state.players[playerIndex].cards.length === 0) {
            commit('SET_WINNER', playerIndex);
          }
        } else {
          dispatch('showAlert', '出的牌必须大于上家的牌！');
        }
      } else {
        dispatch('showAlert', '无效的牌型！');
      }
    },
    showAlert(context, message) {
      // 这里需要通过某种方式调用 App.vue 中的 showAlert 方法
      // 一种方法是使用事件总线
      EventBus.$emit('show-alert', message);
    },
    passPlay({ commit, state }) {
      if (state.lastPlayedCards === null) {
        throw new Error('第一个出牌的玩家不能过牌！');
      }
      commit('PASS_PLAY');
    },
    restartGame({ commit }) {
      commit('RESET_GAME');
    },
    sortPlayerCards({ commit }, playerIndex) {
      commit('SORT_PLAYER_CARDS', playerIndex);
    },
  },

  getters: {
    getPlayerCards: (state) => (playerIndex) => {
      return state.players[playerIndex].cards;
    },
    getCurrentPlayerCards: (state) => {
      return state.players[state.currentPlayer].cards;
    },
    getPlayedCards: (state) => {
      return state.playedCards;
    },
    getLastPlayedCards: (state) => {
      return state.lastPlayedCards;
    },
    getLastValidPlay: (state) => {
      return state.lastValidPlay;
    },
  
    canPlay: (state) => (playerIndex) => {
      const playerCards = state.players[playerIndex].cards;
      return playerCards.length > 0;
    }
  }
});