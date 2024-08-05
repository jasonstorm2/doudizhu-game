<template>
  <div class="game-board">

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
            <button @click="handlePlayCards(2)" :disabled="currentPlayer !== 2">出牌</button>
            <button @click="handlePass(2)" :disabled="currentPlayer !== 2 || !canPass(2)">过牌</button>
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
import { computed } from 'vue';
import { useStore } from 'vuex';
import StartScreen from './StartScreen.vue';
import PlayerHand from './PlayerHand.vue';
import PlayedCards from './PlayedCards.vue';
import VictoryScreen from './VictoryScreen.vue';
import { validateCardPattern, isGreaterThanLastPlay, canPass } from '../api/gameApi.js';
import { EventBus } from '../eventBus';

import { ref, onMounted } from 'vue';

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

    const isMusicPlaying = ref(false);
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

    const gameState = computed(() => store.state.gameState);
    const players = computed(() => store.state.players);
    const currentPlayer = computed(() => store.state.currentPlayer);
    const playedCards = computed(() => store.state.playedCards);
    const lastPlayedCards = computed(() => store.state.lastPlayedCards);
    const winner = computed(() => store.state.winner);
    const backgroundMusic = ref(null);

    const stopBackgroundMusic = () => {
      if (backgroundMusic.value) {
        backgroundMusic.value.pause();
        backgroundMusic.value.currentTime = 0;
      }
    };
    const startGame = () => {
      store.dispatch('startGame');
      for (let i = 0; i < 3; i++) {
        store.dispatch('sortPlayerCards', i);
      }
      playBackgroundMusic();
    };

    const playBackgroundMusic = () => {
      if (backgroundMusic.value) {
        backgroundMusic.value.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    };

    onMounted(() => {
      // 预加载音频
      if (backgroundMusic.value) {
        backgroundMusic.value.load();
      }
    });
    const restartGame = () => store.dispatch('restartGame');

    const handleSelectCard = (playerIndex, cardIndex) =>
      store.dispatch('selectCard', { playerIndex, cardIndex });

    const handlePlayCards = (playerIndex) => {
      const selectedCards = players.value[playerIndex].cards.filter(card => card.selected);
      if (validateCardPattern(selectedCards)) {
        if (!lastPlayedCards.value || isGreaterThanLastPlay(selectedCards, lastPlayedCards.value)) {
          store.dispatch('playCards', playerIndex);
        } else {
          // 使用这行
          EventBus.emit('show-alert', '出的牌必须大于上家的牌！');
        }
      } else {
        // 使用这行
        EventBus.emit('show-alert', '无效的牌型啦！');
      }
    };

    const handlePass = (playerIndex) => {
      if (canPass(players.value[playerIndex].cards, lastPlayedCards.value)) {
        store.dispatch('passPlay', playerIndex);
      } else {
        EventBus.emit('show-alert', '不能过牌！');

      }
    };



    return {
      backgroundMusic,
      isMusicPlaying,
      toggleMusic,
      gameState,
      stopBackgroundMusic,
      players,
      currentPlayer,
      playedCards,
      winner,
      startGame,
      restartGame,
      handleSelectCard,
      handlePlayCards,
      handlePass,
      canPass: (playerIndex) => canPass(players.value[playerIndex].cards, lastPlayedCards.value)
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
</style>