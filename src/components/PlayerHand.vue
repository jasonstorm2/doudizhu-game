<template>
  <div class="player-hand" :class="{ 'current-player': isCurrentPlayer }">
    <div 
      v-for="(card, index) in sortedCards" 
      :key="index" 
      class="card" 
      :class="{ 'selected': card.selected }"
      @click="selectCard(index)"
    >
      {{ card.suit }}{{ card.value }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerHand',
  props: ['cards', 'isCurrentPlayer'],
  computed: {
    sortedCards() {
      const order = ['Joker', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
      return [...this.cards].sort((a, b) => {
        if (a.suit === 'Joker' && b.suit === 'Joker') {
          return a.value === 'Big' ? -1 : 1;
        }
        return order.indexOf(a.value) - order.indexOf(b.value);
      });
    }
  },
  methods: {
    selectCard(index) {
      if (this.isCurrentPlayer) {
        this.$emit('select-card', index);
      }
    }
  }
}
</script>

<style scoped>
.player-hand {
  display: flex;
  flex-wrap: wrap;
  width: 200px;
}

.card {
  width: 40px;
  height: 60px;
  border: 1px solid black;
  margin: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 12px;
}

.card.selected {
  transform: translateY(-10px);
}

.current-player .card:hover {
  background-color: #f0f0f0;
}
</style>