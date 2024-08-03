<template>
    <div class="start-screen">
      <h1>斗地主</h1>
      <button @click="$emit('start-game')">开始游戏</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'StartScreen'
  }
  </script>
  
  <style scoped>
  .start-screen {
    text-align: center;
  }
  </style>