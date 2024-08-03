<template>
    <div class="played-cards">
      <div v-for="(card, index) in cards" :key="index" class="card">
        {{ card.value }}
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PlayedCards',
    props: ['cards']
  }
  </script>
  
  <style scoped>
  .played-cards {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  
  .card {
    width: 40px;
    height: 60px;
    border: 1px solid black;
    margin: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>