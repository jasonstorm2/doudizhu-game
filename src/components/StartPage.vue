<template>
    <div class="start-page">
      <button @click="startGame" class="start-button">欢迎来到跑得快游戏</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'StartPage',
    methods: {
      startGame() {
        this.$router.push('/game');
      }
    }
  }
  </script>
  
  <style scoped>
  .start-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .start-button {
    font-size: 24px;
    padding: 10px 20px;
  }
  </style>