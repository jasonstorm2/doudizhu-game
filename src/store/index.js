import { createStore } from 'vuex';
import { EventBus } from '../eventBus';
import { validateCardPattern, isGreaterThanLastPlay, sortCards,convertCards } from '../api/gameApi.js';



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

//[{ suit: 'Joker', value: 'Big', selected: false },....] 转换成 [Big,...]
function convertPlayerCardsToInitialHand(state) {
  // 确保我们在处理第三个玩家（索引为2）的卡牌
  if (state.players && state.players[2] && state.players[2].cards) {
    // 使用 map 函数转换卡牌格式
    state.gameInfo.initialHand = state.players[2].cards.map(card => {
      // 假设每个 card 对象有一个 value 属性表示卡牌的值
      // 如果卡牌的结构不同，您可能需要调整这里的逻辑
      return card.value || card.toString();
    });
  } else {
    console.error('Unable to access player cards');
    state.gameInfo.initialHand = [];
  }
}


const gameInfo = {
  gameRules: {
    basicSetup: {
      playerCount: 3,
      cardsPerPlayer: 16,
      players: ['你', 'a', 'b'],
      totalCards: 48,
      removedCards: ['大王', '小王', '2', '2', '2', 'A']
    },
    gameFlow: [
      '按顺序出牌，直到一名玩家出完所有牌',
    ],
    playRules: [
      '谁先出完牌，谁获胜',
      '首家出什么类型牌，其他玩家必须跟同类型的牌',
      '必须出大于上家的牌',
      '如无法出牌则过牌',
      '如果上家出的是多张牌（对子、三张相同、顺子等），下家必须出同样数量的牌，且牌型和点数都要大于上家',
      '只有在牌型相同且点数更大的情况下，才能压过上家的牌',
      '如果无法出大于上家的同类型牌，则必须过牌',
      '只有炸弹可以打断当前牌型，压过任何非炸弹牌型',
      '玩家必须出比上家大的牌。如果手上有大于上家的牌，必须出牌，不能选择"过"',
      '只有在没有大于上家的牌时，玩家才能选择"过"',
      '当一轮中所有其他玩家都选择"过"时，最后出牌的玩家获得出牌权，可以自由选择任何牌型出牌'
    ],
    cardTypes: {
      single: {
        description: '单牌',
        order: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
      },
      pair: {
        description: '对子',
        order: ['33', '44', '55', '66', '77', '88', '99', '1010', 'JJ', 'QQ', 'KK', 'AA']
      },
      consecutivePairs: {
        description: '连对',
        examples: {
          valid: ['3344', '445566', '667788', '8899JJ', 'KKAA'],
          invalid: ['5566JJ', 'AA22', 'JJQQAA']
        }
      },
      threeWithOne: {
        description: '三带一：三张相同+一张单牌'
      },
      threeWithTwo: {
        description: '三带二：三张相同+对子'
      },
      planeWithWings: {
        description: '飞机带翅膀：两个或两个以上三张+同数量的单牌或对子',
        examples: {
          valid: ['44433365', '', '4443336655', 'KKKQQQJJJ654', 'AAAKKKQQQ6655'],
          invalid: ['444333655', 'KKKQQQJJJ6544']
        }
      },
      straight: {
        description: '顺子：五张或以上连续单牌',
        examples: {
          valid: ['34567', '678910', '910JQK', '10JQKA'],
          invalid: ['JQKA2', 'QKA23']
        }
      },
      bomb: {
        description: '炸弹：四相同的牌，或者大小王炸，大小王炸：small,big'
      }
    },
    specialRules: [
      '强制出牌：如有大于上家的牌必须出牌，不能过牌'
    ],
    winCondition: '最先出完所有手牌的玩家获胜',
    examples: [
      '如果A出了三个4，B必须出三个大于4的牌（如三个8），或者出炸弹。如果B没有三个大于4的牌或炸弹，则必须过牌。',
      '如果A出了对10，B必须出大于10的对子（如对J、对Q等），或者出炸弹。B不能出三个9或顺子等其他牌型。',
      '如果A出了顺子45678，B必须出更大的五张顺子（如56789或67890等），或者出炸弹。B不能出其他牌型或更短的顺子。'
    ]
  },
  responseFormat: '出牌:["A","A"],注意：格式为javascript字符串数组',
  initialHand: ['A', 'K', 'Q', 'Q', 'J', '10', '9', '9', '9', '8', '7', '6', '6', '5', '5', '3'],
  historyInfo: {
    description: '玩家出牌历史',
    history: []
  },
  lastPlayedCards: {
    description: '上个玩家的出牌',
    cards: {}
  },
};

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
    gameInfo: gameInfo,//给ai的信息
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
      convertPlayerCardsToInitialHand(state);
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
        //记录ai的信息
        state.gameInfo.lastPlayedCards = convertCards(player.selectedCards);
        state.gameInfo.historyInfo.history.push(convertCards(player.selectedCards));

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