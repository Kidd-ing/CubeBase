import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/module/:id',
    name: 'Module',
    component: () => import('@/views/ModulePage.vue')
  },
  {
    path: '/set/:id',
    name: 'Set',
    component: () => import('@/views/StateSetPage.vue')
  },
  {
    path: '/state/:id',
    name: 'StateDetail',
    component: () => import('@/views/StateDetailPage.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsPage.vue')
  },
  {
    path: '/settings/letter',
    name: 'SettingsLetter',
    component: () => import('@/views/SettingsLetterPage.vue')
  },
  {
    path: '/settings/data',
    name: 'SettingsData',
    component: () => import('@/views/SettingsDataPage.vue')
  },
  {
    path: '/settings/theme',
    name: 'SettingsTheme',
    component: () => import('@/views/SettingsThemePage.vue')
  },
  {
    path: '/settings/data/backup',
    name: 'SettingsBackup',
    component: () => import('@/views/SettingsBackupPage.vue')
  },
  {
    path: '/settings/about',
    name: 'SettingsAbout',
    component: () => import('@/views/SettingsAboutPage.vue')
  },
  {
    path: '/settings/changelog',
    name: 'UpdateLog',
    component: () => import('@/views/UpdateLogPage.vue')
  },
  {
    path: '/settings/theme/wallpaper',
    name: 'SettingsWallpaper',
    component: () => import('@/views/SettingsWallpaperPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
