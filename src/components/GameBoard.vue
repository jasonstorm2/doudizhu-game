<template>
  <div class="game-board">
    <h2>跑得快</h2>
    <p>游戏信息: {{ gameInfo }}</p>
    <start-screen v-if="gameState === 'START'" @start-game="startGame" />
    <template v-else>
      <div class="players-container">
        <div class="player player-left">
          <player-hand 
            :cards="players[2].cards" 
            :isCurrentPlayer="currentPlayer === 2"
            @select-card="selectCard(2, $event)"
          />
        </div>
        <div class="player player-right">
          <player-hand 
            :cards="players[1].cards" 
            :isCurrentPlayer="currentPlayer === 1"
            @select-card="selectCard(1, $event)"
          />
        </div>
        <div class="player player-bottom">
          <player-hand 
            :cards="players[0].cards" 
            :isCurrentPlayer="currentPlayer === 0"
            @select-card="selectCard(0, $event)"
          />
        </div>
      </div>
      <div class="played-cards-area">
        <played-cards :cards="playedCards" />
      </div>
      <button @click="playCards" :disabled="!canPlay">出牌</button>
    </template>
    <victory-screen 
      v-if="gameState === 'END'" 
      :winner="winner" 
      @restart="restartGame" 
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
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
  computed: {
    ...mapState(['gameState', 'players', 'currentPlayer', 'playedCards', 'winner']),
    canPlay() {
      return this.players[this.currentPlayer].selectedCards.length > 0;
    },
    gameInfo() {
      return `当前游戏状态: ${this.gameState}, 当前玩家: ${this.currentPlayer + 1}`;
    }
  },
  methods: {
    ...mapActions(['startGame', 'playCards', 'restartGame']),
    selectCard(playerIndex, cardIndex) {
      this.$store.dispatch('selectCard', { playerIndex, cardIndex });
    }
  }
}
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

.players-container {
  position: relative;
  width: 100%;
  height: 70vh;
}

.player {
  position: absolute;
}

.player-left {
  top: 20px;
  left: 20px;
}

.player-right {
  top: 20px;
  right: 20px;
}

.player-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.played-cards-area {
  margin-top: 20px;
}
</style>