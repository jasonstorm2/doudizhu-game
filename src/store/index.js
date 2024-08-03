import { createStore } from 'vuex'
import gameApi from '../api/gameApi'


export default createStore({
  state() {
    return {
      gameState: 'START',
      players: [
        { cards: [], selectedCards: [] },
        { cards: [], selectedCards: [] },
        { cards: [], selectedCards: [] }
      ],
      currentPlayer: 0,
      playedCards: [],
      winner: null
    }
  },
  mutations: {
    SET_GAME_STATE(state, newState) {
      state.gameState = newState;
    },
    SET_PLAYER_CARDS(state, { playerIndex, cards }) {
      state.players[playerIndex].cards = cards;
    },
    SELECT_CARD(state, { playerIndex, cardIndex }) {
      const card = state.players[playerIndex].cards[cardIndex];
      card.selected = !card.selected;
      if (card.selected) {
        state.players[playerIndex].selectedCards.push(card);
      } else {
        const index = state.players[playerIndex].selectedCards.indexOf(card);
        state.players[playerIndex].selectedCards.splice(index, 1);
      }
    },
    PLAY_CARDS(state, cards) {
      state.playedCards = cards;
      state.players[state.currentPlayer].cards = state.players[state.currentPlayer].cards.filter(card => !card.selected);
      state.players[state.currentPlayer].selectedCards = [];
      state.currentPlayer = (state.currentPlayer + 1) % 3;
    },
    SET_WINNER(state, winner) {
      state.winner = winner;
      state.gameState = 'END';
    }
  },
  actions: {
    async startGame1({ commit }) {
      const cards = await gameApi.startGame();
      cards.forEach((playerCards, index) => {
        commit('SET_PLAYER_CARDS', { playerIndex: index, cards: playerCards });
      });
      commit('SET_GAME_STATE', 'PLAYING');
    },

    async startGame({ commit }) {
      const cards = await gameApi.startGame();
      cards.forEach((playerCards, index) => {
        commit('SET_PLAYER_CARDS', { playerIndex: index, cards: playerCards });
      });
      commit('SET_GAME_STATE', 'PLAYING');
    },


    selectCard({ commit, state }, cardIndex) {
      commit('SELECT_CARD', { playerIndex: state.currentPlayer, cardIndex });
    },
    async playCards({ commit, state }) {
      const selectedCards = state.players[state.currentPlayer].selectedCards;
      const result = await gameApi.playCards(selectedCards);
      if (result.valid) {
        commit('PLAY_CARDS', selectedCards);
        if (result.winner) {
          commit('SET_WINNER', result.winner);
        }
      } else {
        // 重置选中的牌
        state.players[state.currentPlayer].selectedCards.forEach(card => card.selected = false);
        state.players[state.currentPlayer].selectedCards = [];
      }
    },
    restartGame({ dispatch }) {
      // 重置游戏状态
      this.replaceState({
        gameState: 'START',
        players: [
          { cards: [], selectedCards: [] },
          { cards: [], selectedCards: [] },
          { cards: [], selectedCards: [] }
        ],
        currentPlayer: 0,
        playedCards: [],
        winner: null
      });
      dispatch('startGame');
    }
  }
})