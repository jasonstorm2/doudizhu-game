import { createRouter, createWebHistory } from 'vue-router'
import GameBoard from '../components/GameBoard.vue'

const routes = [

  {
    path: '/',
    name: 'Game',
    component: GameBoard
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router