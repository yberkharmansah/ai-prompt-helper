<script setup>
import Navbar from './components/Navbar.vue';
import { useUserStore } from './stores/user';

const userStore = useUserStore();
userStore.init();
</script>

<template>
  <div class="app-shell">
    <Navbar />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>
