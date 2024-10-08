import { createStore } from 'vuex';
import { EventBus } from '../eventBus';
import { validateCardPattern, isGreaterThanLastPlay, sortCards, getCardPatternType, convertCards } from '../api/gameApi.js';



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
  "notes": "你是一个棋牌高手，善于《跑得快》这个游戏，你能从玩家出牌推断出玩家的可能的手牌，并且你能记住玩家所出的牌，你根据这些能做出最佳出牌策略",
  "game": "跑得快",
  "players": "3或更多",
  "deck": "54张扑克牌（包括大小王）",
  "winning_condition": "先出完牌的玩家获胜。",
  "playing_rules": [
    {
      "rule_no": 1,
      "description": "首家出什么类型的牌，其他玩家必须跟同类型的牌，除非玩家出炸弹。"
    },
    {
      "rule_no": 2,
      "description": "必须出大于上家的牌。"
    },
    {
      "rule_no": 3,
      "description": "如无法出牌则过牌。"
    },
    {
      "rule_no": 4,
      "description": "当一轮中所有其他玩家都选择'过'时，最后出牌的玩家获得出牌权，可以自由选择任何牌型出牌。"
    },
    {
      "rule_no": 5,
      "description": "如果玩家非首发，轮到玩家出牌时，玩家如果手上有大于上家的牌，必须出牌。"
    },
    {
      "rule_no": 6,
      "description": "如果玩家是首发，玩家可以出任意牌型"
    }
  ],
  "rule_for_size": {
    "single": "单牌，按牌面数值比较大小。",
    "pair": "对子，两张相同的牌，按牌面数值比较大小。",
    "consecutivePairs": "连对，两对或者两对以上连续的对子，比如3344，778899，请注意，对子的连续性",
    "threeWithOne": "三带一，三张相同的牌，带一根单牌，比如：3334",
    "threeWithTwo": "三带二，三张相同的牌，带一个对子，比如：33344",
    "planeWithWings": "飞机，两个连续的三带一或三带二，比如33344455或者 3334445566",
    "three": "三张，三张相同的牌，按牌面数值比较大小。",
    "bomb": "炸弹，四张相同的牌，可以打败所有非炸弹的牌型，比如4444。或者王炸，大王小王一起出，是最大的炸弹。",
  },
  "card_ranking": "大小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3",
  "card_ranking_description": "牌的大小顺序，大小王是最大的牌，可以作为炸弹一起出，也可以单独出。大王用Big表示，小王用Small表示，对子的大小比较基于单个牌面数值的大小。例如，对2（22）大于对Q（QQ）。同理，三张和三带一，三带二也是一样。",

  "responseFormat": '我的出牌:[]    比如，我的出牌:["3","3"]，用一句话回答',
  initialHand: ['A', 'K', 'Q', 'Q', 'J', '10', '9', '9', '9', '8', '7', '6', '6', '5', '5', '3'],
  historyInfo: {
    description: '玩家出牌历史',
    history: []
  },
  lastPlayedCards: {
    description: '上个玩家的出牌',
    cards: {}
  },
}

// const gameInfo2 = {
//   gameRules: {
//     basicSetup: {
//       playerCount: 3,
//       cardsPerPlayer: 18,
//       players: ['你', 'a', 'b']
//     },
//     // gameFlow: [
//     //   '按顺序出牌，直到一名玩家出完所有牌',
//     // ],
//     playRules: [
//       '大小王表示：Small表示单张的小王，Big表示单张的大王',
//       '获胜条件：先出完牌，谁获胜',
//       '出牌规则1：首家出什么类型牌，其他玩家必须跟同类型的牌，除非玩家出炸弹',
//       '出牌规则2：必须出大于上家的牌',
//       '出牌规则3：如无法出牌则过牌',
//       '当一轮中所有其他玩家都选择"过"时，最后出牌的玩家获得出牌权，可以自由选择任何牌型出牌',
//       '强制出牌：玩家非首发，轮到玩家出牌时，玩家如果手上有大于上家的牌，必须出牌'
//     ],
//     cardTypes: {
//       single: {
//         description: '单牌从小到大排序',
//         order: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big']
//       },
//       pair: {
//         description: '对子从小到大排序',
//         order: ['33', '44', '55', '66', '77', '88', '99', '1010', 'JJ', 'QQ', 'KK', 'AA', '22']
//       },
//       consecutivePairs: {
//         description: '连对的到小顺序是和单牌的一样的',
//         examples: {
//           valid: ['3344', '445566', '667788', '8899JJ', 'KKAA'],
//           invalid: ['5566JJ', 'AA22', 'JJQQAA']
//         }
//       },
//       threeWithOne: {
//         description: '三带一：三张相同+一张单牌'
//       },
//       threeWithTwo: {
//         description: '三带二：三张相同+对子'
//       },
//       planeWithWings: {
//         description: '飞机带翅膀：两个或两个以上三张+同数量的单牌或对子',
//         examples: {
//           valid: ['44433365', '', '4443336655', 'KKKQQQJJJ654', 'AAAKKKQQQ6655'],
//           invalid: ['444333655', 'KKKQQQJJJ6544']
//         }
//       },
//       straight: {
//         description: '顺子：五张或以上连续单牌',
//         examples: {
//           valid: ['34567', '678910', '910JQK', '10JQKA'],
//           invalid: ['JQKA2', 'QKA23']
//         }
//       },
//       bomb: {
//         description: '炸弹：四相同的牌，或者大小王炸，大小王炸：small,big'
//       }
//     },
//     specialRules: [
//       '强制出牌：如有大于上家的牌必须出牌，不能过牌'
//     ],
//     winCondition: '最先出完所有手牌的玩家获胜',
//     examples: [
//       '如果A出了三个4，B必须出三个大于4的牌（如三个8），或者出炸弹。如果B没有三个大于4的牌或炸弹，则必须过牌。',
//       '如果A出了对10，B必须出大于10的对子（如对J、对Q等），或者出炸弹。B不能出三个9或顺子等其他牌型。',
//       '如果A出了顺子45678，B必须出更大的五张顺子（如56789或67890等），或者出炸弹。B不能出其他牌型或更短的顺子。'
//     ]
//   },
//   responseFormat: '出牌:["A","A"],注意：格式为javascript字符串数组',
//   initialHand: ['A', 'K', 'Q', 'Q', 'J', '10', '9', '9', '9', '8', '7', '6', '6', '5', '5', '3'],
//   historyInfo: {
//     description: '玩家出牌历史',
//     history: []
//   },
//   lastPlayedCards: {
//     description: '上个玩家的出牌',
//     cards: {}
//   },
// };

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
    lastPlayedType: '',
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
        state.lastPlayedType = getCardPatternType([...player.selectedCards]);
        state.lastValidPlayPlayer = playerIndex;
        player.cards = player.cards.filter(card => !card.selected);
        player.selectedCards = [];
        state.currentPlayer = (state.currentPlayer + 1) % 3;
        state.passCount = 0;
        //记录ai的信息
        state.gameInfo.lastPlayedCards = convertCards(state.lastPlayedCards);
        state.gameInfo.historyInfo.history.push(convertCards(state.lastPlayedCards));

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
        state.lastPlayedType = '';
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
      state.lastPlayedType = '';

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
      console.log("开始出牌，牌的内容");
      console.log(selectedCards);

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
      EventBus.emit('show-alert', message);

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
    getLastPlayedType: (state) => {
      return state.lastPlayedType;
    },

    canPlay: (state) => (playerIndex) => {
      const playerCards = state.players[playerIndex].cards;
      return playerCards.length > 0;
    }
  }
});