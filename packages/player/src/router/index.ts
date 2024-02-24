import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/MobilePlayer.vue')
    },
    {
      path: '/player',
      name: 'player',
      component: () => import('../views/PCPlayer.vue')
    }
  ]
})

export default router
