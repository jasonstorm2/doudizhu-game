<template>
  <div class="game-board">
    <div v-if="isAIThinking" class="ai-thinking-indicator">
      AI正在思考中...
    </div>
    <audio ref="backgroundMusic" loop>
      <source src="/assets/bgm1.mp3" type="audio/mpeg">
    </audio>
    <start-screen v-if="gameState === 'START'" @start-game="startGame" />
    <template v-else-if="gameState === 'PLAYING'">
      <button @click="toggleMusic">{{ isMusicPlaying ? '关闭音乐' : '开启音乐' }}</button>

      <div class="game-area">
        <div class="players-container">
          <div class="player player-1">
            <player-hand :cards="players[1].cards" :isCurrentPlayer="currentPlayer === 1"
              @select-card="(cardIndex) => handleSelectCard(1, cardIndex)" />
            <button @click="handlePlayCards(1)" :disabled="currentPlayer !== 1">出牌</button>
            <button @click="handlePass(1)" :disabled="currentPlayer !== 1 || !canPass(1)">过牌</button>
          </div>
          <div class="player player-2">
            <player-hand :cards="players[2].cards" :isCurrentPlayer="currentPlayer === 2"
              @select-card="(cardIndex) => handleSelectCard(2, cardIndex)" />
            <button @click="handlePlayCards(2)" :disabled="currentPlayer !== 2">AI 出牌</button>
            <button @click="handlePass(2)" :disabled="currentPlayer !== 2 || !canPass(2)">AI 过牌</button>
          </div>
        </div>

        <div class="played-cards-area">
          <played-cards :cards="playedCards" />
        </div>

        <div class="player player-0">
          <player-hand :cards="players[0].cards" :isCurrentPlayer="currentPlayer === 0"
            @select-card="(cardIndex) => handleSelectCard(0, cardIndex)" />
          <button @click="handlePlayCards(0)" :disabled="currentPlayer !== 0">出牌</button>
          <button @click="handlePass(0)" :disabled="currentPlayer !== 0 || !canPass(0)">过牌</button>
        </div>
      </div>
    </template>
    <victory-screen v-if="gameState === 'END'" :winner="winner" @restart="restartGame" />
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { EventBus } from '../eventBus';
import PlayedCards from './PlayedCards.vue';
import PlayerHand from './PlayerHand.vue';
import StartScreen from './StartScreen.vue';
import VictoryScreen from './VictoryScreen.vue';
import { AIPlayer } from '../players/AIPlayer';

export default {
  name: 'GameBoard',
  components: { StartScreen, PlayerHand, PlayedCards, VictoryScreen },
  setup() {
    const store = useStore();
    const isAIThinking = ref(false);
    const isMusicPlaying = ref(false);
    const backgroundMusic = ref(null);

    const players = computed(() => store.state.players);

    const gameState = computed(() => store.state.gameState);
    const currentPlayer = computed(() => store.state.currentPlayer);
    const playedCards = computed(() => store.state.playedCards);
    // const lastPlayedCards = computed(() => store.state.lastPlayedCards);
    const winner = computed(() => store.state.winner);

    onMounted(() => {
      if (backgroundMusic.value) {
        backgroundMusic.value.load();
      }
    });

    const startGame = () => {
      store.dispatch('startGame');
      players.value.forEach((player, index) => {
        player.cards = store.state.players[index].cards;
      });
      for (let i = 0; i < 3; i++) {
        store.dispatch('sortPlayerCards', i);
      }
      playBackgroundMusic();
    };

    const toggleMusic = () => {
      if (backgroundMusic.value) {
        if (backgroundMusic.value.paused) {
          backgroundMusic.value.play();
          isMusicPlaying.value = true;
        } else {
          backgroundMusic.value.pause();
          isMusicPlaying.value = false;
        }
      }
    };

    const playBackgroundMusic = () => {
      if (backgroundMusic.value) {
        backgroundMusic.value.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    };

    const restartGame = () => store.dispatch('restartGame');

    const handleSelectCard = (playerIndex, cardIndex) =>
      players.value[playerIndex].selectCard(cardIndex);

    const handlePlayCards = async (playerIndex) => {
      const player = players.value[playerIndex];
      if (!player) {
        console.error(`Player at index ${playerIndex} is undefined`);
        return;
      }

      const lastPlayedCards = store.state.lastPlayedCards;
      
      if (player instanceof AIPlayer) {
        isAIThinking.value = true;
        try {
          const gameState = {
            "你目前的手牌": player.cards.map(card => card.value),
            "上家出牌": lastPlayedCards ? lastPlayedCards.map(card => card.value) : [],
            "玩家出牌历史": store.state.gameInfo.historyInfo.history,
            "上家牌型": store.state.lastPlayedType
          };
          const result = await player.playCards(lastPlayedCards, gameState);
          if (result === 'pass') {
            handlePass(playerIndex);
          } else if (result) {
            store.dispatch('playCards', { playerIndex, cards: result });
          }
        } finally {
          isAIThinking.value = false;
        }
      } else {
        const result = player.playCards(lastPlayedCards);
        if (result) {
          store.dispatch('playCards', playerIndex );
        }
      }
    };

    const handlePass = (playerIndex) => {
      const player = players.value[playerIndex];
      if (player.canPass(store.state.lastPlayedCards)) {
        store.dispatch('passPlay', playerIndex);
      } else {
        EventBus.emit('show-alert', '不能过牌！');
      }
    };

    const canPass = (playerIndex) => {
      const player = players.value[playerIndex];
      const isFirstPlayer = store.state.currentRoundStartPlayer === playerIndex;
      return player.canPass(store.state.lastPlayedCards, isFirstPlayer);
    };

    return {
      backgroundMusic,
      isMusicPlaying,
      toggleMusic,
      gameState,
      players,
      currentPlayer,
      playedCards,
      winner,
      startGame,
      restartGame,
      handleSelectCard,
      handlePlayCards,
      handlePass,
      isAIThinking,
      canPass
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
  margin-right: 5px;
}

.ai-thinking-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
}
</style>