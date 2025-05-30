import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import Prompt from '../components/PromptCard.vue';
import AccountPage from '../components/AccountPage.vue';

const routes = [
  { path: '/', redirect: '/prompt' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/prompt', component: Prompt },
  {path: '/account', component: AccountPage}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
