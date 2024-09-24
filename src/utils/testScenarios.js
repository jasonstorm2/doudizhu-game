// 导入所需的依赖
import { useStore } from 'vuex';

export function useTestScenarios() {
  const store = useStore();

  const setupTestScenario = () => {
    const player0Cards = [
      { suit: '♠', value: '5', selected: false },
      { suit: '♥', value: '5', selected: false },
      { suit: '♣', value: '7', selected: false },
      { suit: '♣', value: '7', selected: false },
      { suit: '♦', value: 'A', selected: false },
      { suit: '♠', value: 'A', selected: false },
    ];
    const player1Cards = [
      { suit: '♦', value: '2', selected: false },
      { suit: '♠', value: 'K', selected: false },
      { suit: '♥', value: 'K', selected: false },
      { suit: '♣', value: 'K', selected: false },
      { suit: '♦', value: '7', selected: false },
      { suit: '♠', value: '6', selected: false },
    ];
    const player2Cards = [
      { suit: '♣', value: '2', selected: false },
      { suit: '♦', value: 'A', selected: false },
      { suit: '♠', value: 'Q', selected: false },
      { suit: '♣', value: 'J', selected: false },
      { suit: '♦', value: '10', selected: false },
      { suit: '♠', value: '10', selected: false },
      { suit: '♣', value: '6', selected: false },
      { suit: '♦', value: '6', selected: false },
      { suit: '♠', value: '6', selected: false },
      { suit: '♣', value: '5', selected: false },
      { suit: '♦', value: '5', selected: false },
      { suit: '♠', value: '4', selected: false },
    ];
    const lastPlayedCards = [
      // { suit: '♥', value: '2', selected: false },
      // { suit: '♠', value: '2', selected: false },
    ];
    const currentPlayer = 0; // 设置当前玩家为玩家0 (人类玩家)

    store.dispatch('setupTestScenario', {
      player0Cards,
      player1Cards,
      player2Cards,
      lastPlayedCards,
      currentPlayer,
    });

    // 开始游戏
    store.commit('SET_GAME_STATE', 'PLAYING');
  };

  return {
    setupTestScenario,
  };
}