import { createStore } from 'vuex';
import { EventBus } from '../eventBus';
import { validateCardPattern, sortCards, getCardPatternType, convertCards } from '../api/gameApi.js';
import { HumanPlayer } from '../players/HumanPlayer';
import { ProgramPlayer } from '../players/ProgramPlayer';
// import { AIPlayer } from '../players/AIPlayer';

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
  "winning_condition": "先出牌的玩家获胜。",
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
      "description": "如果玩家非首，轮到玩家出牌时，玩家如果手上有大于上家的牌，必须出牌。"
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

export default createStore({
  state: {
    gameState: 'START',
    players: [
      new HumanPlayer(0),
      new ProgramPlayer(1),
      new ProgramPlayer(2),
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
    testMode: false,
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
    PLAY_CARDS(state, { playerIndex, cards }) {
      const player = state.players[playerIndex];
      try {
        if (cards.length > 0 && validateCardPattern(cards)) {
          state.playedCards = [...cards];
          sortCards(state.playedCards);
          state.lastPlayedCards = [...cards];
          state.lastPlayedType = getCardPatternType([...cards]);
          state.lastValidPlayPlayer = playerIndex;
          player.cards = player.cards.filter(card => !cards.some(c => c.value === card.value && c.suit === card.suit));
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
      } catch (error) {
        console.error(error);
        // 在这里触发一个事件来显示错误消息
        EventBus.emit('show-alert', error.message);
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
    SET_TEST_MODE(state, isTestMode) {
      state.testMode = isTestMode;
    },
    SET_PLAYER_CARDS(state, { playerIndex, cards }) {
      state.players[playerIndex].cards = cards;
    },
    SET_LAST_PLAYED_CARDS(state, cards) {
      state.lastPlayedCards = cards;
    },
    SET_CURRENT_PLAYER(state, playerIndex) {
      state.currentPlayer = playerIndex;
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

    playCards({ commit, state, dispatch }, { playerIndex, cards }) {
      console.log(`Player index ${playerIndex} is playing cards.......`);

      const player = state.players[playerIndex];
      if (!player) {
        console.error(`Player at index ${playerIndex} is undefined`);
        return;
      }

      // 创建一个包含必要信息的 gameState 对象
      const gameState = {
        "你目前的手牌": player.cards.map(card => card.value),
        "上家出牌": state.lastPlayedCards ? state.lastPlayedCards.map(card => card.value) : [],
        "玩家出牌历史": state.gameInfo.historyInfo.history,
        "上家牌型": state.lastPlayedType
      };

      const selectedCards = cards || player.selectedCards;
      if (!selectedCards) {
        console.error(`selectedCards for player ${playerIndex} is undefined`);
        return;
      }

      sortCards(selectedCards);
      console.log("开始出牌，牌的内容");
      console.log(selectedCards);

      try {
        // 如果是 AI 玩家，调用其 playCards 方法并传递 gameState
        if (player.type === 'PROGRAM') {
          const aiCards = player.playCards(state.lastPlayedCards, gameState);
          // 使用 AI 返回的牌
          commit('PLAY_CARDS', { playerIndex, cards: aiCards });
        } else {
          // 对于人类玩家，使用选中的牌
          commit('PLAY_CARDS', { playerIndex, cards: selectedCards });
        }

        if (player.cards.length === 0) {
          commit('SET_WINNER', playerIndex);
        }

        // 在 action 结束时触发 turnEnd 事件
        EventBus.emit('turnEnd');
      } catch (error) {
        console.error(error);
        dispatch('showAlert', error.message);
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

      // 在 action 结束时触发 turnEnd 事件
      EventBus.emit('turnEnd');
    },
    restartGame({ commit }) {
      commit('RESET_GAME');
    },
    sortPlayerCards({ commit }, playerIndex) {
      commit('SORT_PLAYER_CARDS', playerIndex);
    },
    setupTestScenario({ commit }, { player0Cards, player1Cards, player2Cards, lastPlayedCards, currentPlayer }) {
      commit('SET_TEST_MODE', true);
      commit('SET_PLAYER_CARDS', { playerIndex: 0, cards: player0Cards });
      commit('SET_PLAYER_CARDS', { playerIndex: 1, cards: player1Cards });
      commit('SET_PLAYER_CARDS', { playerIndex: 2, cards: player2Cards });
      commit('SET_LAST_PLAYED_CARDS', lastPlayedCards);
      commit('SET_CURRENT_PLAYER', currentPlayer);
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