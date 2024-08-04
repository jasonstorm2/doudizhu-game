<template>
  <div class="game-board">
    <!-- <h2>跑得快</h2> -->
    <!-- <p>游戏信息: {{ gameInfo }}</p> -->
    <start-screen v-if="gameState === 'START'" @start-game="startGame" />
    <template v-else-if="gameState === 'PLAYING'">
      <div class="game-area">
        <div class="players-container">
          <div class="player player-1">
            <player-hand 
              :cards="players[1].cards" 
              :isCurrentPlayer="currentPlayer === 1"
              @select-card="(cardIndex) => handleSelectCard(1, cardIndex)"
            />
            <button @click="handlePlayCards(1)" :disabled="currentPlayer !== 1">出牌</button>
          </div>
          <div class="player player-2">
            <player-hand 
              :cards="players[2].cards" 
              :isCurrentPlayer="currentPlayer === 2"
              @select-card="(cardIndex) => handleSelectCard(2, cardIndex)"
            />
            <button @click="handlePlayCards(2)" :disabled="currentPlayer !== 2">出牌</button>
          </div>
        </div>
        
        <div class="played-cards-area">
          <played-cards :cards="playedCards" />
        </div>
        
        <div class="player player-0">
          <player-hand 
            :cards="players[0].cards" 
            :isCurrentPlayer="currentPlayer === 0"
            @select-card="(cardIndex) => handleSelectCard(0, cardIndex)"
          />
          <button @click="handlePlayCards(0)" :disabled="currentPlayer !== 0">出牌</button>
        </div>
      </div>
    </template>
    <victory-screen 
      v-if="gameState === 'END'" 
      :winner="winner" 
      @restart="restartGame" 
    />
  </div>
  <div class="played-cards-area">
    <played-cards :cards="playedCards" />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import StartScreen from './StartScreen.vue';
import PlayerHand from './PlayerHand.vue';
import PlayedCards from './PlayedCards.vue';
import VictoryScreen from './VictoryScreen.vue';

export default {
  name: 'GameBoard',
  
  components: {
    StartScreen,
    PlayerHand,
    PlayedCards,
    VictoryScreen
  },
  setup() {
    const store = useStore();

    const gameState = computed(() => store.state.gameState);
    const players = computed(() => store.state.players);
    const currentPlayer = computed(() => store.state.currentPlayer);
    const playedCards = computed(() => store.state.playedCards);
    


    const winner = computed(() => store.state.winner);

    const gameInfo = computed(() => 
      `当前游戏状态: ${gameState.value}, 当前玩家: ${currentPlayer.value + 1}`
    );

    // const startGame = () => store.dispatch('startGame');
    const startGame = () => {
  store.dispatch('startGame');
  // 确保所有玩家的牌都已排序
  for (let i = 0; i < 3; i++) {
    store.dispatch('sortPlayerCards', i);
  }
};

    const restartGame = () => store.dispatch('restartGame');
    const handleSelectCard = (playerIndex, cardIndex) => 
      store.dispatch('selectCard', { playerIndex, cardIndex });
    const handlePlayCards = (playerIndex) => 
      store.dispatch('playCards', playerIndex);

    return {
      gameState,
      players,
      currentPlayer,
      playedCards,
      winner,
      gameInfo,
      startGame,
      restartGame,
      handleSelectCard,
      handlePlayCards
    };
  },



};
</script>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
  padding: 20px;
}

.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 80vh;
}

.players-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
}

.player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-0 {
  margin-top: 20px;
}

.played-cards-area {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100px;
  border: 1px dashed #ccc;
  margin: 20px 0;
}

button {
  margin-top: 10px;
}
</style>